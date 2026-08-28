export const ORDER_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "REVIEW", label: "Review" },
  { value: "COMPLETED", label: "Completed" },
];

export const ORDER_STATUS_STYLES = {
  Pending: "bg-slate-100 text-slate-700 border-slate-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
  Review: "bg-amber-100 text-amber-700 border-amber-200",
  Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export const INVOICE_STATUS_STYLES = {
  PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
  UNPAID: "bg-slate-100 text-slate-700 border-slate-200",
  PENDING_DEPOSIT: "bg-amber-100 text-amber-700 border-amber-200",
};

export const SERVICE_TYPES = [
  "Web Application Development",
  "Mobile App Development",
  "Cloud Infrastructure Setup",
  "API Integration",
  "UI/UX Design",
  "Data Warehouse & Analytics",
];

export const BUDGET_RANGES = [
  "Under $2,500",
  "$2,500 - $5,000",
  "$5,000 - $10,000",
  "$10,000 - $25,000",
  "$25,000+",
];

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export function statusLabelFromValue(value) {
  return ORDER_STATUS_OPTIONS.find((status) => status.value === value)?.label ?? value ?? "Pending";
}

export function statusValueFromLabel(label) {
  return ORDER_STATUS_OPTIONS.find((status) => status.label === label)?.value ?? "PENDING";
}

export function toDateOnly(value) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

export function formatRelativeTime(value) {
  const timestamp = value instanceof Date ? value : new Date(value);
  const diffInMinutes = Math.round((timestamp.getTime() - Date.now()) / 60000);
  const absMinutes = Math.abs(diffInMinutes);

  if (absMinutes < 1) return "just now";
  if (absMinutes < 60) return `${absMinutes} minute${absMinutes === 1 ? "" : "s"} ${diffInMinutes < 0 ? "ago" : "from now"}`;

  const hours = Math.round(absMinutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ${diffInMinutes < 0 ? "ago" : "from now"}`;

  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ${diffInMinutes < 0 ? "ago" : "from now"}`;
}

export function normalizeInvoice(invoice) {
  if (!invoice) {
    return null;
  }

  return {
    ...invoice,
    amount: Number(invoice.amount ?? 0),
    dueDate: toDateOnly(invoice.dueDate),
    paidAt: invoice.paidAt ? toDateOnly(invoice.paidAt) : null,
  };
}

export function normalizeAttachment(attachment) {
  if (!attachment) {
    return null;
  }

  return { ...attachment };
}

export function normalizeComment(comment) {
  if (!comment) {
    return null;
  }

  return {
    ...comment,
    attachments: Array.isArray(comment.attachments) ? comment.attachments.map(normalizeAttachment).filter(Boolean) : [],
  };
}

export function normalizeActivity(activity) {
  if (!activity) {
    return null;
  }

  return { ...activity };
}

export function normalizeClient(client) {
  if (!client) {
    return null;
  }

  return {
    ...client,
    totalSpend: Number(client.totalSpend ?? 0),
  };
}

export function normalizeOrder(order) {
  if (!order) {
    return null;
  }

  const attachments = Array.isArray(order.attachments) ? order.attachments.map(normalizeAttachment).filter(Boolean) : [];
  const invoices = Array.isArray(order.invoices) ? order.invoices.map(normalizeInvoice).filter(Boolean) : [];
  const comments = Array.isArray(order.comments) ? order.comments.map(normalizeComment).filter(Boolean) : [];
  const activities = Array.isArray(order.activities) ? order.activities.map(normalizeActivity).filter(Boolean) : [];

  return {
    ...order,
    status: statusLabelFromValue(order.status),
    deadline: toDateOnly(order.deadline),
    date: toDateOnly(order.createdAt ?? order.date),
    workspaceName: order.workspace?.name ?? order.workspaceName ?? "Atlas Retail Group",
    attachments,
    files: attachments.map((attachment) => attachment.fileName),
    invoices,
    comments,
    activities,
  };
}

export function normalizeOrders(orders) {
  return Array.isArray(orders) ? orders.map(normalizeOrder).filter(Boolean) : [];
}