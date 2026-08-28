import React from "react";
import { useNavigate } from "react-router-dom";
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
import {
  ORDER_STATUS_STYLES,
  INVOICE_STATUS_STYLES,
  formatCurrency,
  formatRelativeTime,
} from "./orderConstants.jsx";
import {
  useInvoicesQuery,
  useNotificationsQuery,
  useOrdersQuery,
  usePayInvoiceMutation,
} from "./orbitApi.jsx";

function parseOutstandingBalance(invoices) {
  return invoices.reduce((sum, invoice) => {
    if (!invoice || invoice.status === "PAID") {
      return sum;
    }

    return sum + Number(invoice.amount ?? 0);
  }, 0);
}

function formatDueDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

  const ordersQuery = useOrdersQuery();
  const invoicesQuery = useInvoicesQuery();
  const activitiesQuery = useNotificationsQuery();
  const payInvoiceMutation = usePayInvoiceMutation();

  const orders = ordersQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];
  const activities = activitiesQuery.data ?? [];

  const activeOrders = orders.filter(
    (order) =>
      order.status === "In Progress" || order.status === "Review",
  ).length;

  const pendingOrders = orders.filter(
    (order) => order.status === "Pending",
  ).length;

  const outstandingBalance = parseOutstandingBalance(invoices);

  const unpaidInvoices = invoices.filter(
    (invoice) => invoice.status !== "PAID",
  );

  const recentOrders = [...orders]
    .sort(
      (left, right) =>
        new Date(right.createdAt ?? right.date) -
        new Date(left.createdAt ?? left.date),
    )
    .slice(0, 6);

  const recentActivities = [...activities]
    .sort(
      (left, right) =>
        new Date(right.createdAt) - new Date(left.createdAt),
    )
    .slice(0, 7);

  const ordersLoading = ordersQuery.isLoading && !ordersQuery.data;
  const invoicesLoading = invoicesQuery.isLoading && !invoicesQuery.data;
  const activitiesLoading =
    activitiesQuery.isLoading && !activitiesQuery.data;

  const handlePayInvoice = async (invoice) => {
    try {
      await payInvoiceMutation.mutateAsync({
        invoiceId: invoice.id,
      });

      toast({
        title: "Payment confirmed",
        description: `${invoice.invoiceNumber} has been marked as paid.`,
      });
    } catch (error) {
      toast({
        title: "Payment failed",
        description:
          error?.message ?? "Unable to process this payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Welcome back — here&apos;s what&apos;s happening with your orders and billing.
          </p>
        </div>

        <Button onClick={() => navigate("/client/new-order")}>
          <LayoutDashboard className="h-4 w-4" />
          New Order
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="bg-white dark:bg-slate-900">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Active Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </CardHeader>

          <CardContent className="pt-0">
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
              {activeOrders}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              In Progress + Review
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Pending Orders</CardTitle>
            <Bell className="h-4 w-4 text-amber-500" />
          </CardHeader>

          <CardContent className="pt-0">
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
              {pendingOrders}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Awaiting kickoff
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "bg-white dark:bg-slate-900",
            outstandingBalance > 0 &&
              "border-red-200 bg-red-50/70 dark:border-red-900 dark:bg-red-950/20",
          )}
        >
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Outstanding Balance</CardTitle>
            <Banknote
              className={cn(
                "h-4 w-4",
                outstandingBalance > 0
                  ? "text-red-500"
                  : "text-emerald-500",
              )}
            />
          </CardHeader>

          <CardContent className="pt-0">
            <p
              className={cn(
                "text-3xl font-semibold",
                outstandingBalance > 0
                  ? "text-red-700 dark:text-red-300"
                  : "text-slate-900 dark:text-slate-100",
              )}
            >
              {formatCurrency(outstandingBalance)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Unpaid + pending invoices
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {unpaidInvoices.length > 0 && (
            <Card className="border-amber-200 bg-white dark:border-amber-900 dark:bg-slate-900">
              <CardHeader className="flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Needs Attention: Invoices
                  </CardTitle>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    These invoices still need payment action.
                  </p>
                </div>

                <TriangleAlert className="h-5 w-5 text-amber-500" />
              </CardHeader>

              <CardContent className="space-y-3">
                {unpaidInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {invoice.order?.projectName ?? "Project"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Due {formatDueDate(invoice.dueDate)} • {invoice.invoiceNumber}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                        {formatCurrency(invoice.amount)}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => handlePayInvoice(invoice)}
                      disabled={payInvoiceMutation.isPending}
                      className="sm:self-center"
                    >
                      <CreditCard className="h-4 w-4" />
                      Pay Now
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="bg-white dark:bg-slate-900">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Recent Orders
                </CardTitle>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => ordersQuery.refetch()}
                  disabled={ordersQuery.isFetching}
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4",
                      ordersQuery.isFetching && "animate-spin",
                    )}
                  />
                  Refresh
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {ordersLoading ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  Loading recent orders...
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  No orders yet.
                </div>
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
                      <TR
                        key={order.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/client/order/${order.id}`)}
                      >
                        <TD className="font-medium text-slate-900 dark:text-slate-100">
                          {order.orderNumber}
                        </TD>

                        <TD>
                          <div className="flex flex-col">
                            <span>{order.projectName}</span>
                            <span className="text-xs text-slate-400">
                              {order.workspaceName}
                            </span>
                          </div>
                        </TD>

                        <TD>{order.date}</TD>

                        <TD>
                          <Badge
                            className={
                              ORDER_STATUS_STYLES[order.status] ??
                              ORDER_STATUS_STYLES.Pending
                            }
                          >
                            {order.status}
                          </Badge>
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
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Recent Activity
                </CardTitle>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Live workspace timeline
                </p>
              </div>

              <Activity className="h-5 w-5 text-indigo-500" />
            </CardHeader>

            <CardContent>
              {activitiesLoading ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  Loading activity feed...
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  No activity yet.
                </div>
              ) : (
                <div className="relative space-y-4 pl-4">
                  <div className="absolute left-4 top-1 h-full w-px bg-slate-200 dark:bg-slate-800" />

                  {recentActivities.map((activity) => {
                    const Icon = activityIcon(activity.type);

                    return (
                      <div key={activity.id} className="relative flex gap-3">
                        <div
                          className={cn(
                            "relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                            activityTone(activity.type),
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 pb-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {activity.summary}
                            </p>

                            <Badge
                              className={cn(
                                "border",
                                activityTone(activity.type),
                              )}
                            >
                              {activity.type.replaceAll("_", " ")}
                            </Badge>
                          </div>

                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {activity.order?.projectName ?? "Workspace"} •{" "}
                            {formatRelativeTime(activity.createdAt)}
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
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Invoice Summary
                </CardTitle>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Current billing snapshot
                </p>
              </div>

              <FileText className="h-5 w-5 text-amber-500" />
            </CardHeader>

            <CardContent className="space-y-3">
              {invoicesLoading ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  Loading invoices...
                </div>
              ) : invoices.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  No invoices yet.
                </div>
              ) : (
                invoices.slice(0, 3).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {invoice.order?.projectName ?? "Project"}
                        </p>
                      </div>

                      <Badge
                        className={
                          INVOICE_STATUS_STYLES[invoice.status] ??
                          INVOICE_STATUS_STYLES.UNPAID
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        Due {formatDueDate(invoice.dueDate)}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(invoice.amount)}
                      </span>
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