import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TOKEN_KEY } from "./AuthProvider.jsx";
import {
  normalizeActivity,
  normalizeClient,
  normalizeComment,
  normalizeInvoice,
  normalizeOrder,
  normalizeOrders,
  statusValueFromLabel,
} from "./orderConstants.jsx";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const headers = {};
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const options = { method, headers };
  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }
  const text = await response.text();
  const payload = text ? safeParseJson(text) : null;
  if (!response.ok) {
    throw new ApiError(payload?.error ?? "Request failed.", response.status, payload);
  }
  return payload;
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function useOrdersQuery() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => normalizeOrders(await request("/orders")),
    staleTime: 30_000,
  });
}

export function useOrderQuery(orderId, options = {}) {
  return useQuery({
    queryKey: ["order", orderId],
    enabled: Boolean(orderId) && (options.enabled ?? true),
    queryFn: async () => normalizeOrder(await request(`/orders/${orderId}`)),
  });
}

export function useOrderThreadQuery(orderId, options = {}) {
  return useQuery({
    queryKey: ["thread", orderId],
    enabled: Boolean(orderId) && (options.enabled ?? true),
    queryFn: async () => {
      const thread = await request(`/orders/${orderId}/thread`);
      return {
        comments: Array.isArray(thread.comments) ? thread.comments.map(normalizeComment).filter(Boolean) : [],
        activities: Array.isArray(thread.activities) ? thread.activities.map(normalizeActivity).filter(Boolean) : [],
      };
    },
  });
}

export function useNotificationsQuery() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await request("/notifications")) ?? [],
    refetchInterval: 30_000,
  });
}

export function useInvoicesQuery() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => (await request("/invoices")).map(normalizeInvoice),
  });
}

export function useAdminMetricsQuery() {
  return useQuery({
    queryKey: ["admin-metrics"],
    queryFn: async () => request("/admin/metrics"),
  });
}

export function useAdminAnalyticsQuery() {
  return useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => request("/admin/analytics"),
  });
}

export function useClientsQuery() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => (await request("/admin/clients")).map(normalizeClient),
  });
}

export function useCreateClientWorkspaceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name }) => request("/admin/clients", { method: "POST", body: { name } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => normalizeOrder(await request("/orders", { method: "POST", body: payload })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) =>
      normalizeOrder(
        await request(`/orders/${id}/status`, {
          method: "PATCH",
          body: { status: statusValueFromLabel(status) },
        }),
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["thread", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useAddOrderCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, text, attachments = [] }) =>
      request(`/orders/${orderId}/comments`, { method: "POST", body: { text, attachments } }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["thread", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUploadFileMutation() {
  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      return request("/upload", { method: "POST", body: formData });
    },
  });
}

export function usePayInvoiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId }) => request(`/invoices/${invoiceId}/pay`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function isApiError(error) {
  return error instanceof ApiError;
}