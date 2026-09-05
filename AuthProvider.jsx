// AuthProvider.jsx
// Real JWT auth context: stores the token in localStorage, exposes
// login/register/logout and the current user, and rehydrates the
// session on page load via GET /api/auth/me.
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch, TOKEN_KEY } from "./apiClient.jsx";

const AuthContext = createContext(null);

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
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      persistToken(data.token);
      setUser(data.user);
      return data.user;
    },
    [persistToken]
  );

  const register = useCallback(
    async ({ email, password, companyName, role }) => {
      const data = await apiFetch("/auth/register", {
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
      const currentToken = localStorage.getItem(TOKEN_KEY);

      if (!currentToken) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const data = await apiFetch("/auth/me", {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });
        if (isMounted) {
          setUser(data.user);
        }
      } catch {
        if (isMounted) {
          persistToken(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    rehydrate();

    return () => {
      isMounted = false;
    };
  }, [persistToken]);

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
