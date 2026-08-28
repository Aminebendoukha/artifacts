import React from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  Banknote,
  Bell,
  Clock3,
  CreditCard,
  FileText,
  LayoutDashboard,
  MessageSquare,
  RefreshCw,
  TriangleAlert,
  TrendingUp,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  useToast,
  cn,
} from "./ui.jsx";
import { ORDER_STATUS_STYLES, INVOICE_STATUS_STYLES, formatCurrency, formatRelativeTime, normalizeOrders, normalizeInvoice } from "./orderConstants.jsx";

const CLIENT_HEADERS = { "x-mock-role": "client" };

const fallbackOrders = normalizeOrders([
  {
    id: "fallback-order-1",
    orderNumber: "ORD-1001",
    projectName: "Client Portal Refresh",
    status: "In Progress",
    createdAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    workspaceName: "Atlas Retail Group",
    serviceType: "Web Application Development",
  },
  {
    id: "fallback-order-2",
    orderNumber: "ORD-1002",
    projectName: "Analytics Workspace",
    status: "Review",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    workspaceName: "Atlas Retail Group",
    serviceType: "Data Warehouse & Analytics",
  },
]);

const fallbackInvoices = [
  normalizeInvoice({
    id: "fallback-invoice-1",
    invoiceNumber: "INV-0008",
    amount: 3200,
    status: "UNPAID",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    order: { projectName: "Client Portal Refresh" },
  }),
  normalizeInvoice({
    id: "fallback-invoice-2",
    invoiceNumber: "INV-0009",
    amount: 950,
    status: "PENDING_DEPOSIT",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    order: { projectName: "Analytics Workspace" },
  }),
];

const fallbackActivities = [
  {
    id: "fallback-activity-1",
    type: "STATUS_CHANGED",
    summary: "Client Portal Refresh moved to In Progress",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    order: { projectName: "Client Portal Refresh" },
  },
  {
    id: "fallback-activity-2",
    type: "INVOICE_CREATED",
    summary: "Invoice INV-0008 generated for Client Portal Refresh",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    order: { projectName: "Client Portal Refresh" },
  },
  {
    id: "fallback-activity-3",
    type: "COMMENT",
    summary: "A teammate mentioned the client in the project thread",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    order: { projectName: "Analytics Workspace" },
  },
];

async function fetchWithFallback(path, fallbackValue) {
  try {
    const response = await fetch(path, { headers: CLIENT_HEADERS });
    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    return await response.json();
  } catch {
    return fallbackValue;
  }
}

function parseOutstandingBalance(invoices) {
  return invoices.reduce((sum, invoice) => {
    if (!invoice) return sum;
    if (invoice.status === "PAID") return sum;
    return sum + Number(invoice.amount ?? 0);
  }, 0);
}

function formatDueDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function activityIcon(type) {
  switch (type) {
    case "STATUS_CHANGED":
      return Clock3;
    case "INVOICE_CREATED":
      return FileText;
    case "COMMENT":
      return MessageSquare;
    case "PAYMENT_MADE":
      return CreditCard;
    default:
      return Activity;
  }
}

