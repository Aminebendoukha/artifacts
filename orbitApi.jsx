import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRole } from "./roleContext.jsx";
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

async function request(path, { method = "GET", body, role } = {}) {
  const headers = {};

  if (role) {
    headers["x-mock-role"] = role.toUpperCase();
  }

  const options = { method, headers };

  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options);
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
  const { role } = useRole();

  return useQuery({
    queryKey: ["orders", role],
    queryFn: async () => normalizeOrders(await request("/orders", { role })),
    staleTime: 30_000,
  });
}

export function useOrderQuery(orderId, options = {}) {
  const { role } = useRole();

  return useQuery({
    queryKey: ["order", orderId, role],
    enabled: Boolean(orderId) && (options.enabled ?? true),
    queryFn: async () => normalizeOrder(await request(`/orders/${orderId}`, { role })),
  });
}

export function useOrderThreadQuery(orderId, options = {}) {
  const { role } = useRole();

  return useQuery({
    queryKey: ["thread", orderId, role],
    enabled: Boolean(orderId) && (options.enabled ?? true),
    queryFn: async () => {
      const thread = await request(`/orders/${orderId}/thread`, { role });
      return {
        comments: Array.isArray(thread.comments) ? thread.comments.map(normalizeComment).filter(Boolean) : [],
        activities: Array.isArray(thread.activities) ? thread.activities.map(normalizeActivity).filter(Boolean) : [],
      };
    },
  });
}

export function useNotificationsQuery() {
  const { role } = useRole();

  return useQuery({
    queryKey: ["notifications", role],
    queryFn: async () => (await request("/notifications", { role })) ?? [],
    refetchInterval: 30_000,
  });
}

export function useInvoicesQuery() {
  const { role } = useRole();

  return useQuery({
    queryKey: ["invoices", role],
    queryFn: async () => (await request("/invoices", { role })).map(normalizeInvoice),
  });
}

export function useAdminMetricsQuery() {
  const { role } = useRole();

  return useQuery({
    queryKey: ["admin-metrics", role],
    queryFn: async () => await request("/admin/metrics", { role }),
  });
}

export function useAdminAnalyticsQuery() {
  const { role } = useRole();

  return useQuery({
    queryKey: ["admin-analytics", role],
    queryFn: async () => await request("/admin/analytics", { role }),
  });
}

export function useClientsQuery() {
  const { role } = useRole();

  return useQuery({
    queryKey: ["clients", role],
    queryFn: async () => (await request("/admin/clients", { role })).map(normalizeClient),
  });
}

export function useCreateClientWorkspaceMutation() {
  const { role } = useRole();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name }) => await request("/admin/clients", { method: "POST", body: { name }, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useCreateOrderMutation() {
  const { role } = useRole();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => normalizeOrder(await request("/orders", { method: "POST", body: payload, role })),
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
  const { role } = useRole();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }) => normalizeOrder(
      await request(`/orders/${id}/status`, {
        method: "PATCH",
        body: { status: statusValueFromLabel(status) },
        role,
      })
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
  const { role } = useRole();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, text, attachments = [] }) =>
      await request(`/orders/${orderId}/comments`, { method: "POST", body: { text, attachments }, role }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["thread", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUploadFileMutation() {
  const { role } = useRole();

  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      return await request("/upload", { method: "POST", body: formData, role });
    },
  });
}

export function usePayInvoiceMutation() {
  const { role } = useRole();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId }) => await request(`/invoices/${invoiceId}/pay`, { method: "PATCH", role }),
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