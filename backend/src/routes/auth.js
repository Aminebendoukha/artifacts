import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { ApiError } from "../middleware/errorHandler.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_EMAIL_LENGTH = 254;
const MAX_WORKSPACE_NAME_LENGTH = 120;

function signToken(user) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      workspaceId: user.workspaceId,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeWorkspaceName(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function validatePassword(password) {
  if (typeof password !== "string") {
    throw new ApiError(400, "Password is required.");
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(
      400,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    );
  }

  if (password.length > 128) {
    throw new ApiError(400, "Password must be 128 characters or fewer.");
  }

  if (!/[a-z]/.test(password)) {
    throw new ApiError(400, "Password must include a lowercase letter.");
  }

  if (!/[A-Z]/.test(password)) {
    throw new ApiError(400, "Password must include an uppercase letter.");
  }

  if (!/\d/.test(password)) {
    throw new ApiError(400, "Password must include a number.");
  }
}

function validateEmail(email) {
  if (!email) {
    throw new ApiError(400, "Email is required.");
  }

  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    throw new ApiError(400, "Enter a valid email address.");
  }
}

/*
 * POST /api/auth/register
 * Public registration is deliberately client-only.
 * Never accept a client-controlled role in a public endpoint.
 */
router.post("/register", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const companyName = normalizeWorkspaceName(req.body?.companyName);
    const password = req.body?.password;

    validateEmail(email);
    validatePassword(password);

    if (!companyName) {
      throw new ApiError(400, "Workspace name is required.");
    }

    if (companyName.length > MAX_WORKSPACE_NAME_LENGTH) {
      throw new ApiError(
        400,
        `Workspace name must be ${MAX_WORKSPACE_NAME_LENGTH} characters or fewer.`,
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ApiError(
        409,
        "An account with this email already exists. Please sign in instead.",
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const createdUser = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { name: companyName },
      });

      return tx.user.create({
        data: {
          email,
          passwordHash,
          role: "CLIENT",
          workspaceId: workspace.id,
        },
      });
    });

    const token = signToken(createdUser);

    res.status(201).json({
      token,
      user: sanitizeUser(createdUser),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;

    validateEmail(email);

    if (typeof password !== "string" || !password) {
      throw new ApiError(400, "Password is required.");
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const token = signToken(user);

    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
});

export default router;