import prismaClientPkg from "@prisma/client";
import bcrypt from "bcryptjs";
import { parseBudgetRange } from "../src/lib/billing.js";

const { PrismaClient } = prismaClientPkg;

const prisma = new PrismaClient();

const workspaceId = process.env.MOCK_WORKSPACE_ID ?? "11111111-1111-1111-1111-111111111111";
const adminUserId = process.env.MOCK_ADMIN_USER_ID ?? "22222222-2222-2222-2222-222222222222";
const clientUserId = process.env.MOCK_CLIENT_USER_ID ?? "33333333-3333-3333-3333-333333333333";

async function main() {
  const passwordHash = await bcrypt.hash("atlas1234", 10);

  await prisma.attachment.deleteMany();
  await prisma.orderActivity.deleteMany();
  await prisma.orderComment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  await prisma.workspace.create({
    data: {
      id: workspaceId,
      name: "Atlas Retail Group",
    },
  });

  await prisma.user.createMany({
    data: [
      {
        id: adminUserId,
        email: "admin@atlas.example",
        passwordHash,
        role: "ADMIN",
        workspaceId,
      },
      {
        id: clientUserId,
        email: "client@atlas.example",
        passwordHash,
        role: "CLIENT",
        workspaceId,
      },
    ],
  });

  const orders = [
    {
      id: "44444444-4444-4444-4444-444444444441",
      orderNumber: "ORD-1042",
      projectName: "Customer Portal Revamp",
      serviceType: "Web Application Development",
      description: "Redesign the existing customer self-service portal with a modern React front-end and improved checkout flow.",
      budgetRange: "$10,000 - $25,000",
      deadline: new Date("2026-09-30T00:00:00.000Z"),
      status: "IN_PROGRESS",
      createdAt: new Date("2026-08-02T00:00:00.000Z"),
    },
    {
      id: "44444444-4444-4444-4444-444444444442",
      orderNumber: "ORD-1041",
      projectName: "Inventory Sync API",
      serviceType: "API Integration",
      description: "Build a middleware API to sync inventory between our warehouse system and Shopify.",
      budgetRange: "$5,000 - $10,000",
      deadline: new Date("2026-09-10T00:00:00.000Z"),
      status: "REVIEW",
      createdAt: new Date("2026-07-20T00:00:00.000Z"),
    },
    {
      id: "44444444-4444-4444-4444-444444444443",
      orderNumber: "ORD-1040",
      projectName: "Offline-first Field App",
      serviceType: "Mobile App Development",
      description: "Mobile app for field agents that works offline and syncs when connectivity is restored.",
      budgetRange: "$25,000+",
      deadline: new Date("2026-11-01T00:00:00.000Z"),
      status: "PENDING",
      createdAt: new Date("2026-07-05T00:00:00.000Z"),
    },
    {
      id: "44444444-4444-4444-4444-444444444444",
      orderNumber: "ORD-1039",
      projectName: "AWS VPC Hardening",
      serviceType: "Cloud Infrastructure Setup",
      description: "Audit and harden VPC, IAM policies and security groups across all environments.",
      budgetRange: "$2,500 - $5,000",
      deadline: new Date("2026-08-15T00:00:00.000Z"),
      status: "COMPLETED",
      createdAt: new Date("2026-06-28T00:00:00.000Z"),
    },
    {
      id: "44444444-4444-4444-4444-444444444445",
      orderNumber: "ORD-1038",
      projectName: "Analytics Data Warehouse",
      serviceType: "Data Warehouse & Analytics",
      description: "Design a dimensional data warehouse (SCD Type 2) for sales and marketing reporting.",
      budgetRange: "$10,000 - $25,000",
      deadline: new Date("2026-10-05T00:00:00.000Z"),
      status: "COMPLETED",
      createdAt: new Date("2026-06-10T00:00:00.000Z"),
    },
  ];

  await prisma.order.createMany({
    data: orders.map((order) => ({
      ...order,
      workspaceId,
      createdById: clientUserId,
    })),
  });

  const createdOrders = await prisma.order.findMany({
    where: { workspaceId },
    select: { id: true, orderNumber: true },
  });

  const orderIdsByNumber = new Map(createdOrders.map((order) => [order.orderNumber, order.id]));

  const orderDetails = await prisma.order.findMany({
    where: { workspaceId },
    select: { id: true, orderNumber: true, budgetRange: true, status: true, createdAt: true },
  });

  const invoiceSeedData = orderDetails.map((order, index) => ({
    id: undefined,
    invoiceNumber: `INV-${2001 + index}`,
    orderId: order.id,
    amount: parseBudgetRange(order.budgetRange) * (order.status === "IN_PROGRESS" ? 0.5 : 1),
    status: order.status === "COMPLETED" ? "PAID" : order.status === "IN_PROGRESS" ? "PENDING_DEPOSIT" : "UNPAID",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * (10 + index)),
    paidAt: order.status === "COMPLETED" ? new Date() : null,
  }));

  await prisma.invoice.createMany({ data: invoiceSeedData });

  await prisma.attachment.createMany({
    data: [
      {
        fileName: "brand-guidelines.pdf",
        fileUrl: "/uploads/brand-guidelines.pdf",
        orderId: orderIdsByNumber.get("ORD-1042"),
        uploadedById: clientUserId,
      },
      {
        fileName: "current-portal-audit.docx",
        fileUrl: "/uploads/current-portal-audit.docx",
        orderId: orderIdsByNumber.get("ORD-1042"),
        uploadedById: clientUserId,
      },
      {
        fileName: "api-spec-v2.pdf",
        fileUrl: "/uploads/api-spec-v2.pdf",
        orderId: orderIdsByNumber.get("ORD-1041"),
        uploadedById: clientUserId,
      },
      {
        fileName: "network-diagram.png",
        fileUrl: "/uploads/network-diagram.png",
        orderId: orderIdsByNumber.get("ORD-1039"),
        uploadedById: clientUserId,
      },
      {
        fileName: "erd-draft.png",
        fileUrl: "/uploads/erd-draft.png",
        orderId: orderIdsByNumber.get("ORD-1038"),
        uploadedById: clientUserId,
      },
      {
        fileName: "requirements.pdf",
        fileUrl: "/uploads/requirements.pdf",
        orderId: orderIdsByNumber.get("ORD-1038"),
        uploadedById: clientUserId,
      },
    ],
  });

  const adminComment = await prisma.orderComment.create({
    data: {
      orderId: orderIdsByNumber.get("ORD-1042"),
      userId: adminUserId,
      text: "Reviewed the latest scope update. @client please confirm the revised checkout flow.",
    },
  });

  await prisma.attachment.create({
    data: {
      fileName: "checkout-notes.pdf",
      fileUrl: "/uploads/checkout-notes.pdf",
      orderId: orderIdsByNumber.get("ORD-1042"),
      uploadedById: adminUserId,
      commentId: adminComment.id,
    },
  });

  await prisma.orderActivity.createMany({
    data: [
      {
        orderId: orderIdsByNumber.get("ORD-1042"),
        userId: adminUserId,
        type: "STATUS_CHANGED",
        summary: "Admin updated status to In Progress",
        createdAt: new Date(),
      },
      {
        orderId: orderIdsByNumber.get("ORD-1042"),
        userId: adminUserId,
        type: "ATTACHMENT_UPLOADED",
        summary: "New attachment uploaded",
        createdAt: new Date(),
      },
      {
        orderId: orderIdsByNumber.get("ORD-1042"),
        userId: adminUserId,
        type: "COMMENT",
        summary: "Admin posted a comment",
        createdAt: new Date(),
      },
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });