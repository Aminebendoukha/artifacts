import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { ApiError } from "./errorHandler.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "orbit-dev-secret";

export async function auth(req, _res, next) {
  try {
    const authHeader = req.header("authorization") ?? req.header("Authorization") ?? "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new ApiError(401, "Authentication required.");
    }

    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload?.userId) {
      throw new ApiError(401, "Invalid token.");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        workspaceId: true,
        workspace: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      throw new ApiError(401, "User not found.");
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId,
      workspaceName: user.workspace.name,
    };

    next();
  } catch (error) {
    next(error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError ? new ApiError(401, "Invalid or expired token.") : error);
  }
}