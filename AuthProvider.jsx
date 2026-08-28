// src/AuthProvider.jsx
// Real JWT auth context: stores the token in localStorage, exposes
// login/register/logout and the current user, and rehydrates the
// session on page load via GET /api/auth/me.
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const TOKEN_KEY = "orbit_token";

const API_BASE =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

async function apiRequest(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    setToken(newToken);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await apiRequest("/auth/login", { method: "POST", body: { email, password } });
      persistToken(data.token);
      setUser(data.user);
      return data.user;
    },
    [persistToken]
  );

  const register = useCallback(
    async ({ email, password, companyName, role }) => {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: { email, password, companyName, role },
      });
      persistToken(data.token);
      setUser(data.user);
      return data.user;
    },
    [persistToken]
  );

  const logout = useCallback(() => {
    persistToken(null);
    setUser(null);
  }, [persistToken]);

  useEffect(() => {
    let isMounted = true;
    async function rehydrate() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await apiRequest("/auth/me", { token });
        if (isMounted) setUser(data.user);
      } catch {
        if (isMounted) persistToken(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    rehydrate();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { API_BASE, TOKEN_KEY };
