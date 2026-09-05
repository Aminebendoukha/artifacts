// backend/src/routes/invites.js
import express from "express";
import prisma from "../lib/prisma.js";
import { ApiError } from "../middleware/errorHandler.js";
import { requireRole } from "../middleware/auth.js";

const router = express.Router();

// POST /api/invites — Admin creates an invite
router.post("/", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { email, workspaceId } = req.body;

    if (!email || !workspaceId) {
      throw new ApiError(400, "email and workspaceId are required.");
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new ApiError(404, "Workspace not found.");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const invite = await prisma.invite.create({
      data: {
        email: email.toLowerCase().trim(),
        workspaceId,
        expiresAt,
        status: "PENDING",
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // In production, send email with link containing invite.token
    // For now, just return the token so we can test in the UI.
    res.status(201).json({
      ok: true,
      data: {
        id: invite.id,
        email: invite.email,
        workspaceId: invite.workspaceId,
        token: invite.token,
        expiresAt: invite.expiresAt.toISOString(),
        status: invite.status,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/invites/:token — Public: fetch invite details
router.get("/:token", async (req, res, next) => {
  try {
    const { token } = req.params;

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invite) {
      throw new ApiError(404, "Invite not found.");
    }

    const now = new Date();
    if (invite.status !== "PENDING" || invite.expiresAt < now) {
      throw new ApiError(400, "This invite is no longer valid.");
    }

    res.json({
      ok: true,
      data: {
        id: invite.id,
        email: invite.email,
        workspace: invite.workspace,
        expiresAt: invite.expiresAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/invites/:token/accept — Public: accept invite & create user
router.post("/:token/accept", async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters.");
    }

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        workspace: true,
      },
    });

    if (!invite) {
      throw new ApiError(404, "Invite not found.");
    }

    const now = new Date();
    if (invite.status !== "PENDING" || invite.expiresAt < now) {
      throw new ApiError(400, "This invite is no longer valid.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
    });

    if (existingUser) {
      throw new ApiError(400, "A user with this email already exists.");
    }

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: invite.email,
        password: hashedPassword,
        role: "CLIENT",
        workspaceId: invite.workspaceId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        workspaceId: true,
      },
    });

    await prisma.invite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    });

    const jwt = await import("jsonwebtoken");
    const JWT_SECRET = process.env.JWT_SECRET;

    const authToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        workspaceId: user.workspaceId,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      ok: true,
      data: {
        token: authToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          workspaceId: user.workspaceId,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/invites — Admin: list invites for a workspace
router.get("/", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { workspaceId } = req.query;

    if (!workspaceId) {
      throw new ApiError(400, "workspaceId query param is required.");
    }

    const invites = await prisma.invite.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    res.json({
      ok: true,
      data: invites,
    });
  } catch (err) {
    next(err);
  }
});

export default router;