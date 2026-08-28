import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Boxes,
  Bell,
  ChevronDown,
  LayoutDashboard,
  Menu,
  MoonStar,
  PlusCircle,
  ShieldCheck,
  SunMedium,
  X,
} from "lucide-react";
import { cn } from "./ui.jsx";
import { useRole } from "./roleContext.jsx";
import { useTheme } from "./themeContext.jsx";
import { useNotificationsQuery } from "./orbitApi.jsx";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { role, setRole } = useRole();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { data: notifications = [] } = useNotificationsQuery();

  const clientLinks = [
    { to: "/client", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/client/new-order", label: "New Order", icon: PlusCircle },
    { to: "/client/invoices", label: "Invoices", icon: Boxes },
  ];
  const adminLinks = [
    { to: "/admin", label: "Admin Dashboard", icon: ShieldCheck, end: true },
    { to: "/admin/clients", label: "Clients", icon: Boxes },
  ];
  const links = role === "client" ? clientLinks : adminLinks;

  function switchRole(newRole) {
    setRole(newRole);
    setRoleMenuOpen(false);
    navigate(newRole === "client" ? "/client" : "/admin");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors">
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={cn(
          "fixed z-40 inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform lg:translate-x-0 lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 h-16 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Boxes className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">Orbit</span>
          <button className="ml-auto lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                )
              }
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-500 dark:text-slate-300">
            Viewing as <span className="font-semibold text-slate-700 dark:text-slate-100">{role === "client" ? "Client" : "Admin"}</span>.
            Switch roles from the header.
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 px-4 lg:px-8 sticky top-0 z-20">
          <button className="lg:hidden text-slate-500 dark:text-slate-300" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1">
            <p className="text-sm text-slate-400 hidden sm:block">Atlas Retail Group Workspace</p>
          </div>

          <div className="relative">
            <button
              onClick={() => setNotificationOpen((value) => !value)}
              className="relative rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                  {notifications.length}
                </span>
              )}
            </button>
            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent Updates</p>
                  <button className="text-xs text-slate-500" onClick={() => setNotificationOpen(false)}>
                    Close
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-2 pt-3">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No recent updates.</p>
                  ) : (
                    notifications.map((notification) => (
                      <div key={notification.id} className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{notification.summary}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {notification.order?.projectName} • {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen((value) => !value)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <span className={cn("h-2 w-2 rounded-full", role === "client" ? "bg-indigo-500" : "bg-emerald-500")} />
              {role === "client" ? "Client View" : "Admin View"}
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1 z-30">
                <button
                  onClick={() => switchRole("client")}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <span className="h-2 w-2 rounded-full bg-indigo-500" /> Client View
                </button>
                <button
                  onClick={() => switchRole("admin")}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Admin View
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 bg-slate-50 dark:bg-slate-950">{children}</main>
      </div>
    </div>
  );
}