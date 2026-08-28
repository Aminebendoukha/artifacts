import express from "express";
import prisma from "../lib/prisma.js";
import { ApiError } from "../middleware/errorHandler.js";
import { toNumber, money, formatInvoiceLabel, parseBudgetRange } from "../lib/billing.js";

const router = express.Router();

const orderSelect = {
  id: true,
  orderNumber: true,
  projectName: true,
  serviceType: true,
  description: true,
  budgetRange: true,
  deadline: true,
  status: true,
  workspaceId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  workspace: {
    select: {
      id: true,
      name: true,
    },
  },
  attachments: {
    select: {
      id: true,
      fileName: true,
      fileUrl: true,
      uploadedById: true,
      commentId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  },
  invoices: {
    select: {
      id: true,
      invoiceNumber: true,
      amount: true,
      status: true,
      dueDate: true,
      paidAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  },
  comments: {
    select: {
      id: true,
      text: true,
      createdAt: true,
      userId: true,
      user: {
        select: {
          id: true,
          role: true,
          workspace: { select: { name: true } },
        },
      },
      attachments: {
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          uploadedById: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  activities: {
    select: {
      id: true,
      type: true,
      summary: true,
      createdAt: true,
      userId: true,
      user: {
        select: {
          id: true,
          role: true,
          workspace: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
};

function normalizeAttachments(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((attachment, index) => {
      if (typeof attachment === "string") {
        return {
          fileName: attachment,
          fileUrl: `/uploads/${encodeURIComponent(attachment)}`,
        };
      }

      if (attachment && typeof attachment === "object") {
        const fileName = attachment.fileName ?? attachment.name ?? `attachment-${index + 1}`;
        return {
          fileName,
          fileUrl: attachment.fileUrl ?? attachment.url ?? `/uploads/${encodeURIComponent(fileName)}`,
        };
      }

      return null;
    })
    .filter(Boolean);
}

async function generateOrderNumber(tx) {
  const latest = await tx.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  const parsed = latest ? Number.parseInt(String(latest.orderNumber).replace(/^ORD-/, ""), 10) : Number.NaN;
  const nextNumber = Number.isFinite(parsed) ? parsed + 1 : 1000;
  return `ORD-${nextNumber}`;
}

async function buildInvoice(tx, order, invoiceStatus = "UNPAID") {
  const total = parseBudgetRange(order.budgetRange);
  const amount = invoiceStatus === "PENDING_DEPOSIT" ? total * 0.5 : total;
  const count = await tx.invoice.count();
  return tx.invoice.create({
    data: {
      invoiceNumber: formatInvoiceLabel(count + 1),
      orderId: order.id,
      amount,
      status: invoiceStatus,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    },
  });
}

router.get("/", async (req, res, next) => {
  try {
    const where = req.user.role === "ADMIN" ? {} : { workspaceId: req.user.workspaceId };
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: orderSelect,
    });

    res.json(orders.map((order) => ({
      ...order,
      invoices: order.invoices.map((invoice) => ({ ...invoice, amount: toNumber(invoice.amount) })),
    })));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      select: orderSelect,
    });

    if (!order) {
      throw new ApiError(404, "Order not found.");
    }

    if (req.user.role !== "ADMIN" && order.workspaceId !== req.user.workspaceId) {
      throw new ApiError(404, "Order not found.");
    }

    res.json({
      ...order,
      invoices: order.invoices.map((invoice) => ({ ...invoice, amount: toNumber(invoice.amount) })),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      projectName,
      serviceType,
      description,
      budgetRange,
      deadline,
      attachments = [],
    } = req.body ?? {};

    if (!projectName || !serviceType || !description || !budgetRange || !deadline) {
      throw new ApiError(400, "projectName, serviceType, description, budgetRange, and deadline are required.");
    }

    const deadlineDate = new Date(deadline);
    if (Number.isNaN(deadlineDate.getTime())) {
      throw new ApiError(400, "deadline must be a valid date.");
    }

    const normalizedAttachments = normalizeAttachments(attachments);

    const created = await prisma.$transaction(async (tx) => {
      const orderNumber = await generateOrderNumber(tx);

      const order = await tx.order.create({
        data: {
          orderNumber,
          projectName,
          serviceType,
          description,
          budgetRange,
          deadline: deadlineDate,
          status: "PENDING",
          workspaceId: req.user.workspaceId,
          createdById: req.user.id,
        },
      });

      const invoiceStatus = "PENDING_DEPOSIT";
      const invoice = await buildInvoice(tx, order, invoiceStatus);

      if (normalizedAttachments.length > 0) {
        await tx.attachment.createMany({
          data: normalizedAttachments.map((attachment) => ({
            fileName: attachment.fileName,
            fileUrl: attachment.fileUrl,
            orderId: order.id,
            uploadedById: req.user.id,
          })),
        });
      }

      await tx.orderActivity.create({
        data: {
          orderId: order.id,
          userId: req.user.id,
          type: "ORDER_CREATED",
          summary: `Order ${order.orderNumber} created`,
        },
      });

      await tx.orderActivity.create({
        data: {
          orderId: order.id,
          userId: req.user.id,
          type: "INVOICE_CREATED",
          summary: `${invoice.invoiceNumber} created for ${money(invoice.amount)}`,
        },
      });

      return tx.order.findUnique({
        where: { id: order.id },
        select: orderSelect,
      });
    });

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      throw new ApiError(403, "Only admins can update order status.");
    }

    const { status } = req.body ?? {};
    const allowedStatuses = ["PENDING", "IN_PROGRESS", "REVIEW", "COMPLETED"];

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, "status must be one of PENDING, IN_PROGRESS, REVIEW, or COMPLETED.");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: req.params.id },
        data: { status },
        select: orderSelect,
      });

      await tx.orderActivity.create({
        data: {
          orderId: order.id,
          userId: req.user.id,
          type: "STATUS_CHANGED",
          summary: `Status changed to ${status}`,
        },
      });

      return order;
    });

    res.json({
      ...updated,
      invoices: updated.invoices.map((invoice) => ({ ...invoice, amount: toNumber(invoice.amount) })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/thread", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        workspaceId: true,
        comments: {
          select: {
            id: true,
            text: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                role: true,
                workspace: { select: { name: true } },
              },
            },
            attachments: {
              select: {
                id: true,
                fileName: true,
                fileUrl: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        activities: {
          select: {
            id: true,
            type: true,
            summary: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                role: true,
                workspace: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, "Order not found.");
    }

    if (req.user.role !== "ADMIN" && order.workspaceId !== req.user.workspaceId) {
      throw new ApiError(404, "Order not found.");
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/comments", async (req, res, next) => {
  try {
    const { text, attachments = [] } = req.body ?? {};
    if (!text?.trim()) {
      throw new ApiError(400, "Comment text is required.");
    }

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      select: { id: true, workspaceId: true, orderNumber: true },
    });

    if (!order) {
      throw new ApiError(404, "Order not found.");
    }

    if (req.user.role !== "ADMIN" && order.workspaceId !== req.user.workspaceId) {
      throw new ApiError(404, "Order not found.");
    }

    const created = await prisma.$transaction(async (tx) => {
      const comment = await tx.orderComment.create({
        data: {
          orderId: order.id,
          userId: req.user.id,
          text: text.trim(),
        },
        select: {
          id: true,
          text: true,
          createdAt: true,
          user: { select: { id: true, role: true, workspace: { select: { name: true } } } },
        },
      });

      if (Array.isArray(attachments) && attachments.length > 0) {
        await tx.attachment.createMany({
          data: attachments.map((attachment) => ({
            fileName: attachment.fileName,
            fileUrl: attachment.fileUrl,
            orderId: order.id,
            commentId: comment.id,
            uploadedById: req.user.id,
          })),
        });
      }

      await tx.orderActivity.create({
        data: {
          orderId: order.id,
          userId: req.user.id,
          type: "COMMENT",
          summary: `Comment posted on ${order.orderNumber}`,
        },
      });

      return tx.orderComment.findUnique({
        where: { id: comment.id },
        select: {
          id: true,
          text: true,
          createdAt: true,
          user: { select: { id: true, role: true, workspace: { select: { name: true } } } },
          attachments: { select: { id: true, fileName: true, fileUrl: true, createdAt: true } },
        },
      });
    });

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

export default router;