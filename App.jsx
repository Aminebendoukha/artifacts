// src/App.jsx
import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./Layout.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { AuthProvider } from "./AuthProvider.jsx";
import { ToastProvider } from "./ui.jsx";

const ClientDashboard = lazy(() => import("./ClientDashboard.jsx"));
const ClientInvoices = lazy(() => import("./ClientInvoices.jsx"));
const NewOrder = lazy(() => import("./NewOrder.jsx"));
const OrderDetails = lazy(() => import("./OrderDetails.jsx"));
const AdminDashboard = lazy(() => import("./AdminDashboard.jsx"));
const AdminClients = lazy(() => import("./AdminClients.jsx"));
const Login = lazy(() => import("./Login.jsx"));
const Register = lazy(() => import("./Register.jsx"));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
      Loading…
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center dark:bg-slate-950">
      <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">404</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <a
        href="/login"
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Back to Login
      </a>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public routes — no sidebar/header */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Client routes */}
            <Route
              path="/client"
              element={
                <ProtectedRoute requiredRole="CLIENT">
                  <Layout>
                    <ClientDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/invoices"
              element={
                <ProtectedRoute requiredRole="CLIENT">
                  <Layout>
                    <ClientInvoices />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/new-order"
              element={
                <ProtectedRoute requiredRole="CLIENT">
                  <Layout>
                    <NewOrder />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/order/:id"
              element={
                <ProtectedRoute requiredRole="CLIENT">
                  <Layout>
                    <OrderDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/clients"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Layout>
                    <AdminClients />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  );
}
