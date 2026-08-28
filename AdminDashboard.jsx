import React, { useMemo, useState } from "react";
import { Search, LayoutGrid, List, FileText, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  Dialog,
  useToast,
  cn,
} from "./ui.jsx";
import { ORDER_STATUS_OPTIONS, ORDER_STATUS_STYLES, formatCurrency } from "./orderConstants.jsx";
import { useAdminAnalyticsQuery, useAdminMetricsQuery, useOrderQuery, useOrdersQuery, useUpdateOrderStatusMutation } from "./orbitApi.jsx";

function MetricCard({ title, value, helper, icon: Icon }) {
  return (
    <Card className="bg-white dark:bg-slate-900">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-slate-500 dark:text-slate-400">{title}</CardTitle>
        <Icon className="h-4 w-4 text-indigo-500" />
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
        <p className="text-xs text-slate-400 mt-1">{helper}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [view, setView] = useState("table");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(null);
  const { data: orders = [], isLoading, isError, error, refetch } = useOrdersQuery();
  const { data: metrics } = useAdminMetricsQuery();
  const { data: analytics } = useAdminAnalyticsQuery();
  const updateStatusMutation = useUpdateOrderStatusMutation();
  const selectedOrderQuery = useOrderQuery(selectedId, { enabled: Boolean(selectedId) });

  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        const searchValue = `${order.projectName} ${order.orderNumber} ${order.workspaceName}`.toLowerCase();
        const matchesQuery = searchValue.includes(query.toLowerCase());
        const matchesStatus = statusFilter === "All" || order.status === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [orders, query, statusFilter]
  );

  const selected = selectedOrderQuery.data ?? orders.find((order) => order.id === selectedId);
  const orderVelocity = analytics?.orderVelocity ?? [];
  const revenueByServiceType = analytics?.revenueByServiceType ?? [];

  async function handleStatusChange(id, status) {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      toast({ title: "Status updated", description: `${status} saved successfully.` });
    } catch (mutationError) {
      toast({
        title: "Status update failed",
        description: mutationError?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-slate-900">
        <CardContent className="py-12 text-center text-slate-500">Loading orders...</CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="bg-white dark:bg-slate-900">
        <CardContent className="py-12 text-center space-y-3">
          <p className="text-slate-700 dark:text-slate-100">Failed to load admin orders.</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error?.message ?? "Please try again."}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage incoming client requests, revenue, and progress.</p>
        </div>
        <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
          <button
            onClick={() => setView("table")}
            className={cn("px-3 py-2 text-sm flex items-center gap-1.5", view === "table" ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300")}
          >
            <List className="h-4 w-4" /> Table
          </button>
          <button
            onClick={() => setView("kanban")}
            className={cn("px-3 py-2 text-sm flex items-center gap-1.5", view === "kanban" ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300")}
          >
            <LayoutGrid className="h-4 w-4" /> Kanban
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Total Revenue" value={formatCurrency(metrics?.totalRevenue ?? 0)} helper="Paid invoices to date" icon={TrendingUp} />
        <MetricCard title="Outstanding Invoices" value={metrics?.outstandingInvoices ?? 0} helper="Awaiting payment" icon={FileText} />
        <MetricCard title="Average Order Value" value={formatCurrency(metrics?.averageOrderValue ?? 0)} helper="Across the current invoice base" icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Order Velocity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={orderVelocity}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="orders" stroke="#4f46e5" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Revenue by Service Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByServiceType}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="serviceType" hide />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by order ID, project name, or client..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-48">
          <option value="All">All Statuses</option>
          {ORDER_STATUS_OPTIONS.map((status) => (
            <option key={status.label} value={status.label}>{status.label}</option>
          ))}
        </Select>
      </div>

      {view === "table" ? (
        <Card className="bg-white dark:bg-slate-900">
          <CardContent className="pt-6">
            <Table>
              <THead>
                <TR>
                  <TH>Order ID</TH>
                  <TH>Project Name</TH>
                  <TH>Client</TH>
                  <TH>Service Type</TH>
                  <TH>Deadline</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((order) => (
                  <TR key={order.id} className="cursor-pointer" onClick={() => setSelectedId(order.id)}>
                    <TD className="font-medium text-slate-900 dark:text-slate-100">{order.orderNumber}</TD>
                    <TD>{order.projectName}</TD>
                    <TD>{order.workspaceName}</TD>
                    <TD>{order.serviceType}</TD>
                    <TD>{order.deadline}</TD>
                    <TD>
                      <Badge className={ORDER_STATUS_STYLES[order.status]}>{order.status}</Badge>
                    </TD>
                  </TR>
                ))}
                {filtered.length === 0 && (
                  <TR>
                    <TD colSpan={6} className="text-center py-8 text-slate-400">
                      No orders match your filters.
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ORDER_STATUS_OPTIONS.map(({ label: status }) => (
            <div key={status} className="bg-slate-100/70 dark:bg-slate-900 rounded-xl p-3 border border-transparent dark:border-slate-800">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{status}</h3>
                <span className="text-xs text-slate-400">{filtered.filter((order) => order.status === status).length}</span>
              </div>
              <div className="space-y-3">
                {filtered.filter((order) => order.status === status).map((order) => (
                  <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-slate-900" onClick={() => setSelectedId(order.id)}>
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-400 mb-1">{order.orderNumber}</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">{order.projectName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{order.workspaceName}</p>
                      <p className="text-xs text-slate-400 mt-2">Due {order.deadline}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onClose={() => setSelectedId(null)}>
        {selectedOrderQuery.isLoading && selectedId ? (
          <div className="p-6 pt-16 text-center text-slate-500">Loading order details...</div>
        ) : selected ? (
          <div className="p-6 space-y-6">
            <div>
              <p className="text-xs text-slate-400">{selected.orderNumber}</p>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{selected.projectName}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selected.workspaceName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Order Status</label>
              <Select value={selected.status} disabled={updateStatusMutation.isPending} onChange={(e) => handleStatusChange(selected.id, e.target.value)}>
                {ORDER_STATUS_OPTIONS.map((status) => (
                  <option key={status.label} value={status.label}>{status.label}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-3 text-sm">
              <Row label="Service Type" value={selected.serviceType} />
              <Row label="Budget" value={selected.budgetRange} />
              <Row label="Deadline" value={selected.deadline} />
              <Row label="Date Created" value={selected.date} />
              <div>
                <p className="text-slate-500 dark:text-slate-400 mb-1">Description</p>
                <p className="text-slate-800 dark:text-slate-100">{selected.description}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Attachments</p>
              {selected.attachments?.length === 0 ? (
                <p className="text-sm text-slate-400">No files attached.</p>
              ) : (
                <ul className="space-y-2">
                  {selected.attachments?.map((file) => (
                    <li key={file.id ?? file.fileName} className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
                      <FileText className="h-4 w-4 text-slate-400" /> {file.fileName}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button variant="outline" className="w-full" onClick={() => setSelectedId(null)}>
              Close
            </Button>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-slate-900 dark:text-slate-100 font-medium text-right">{value}</span>
    </div>
  );
}