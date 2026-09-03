// src/Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Boxes } from "lucide-react";
import { Card, CardContent, Button, Input, cn } from "./ui.jsx";
import { useAuth } from "./AuthProvider.jsx";
import {
  validateEmail,
  validatePassword,
  validateCompanyName,
} from "./utils/formUtils.js";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setGlobalError("");
  }

  function validateField(name, value) {
    switch (name) {
      case "companyName":
        return validateCompanyName(value).valid ? "" : validateCompanyName(value).message;
      case "email":
        return validateEmail(value).valid ? "" : validateEmail(value).message;
      case "password":
        return validatePassword(value).valid ? "" : validatePassword(value).message;
      case "confirmPassword":
        return validatePassword(value, {
          isConfirm: true,
          confirmPassword: form.password,
        }).valid
          ? ""
          : validatePassword(value, {
              isConfirm: true,
              confirmPassword: form.password,
            }).message;
      default:
        return "";
    }
  }

  function handleChange(name, value) {
    update(name, value);
    const message = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: message }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGlobalError("");

    const newErrors = {
      companyName: validateField("companyName", form.companyName),
      email: validateField("email", form.email),
      password: validateField("password", form.password),
      confirmPassword: validateField("confirmPassword", form.confirmPassword),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      return;
    }

    setSubmitting(true);
    try {
      const user = await register({
        companyName: form.companyName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      navigate(user.role === "ADMIN" ? "/admin" : "/client", { replace: true });
    } catch (err) {
      setGlobalError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Boxes className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Create your account
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Set up your Orbit workspace
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Company / Workspace Name
                </label>
                <Input
                  id="companyName"
                  placeholder="e.g. Atlas Retail Group"
                  value={form.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  aria-invalid={!!errors.companyName}
                  aria-describedby={errors.companyName ? "companyName-error" : undefined}
                  className={cn(errors.companyName && "border-red-500 focus:border-red-500")}
                />
                {errors.companyName && (
                  <p id="companyName-error" className="mt-1 text-xs text-red-500">
                    {errors.companyName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={cn(errors.email && "border-red-500 focus:border-red-500")}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-xs text-red-500">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className={cn(errors.password && "border-red-500 focus:border-red-500")}
                />
                {errors.password && (
                  <p id="password-error" className="mt-1 text-xs text-red-500">
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                  className={cn(errors.confirmPassword && "border-red-500 focus:border-red-500")}
                />
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" className="mt-1 text-xs text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {globalError && (
                <p className="text-xs text-red-500 text-center">{globalError}</p>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}