// orbitApi.jsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./apiClient.jsx";
import {
  normalizeActivity,
  normalizeClient,
  normalizeComment,
  normalizeInvoice,
  normalizeOrder,
  normalizeOrders,
  statusValueFromLabel,
} from "./orderConstants.jsx";

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function request(path, { method = "GET", body } = {}) {
  try {
    const data = await apiFetch(path, { method, body });
    return data;
  } catch (err) {
    // Wrap generic errors as ApiError where possible
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || "Request failed.", 0, null);
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
        comments: Array.isArray(thread.comments)
          ? thread.comments.map(normalizeComment).filter(Boolean)
          : [],
        activities: Array.isArray(thread.activities)
          ? thread.activities.map(normalizeActivity).filter(Boolean)
          : [],
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
    mutationFn: async ({ name }) =>
      request("/admin/clients", { method: "POST", body: { name } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) =>
      normalizeOrder(await request("/orders", { method: "POST", body: payload })),
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, text, attachments = [] }) =>
      request(`/orders/${orderId}/comments`, {
        method: "POST",
        body: { text, attachments },
      }),
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
      return apiFetch("/upload", { method: "POST", body: formData });
    },
  });
}

export function usePayInvoiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId }) =>
      request(`/invoices/${invoiceId}/pay`, { method: "PATCH" }),
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