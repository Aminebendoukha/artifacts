import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const where = req.user.role === "ADMIN" ? {} : { order: { workspaceId: req.user.workspaceId } };
    const activities = await prisma.orderActivity.findMany({
      where,
      include: {
        order: { select: { id: true, orderNumber: true, projectName: true } },
        user: { select: { id: true, role: true, workspace: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    res.json(activities);
  } catch (error) {
    next(error);
  }
});

export default router;