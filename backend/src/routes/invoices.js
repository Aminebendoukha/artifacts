import express from "express";
import prisma from "../lib/prisma.js";
import { ApiError } from "../middleware/errorHandler.js";
import { toNumber } from "../lib/billing.js";

const router = express.Router();

const invoiceSelect = {
  id: true,
  invoiceNumber: true,
  amount: true,
  status: true,
  dueDate: true,
  paidAt: true,
  createdAt: true,
  order: {
    select: {
      id: true,
      orderNumber: true,
      projectName: true,
      status: true,
      workspaceId: true,
      workspace: { select: { name: true } },
    },
  },
};

router.get("/", async (req, res, next) => {
  try {
    const workspaceFilter =
      req.user.role === "ADMIN"
        ? { order: { status: { in: ["IN_PROGRESS", "REVIEW", "COMPLETED"] } } }
        : { order: { workspaceId: req.user.workspaceId, status: { in: ["IN_PROGRESS", "REVIEW", "COMPLETED"] } } };
    const invoices = await prisma.invoice.findMany({
      where: workspaceFilter,
      orderBy: { createdAt: "desc" },
      select: invoiceSelect,
    });

    res.json(invoices.map((invoice) => ({ ...invoice, amount: toNumber(invoice.amount) })));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/pay", async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { order: true },
    });

    if (!invoice) {
      throw new ApiError(404, "Invoice not found.");
    }

    if (req.user.role !== "ADMIN" && invoice.order.workspaceId !== req.user.workspaceId) {
      throw new ApiError(404, "Invoice not found.");
    }

    const paidAt = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: "PAID", paidAt },
        select: invoiceSelect,
      });

      await tx.orderActivity.create({
        data: {
          orderId: invoice.orderId,
          userId: req.user.id,
          type: "PAYMENT_MADE",
          summary: `${invoice.invoiceNumber} marked as paid`,
        },
      });

      return result;
    });

    res.json({ ...updated, amount: toNumber(updated.amount) });
  } catch (error) {
    next(error);
  }
});

export default router;