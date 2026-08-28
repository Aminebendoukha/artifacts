// backend/src/routes/auth.js
// Real JWT auth routes: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
// Mounted BEFORE the global `auth` middleware in app.js, so register/login are
// public; /me protects itself by requiring the auth middleware explicitly.
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { ApiError } from "../middleware/errorHandler.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

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
    const { email, password, companyName, role } = req.body ?? {};

    if (!email || !password || !companyName || !role) {
      throw new ApiError(400, "email, password, companyName, and role are required.");
    }

    if (!["CLIENT", "ADMIN"].includes(role)) {
      throw new ApiError(400, "role must be either CLIENT or ADMIN.");
    }

    if (password.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters long.");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError(409, "An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const created = await prisma.$transaction(async (tx) => {
      let workspace = await tx.workspace.findFirst({ where: { name: companyName } });
      if (!workspace || role === "CLIENT") {
        workspace = await tx.workspace.create({ data: { name: companyName } });
      }

      return tx.user.create({
        data: {
          email,
          passwordHash,
          role,
          workspaceId: workspace.id,
        },
      });
    });

    const token = signToken(created);
    res.status(201).json({ token, user: sanitizeUser(created) });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * body: { email, password }
 * Returns a signed JWT with payload { userId, role, workspaceId }.
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      throw new ApiError(400, "email and password are required.");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const token = signToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
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
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      throw new ApiError(404, "User not found.");
    }
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
});

export default router;
