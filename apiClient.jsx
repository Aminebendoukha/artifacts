// src/apiClient.jsx
// Central fetch wrapper that automatically attaches the Bearer <token> to
// every request. Use this from orbitApi.jsx instead of raw `fetch(...)`
// calls with the old `x-mock-role` header, e.g.:
//
//   import { apiFetch } from "./apiClient.jsx";
//   const orders = await apiFetch("/orders");
//
// On a 401 response (expired/invalid token) it clears the stored token and
// redirects to /login so the user re-authenticates.
import { API_BASE, TOKEN_KEY } from "./AuthProvider.jsx";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new Error("Session expired. Please log in again.");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

/*
  If your project uses axios instead, swap this file for an axios instance
  with a request interceptor, e.g.:

  import axios from "axios";
  import { API_BASE, TOKEN_KEY } from "./AuthProvider.jsx";

  export const api = axios.create({ baseURL: API_BASE });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  );
*/