function activityTone(type) {
  switch (type) {
    case "STATUS_CHANGED":
      return "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900";
    case "INVOICE_CREATED":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900";
    case "COMMENT":
      return "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900";
    case "PAYMENT_MADE":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const ordersQuery = useQuery({
    queryKey: ["client-orders"],
    queryFn: async () => normalizeOrders(await fetchWithFallback("http://localhost:3001/api/orders", fallbackOrders)),
    staleTime: 30_000,
  });

  const invoicesQuery = useQuery({
    queryKey: ["client-invoices"],
    queryFn: async () => (await fetchWithFallback("http://localhost:3001/api/invoices", fallbackInvoices)).map(normalizeInvoice).filter(Boolean),
    staleTime: 30_000,
  });

  const activitiesQuery = useQuery({
    queryKey: ["client-activities"],
    queryFn: async () => await fetchWithFallback("http://localhost:3001/api/activities", fallbackActivities),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const payNowMutation = useMutation({
    mutationFn: async (invoice) => {
      await new Promise((resolve) => setTimeout(resolve, 650));
      return invoice;
    },
    onSuccess: () => {
      toast({
        title: "Redirecting to secure payment gateway...",
        description: "Your payment request is ready for checkout.",
      });
    },
  });

  const orders = ordersQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];
  const activities = activitiesQuery.data ?? [];

  const activeOrders = orders.filter((order) => order.status === "In Progress" || order.status === "Review").length;
  const pendingOrders = orders.filter((order) => order.status === "Pending").length;
  const outstandingBalance = parseOutstandingBalance(invoices);
  const unpaidInvoices = invoices.filter((invoice) => invoice.status !== "PAID");
  const recentOrders = [...orders].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)).slice(0, 6);
  const recentActivities = [...activities].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)).slice(0, 7);

  const ordersLoading = ordersQuery.isLoading && !ordersQuery.data;
  const invoicesLoading = invoicesQuery.isLoading && !invoicesQuery.data;
  const activitiesLoading = activitiesQuery.isLoading && !activitiesQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Welcome back - here&apos;s what&apos;s happening with your orders and billing.</p>
        </div>
        <Button onClick={() => navigate("/client/new-order") }>
          <LayoutDashboard className="h-4 w-4" /> New Order
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-900">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Active Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{activeOrders}</p>
            <p className="text-xs text-slate-400 mt-1">In Progress + Review</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Pending Orders</CardTitle>
            <Bell className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{pendingOrders}</p>
            <p className="text-xs text-slate-400 mt-1">Awaiting kickoff</p>
          </CardContent>
        </Card>

        <Card className={cn("bg-white dark:bg-slate-900", outstandingBalance > 0 && "border-red-200 bg-red-50/70 dark:border-red-900 dark:bg-red-950/20") }>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Outstanding Balance</CardTitle>
            <Banknote className={cn("h-4 w-4", outstandingBalance > 0 ? "text-red-500" : "text-emerald-500")} />
          </CardHeader>
          <CardContent className="pt-0">
            <p className={cn("text-3xl font-semibold", outstandingBalance > 0 ? "text-red-700 dark:text-red-300" : "text-slate-900 dark:text-slate-100")}>
              {formatCurrency(outstandingBalance)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Unpaid + pending invoices</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 space-y-6">
          {unpaidInvoices.length > 0 && (
            <Card className="bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900">
              <CardHeader className="flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Needs Attention: Invoices</CardTitle>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">These invoices still need payment action.</p>
                </div>
                <TriangleAlert className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent className="space-y-3">
                {unpaidInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{invoice.order?.projectName ?? "Project"}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Due {formatDueDate(invoice.dueDate)} • {invoice.invoiceNumber}</p>
                      <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{formatCurrency(invoice.amount)}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => payNowMutation.mutate(invoice)}
                      disabled={payNowMutation.isPending}
                      className="sm:self-center"
                    >
                      <CreditCard className="h-4 w-4" /> Pay Now
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="bg-white dark:bg-slate-900">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent Orders</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => ordersQuery.refetch()} disabled={ordersQuery.isFetching}>
                  <RefreshCw className={cn("h-4 w-4", ordersQuery.isFetching && "animate-spin")} /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-10 text-center text-slate-500 dark:text-slate-400">Loading recent orders...</div>
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Order ID</TH>
                      <TH>Project Name</TH>
                      <TH>Date</TH>
                      <TH>Status</TH>
                      <TH />
                    </TR>
                  </THead>
                  <TBody>
                    {recentOrders.map((order) => (
                      <TR key={order.id} className="cursor-pointer" onClick={() => navigate(`/client/order/${order.id}`)}>
                        <TD className="font-medium text-slate-900 dark:text-slate-100">{order.orderNumber}</TD>
                        <TD>
                          <div className="flex flex-col">
                            <span>{order.projectName}</span>
                            <span className="text-xs text-slate-400">{order.workspaceName}</span>
                          </div>
                        </TD>
                        <TD>{order.date}</TD>
                        <TD>
                          <Badge className={ORDER_STATUS_STYLES[order.status] ?? ORDER_STATUS_STYLES.Pending}>{order.status}</Badge>
                        </TD>
                        <TD>
                          <ArrowUpRight className="h-4 w-4 text-slate-400" />
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-900">
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent Activity</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Live workspace timeline</p>
              </div>
              <Activity className="h-5 w-5 text-indigo-500" />
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-10 text-center text-slate-500 dark:text-slate-400">Loading activity feed...</div>
              ) : recentActivities.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-10 text-center text-slate-500 dark:text-slate-400">No activity yet.</div>
              ) : (
                <div className="relative space-y-4 pl-4">
                  <div className="absolute left-4 top-1 h-full w-px bg-slate-200 dark:bg-slate-800" />
                  {recentActivities.map((activity) => {
                    const Icon = activityIcon(activity.type);
                    return (
                      <div key={activity.id} className="relative flex gap-3">
                        <div className={cn("relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", activityTone(activity.type))}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 pb-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{activity.summary}</p>
                            <Badge className={cn("border", activityTone(activity.type))}>{activity.type.replaceAll("_", " ")}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {activity.order?.projectName ?? "Workspace"} • {formatRelativeTime(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900">
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Invoice Summary</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Current billing snapshot</p>
              </div>
              <FileText className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {invoicesLoading ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-10 text-center text-slate-500 dark:text-slate-400">Loading invoices...</div>
              ) : (
                invoices.slice(0, 3).map((invoice) => (
                  <div key={invoice.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{invoice.order?.projectName ?? "Project"}</p>
                      </div>
                      <Badge className={INVOICE_STATUS_STYLES[invoice.status] ?? INVOICE_STATUS_STYLES.UNPAID}>{invoice.status}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Due {formatDueDate(invoice.dueDate)}</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(invoice.amount)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}