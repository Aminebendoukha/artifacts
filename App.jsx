import React, { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./Layout.jsx";
import ClientDashboard from "./ClientDashboard.jsx";
import ClientInvoices from "./ClientInvoices.jsx";
import NewOrder from "./NewOrder.jsx";
import OrderDetails from "./OrderDetails.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import AdminClients from "./AdminClients.jsx";
import { RoleProvider } from "./roleContext.jsx";
import { ToastProvider } from "./ui.jsx";

export default function App() {
  return (
    <RoleProvider initialRole="client">
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/client" replace />} />
            <Route path="/client" element={<ClientDashboard />} />
            <Route path="/client/invoices" element={<ClientInvoices />} />
            <Route path="/client/new-order" element={<NewOrder />} />
            <Route path="/client/order/:id" element={<OrderDetails />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/clients" element={<AdminClients />} />
            <Route path="*" element={<Navigate to="/client" replace />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </RoleProvider>
  );
}
