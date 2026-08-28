import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { ApiError } from "../middleware/errorHandler.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET ?? "orbit-dev-secret";
const TOKEN_TTL = "7d";

function normalizeRole(role) {
  const value = String(role ?? "CLIENT").toUpperCase();
  if (value !== "ADMIN" && value !== "CLIENT") {
    throw new ApiError(400, "role must be ADMIN or CLIENT.");
  }

  return value;
}

function signToken(user) {
  const payload = {
    userId: user.id,
    role: user.role,
    workspaceId: user.workspaceId,
    email: user.email,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function toAuthResponse(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    workspaceId: user.workspaceId,
    workspaceName: user.workspace?.name ?? null,
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, companyName, role } = req.body ?? {};

    if (!email?.trim() || !password || !companyName?.trim()) {
      throw new ApiError(400, "email, password, and companyName are required.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = normalizeRole(role);

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new ApiError(409, "An account with that email already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const created = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: companyName.trim(),
        },
      });

      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: hashedPassword,
          role: normalizedRole,
          workspaceId: workspace.id,
        },
        select: {
          id: true,
          email: true,
          role: true,
          workspaceId: true,
          workspace: { select: { name: true } },
        },
      });

      return user;
    });

    const token = signToken(created);
    res.status(201).json({ token, user: toAuthResponse(created) });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email?.trim() || !password) {
      throw new ApiError(400, "email and password are required.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        role: true,
        workspaceId: true,
        passwordHash: true,
        workspace: { select: { name: true } },
      },
    });

    if (!user) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const token = signToken(user);
    res.json({ token, user: toAuthResponse(user) });
  } catch (error) {
    next(error);
  }
});

export default router;