// src/ui.jsx
// Lightweight shadcn/ui-style primitives (Card, Button, Badge, Input, Select, Dialog, Toast, Table)
// Drop-in replaceable with real shadcn/ui components generated via `npx shadcn-ui add`.
import React, { createContext, useCallback, useContext, useState } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import clsx from "clsx";

export function cn(...args) {
  return clsx(...args);
}

/* ---------------- Card ---------------- */
export function Card({ className, children, ...props }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}
export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6 pb-3", className)} {...props}>
      {children}
    </div>
  );
}
export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn("text-sm font-medium text-slate-500", className)} {...props}>
      {children}
    </h3>
  );
}
export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

/* ---------------- Button ---------------- */
const buttonVariants = {
  default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
  outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
};
const buttonSizes = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-sm",
  lg: "h-11 px-6 text-base",
  icon: "h-9 w-9",
};
export function Button({ className, variant = "default", size = "default", children, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------------- Badge ---------------- */
export function Badge({ className, children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/* ---------------- Input ---------------- */
export const Input = React.forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
        className
      )}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
        className
      )}
      {...props}
    />
  );
});

/* ---------------- Select (native, styled) ---------------- */
export const Select = React.forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});

/* ---------------- Table ---------------- */
export function Table({ className, children, ...props }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full text-sm", className)} {...props}>
        {children}
      </table>
    </div>
  );
}
export function THead({ children }) {
  return <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">{children}</thead>;
}
export function TBody({ children }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}
export function TR({ className, children, ...props }) {
  return (
    <tr className={cn("hover:bg-slate-50 transition-colors", className)} {...props}>
      {children}
    </tr>
  );
}
export function TH({ className, children, ...props }) {
  return (
    <th className={cn("px-4 py-3 font-medium", className)} {...props}>
      {children}
    </th>
  );
}
export function TD({ className, children, ...props }) {
  return (
    <td className={cn("px-4 py-3 align-middle text-slate-700", className)} {...props}>
      {children}
    </td>
  );
}

/* ---------------- Dialog / Side Panel ---------------- */
export function Dialog({ open, onClose, children, className }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative h-full w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-200 overflow-y-auto",
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, children, className }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative w-full max-w-lg rounded-xl bg-white shadow-2xl", className)}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

/* ---------------- Toast ---------------- */
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, variant = "default" }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 shadow-lg bg-white animate-in slide-in-from-bottom-4 duration-200",
              t.variant === "destructive" ? "border-red-200" : "border-emerald-200"
            )}
          >
            {t.variant === "destructive" ? (
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="text-sm font-semibold text-slate-900">{t.title}</p>
              {t.description && <p className="text-sm text-slate-500">{t.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

/* ---------------- Stepper ---------------- */
export function Stepper({ steps, currentStep }) {
  return (
    <div className="flex items-center w-full mb-8">
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  isDone && "bg-indigo-600 border-indigo-600 text-white",
                  isActive && !isDone && "border-indigo-600 text-indigo-600 bg-indigo-50",
                  !isActive && !isDone && "border-slate-300 text-slate-400"
                )}
              >
                {isDone ? "✓" : stepNum}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:block",
                  isActive || isDone ? "text-slate-900" : "text-slate-400"
                )}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={cn("mx-2 h-0.5 flex-1", isDone ? "bg-indigo-600" : "bg-slate-200")} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
