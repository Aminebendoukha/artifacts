// src/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider.jsx";

/**
 * Wrap /admin/* and /client/* routes in this component.
 * - Redirects unauthenticated users to /login (preserving the intended
 *   destination so login can send them back).
 * - Optionally restricts access to a specific role (e.g. requiredRole="ADMIN"
 *   keeps clients out of /admin/*).
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-slate-500">
        Checking your session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    const fallback = user?.role === "ADMIN" ? "/admin" : "/client";
    return <Navigate to={fallback} replace />;
  }

  return children;
}
