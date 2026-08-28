// backend/src/routes/auth.js
// Real JWT auth routes: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
// Mounted BEFORE the global `auth` middleware in app.js, so register/login are
// public; /me protects itself by requiring the auth middleware explicitly.
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { auth } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function signToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      workspaceId: user.workspaceId,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

/**
 * POST /api/auth/register
 * body: { email, password, companyName, role }
 * role: "CLIENT" | "ADMIN"
 */
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, companyName, role } = req.body;

    if (!email || !password || !companyName || !role) {
      return res.status(400).json({
        error: "email, password, companyName, and role are required.",
      });
    }

    if (!["CLIENT", "ADMIN"].includes(role)) {
      return res.status(400).json({ error: "role must be either CLIENT or ADMIN." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let workspace = await prisma.workspace.findFirst({ where: { name: companyName } });
    if (!workspace || role === "CLIENT") {
      workspace = await prisma.workspace.create({ data: { name: companyName } });
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        workspaceId: workspace.id,
      },
    });

    const token = signToken(user);
    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/auth/login
 * body: { email, password }
 * Returns a signed JWT with payload { userId, role, workspaceId }.
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/auth/me
 * Used by the frontend AuthProvider to rehydrate session state on page load.
 * Requires the auth middleware explicitly since this router is mounted
 * before the global `app.use(auth)` call in app.js.
 */
router.get("/me", auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return next(err);
  }
});

export default router;
