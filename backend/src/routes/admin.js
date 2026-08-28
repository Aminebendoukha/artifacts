import express from "express";
import prisma from "../lib/prisma.js";
import { ApiError } from "../middleware/errorHandler.js";
import { toNumber } from "../lib/billing.js";

const router = express.Router();

async function getWorkspaceFinancials() {
  const workspaces = await prisma.workspace.findMany({
    include: {
      orders: {
        include: { invoices: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return workspaces;
}

router.get("/metrics", async (_req, res, next) => {
  try {
    if (_req.user.role !== "ADMIN") {
      throw new ApiError(403, "Admin access required.");
    }

    const invoices = await prisma.invoice.findMany({ include: { order: true } });
    const paidInvoices = invoices.filter((invoice) => invoice.status === "PAID");
    const outstandingInvoices = invoices.filter((invoice) => invoice.status !== "PAID").length;
    const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + toNumber(invoice.amount), 0);
    const averageOrderValue = invoices.length > 0 ? invoices.reduce((sum, invoice) => sum + toNumber(invoice.amount), 0) / invoices.length : 0;

    res.json({
      totalRevenue,
      outstandingInvoices,
      averageOrderValue,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/analytics", async (_req, res, next) => {
  try {
    if (_req.user.role !== "ADMIN") {
      throw new ApiError(403, "Admin access required.");
    }

    const orders = await prisma.order.findMany({
      include: { invoices: true },
      orderBy: { createdAt: "asc" },
    });

    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: date.toLocaleString("en-US", { month: "short" }),
        orders: 0,
        revenue: 0,
      });
    }

    orders.forEach((order) => {
      const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, "0")}`;
      const month = months.find((entry) => entry.key === key);
      if (month) {
        month.orders += 1;
        month.revenue += order.invoices.reduce((sum, invoice) => sum + (invoice.status === "PAID" ? toNumber(invoice.amount) : 0), 0);
      }
    });

    const serviceTotals = orders.reduce((accumulator, order) => {
      const paidRevenue = order.invoices.reduce((sum, invoice) => sum + (invoice.status === "PAID" ? toNumber(invoice.amount) : 0), 0);
      accumulator[order.serviceType] = (accumulator[order.serviceType] ?? 0) + paidRevenue;
      return accumulator;
    }, {});

    const revenueByServiceType = Object.entries(serviceTotals).map(([serviceType, revenue]) => ({
      serviceType,
      revenue,
    }));

    res.json({
      orderVelocity: months.map(({ key, ...rest }) => rest),
      revenueByServiceType,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/clients", async (_req, res, next) => {
  try {
    if (_req.user.role !== "ADMIN") {
      throw new ApiError(403, "Admin access required.");
    }

    const workspaces = await getWorkspaceFinancials();

    const clients = workspaces.map((workspace) => {
      const activeProjects = workspace.orders.filter((order) => order.status !== "COMPLETED").length;
      const totalSpend = workspace.orders.reduce((sum, order) => {
        const paid = order.invoices.reduce((invoiceTotal, invoice) => invoiceTotal + (invoice.status === "PAID" ? toNumber(invoice.amount) : 0), 0);
        return sum + paid;
      }, 0);

      return {
        id: workspace.id,
        name: workspace.name,
        createdAt: workspace.createdAt,
        activeProjects,
        totalSpend,
      };
    });

    res.json(clients);
  } catch (error) {
    next(error);
  }
});

router.post("/clients", async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      throw new ApiError(403, "Admin access required.");
    }

    const { name } = req.body ?? {};
    if (!name?.trim()) {
      throw new ApiError(400, "Workspace name is required.");
    }

    const workspace = await prisma.workspace.create({
      data: { name: name.trim() },
    });

    const firstOrder = await prisma.order.findFirst({ select: { id: true } });
    if (firstOrder?.id) {
      await prisma.orderActivity.create({
        data: {
          orderId: firstOrder.id,
          userId: req.user.id,
          type: "WORKSPACE_CREATED",
          summary: `Workspace ${workspace.name} created`,
        },
      });
    }

    res.status(201).json(workspace);
  } catch (error) {
    next(error);
  }
});

export default router;