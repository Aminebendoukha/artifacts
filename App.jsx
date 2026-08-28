// src/App.jsx
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./Layout.jsx";
import ClientDashboard from "./ClientDashboard.jsx";
import ClientInvoices from "./ClientInvoices.jsx";
import NewOrder from "./NewOrder.jsx";
import OrderDetails from "./OrderDetails.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import AdminClients from "./AdminClients.jsx";
import Login from "./Login.jsx";
import Register from "./Register.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { AuthProvider } from "./AuthProvider.jsx";
import { ToastProvider } from "./ui.jsx";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
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
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
