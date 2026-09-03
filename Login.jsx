// src/Login.jsx
import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Boxes } from "lucide-react";
import { Card, CardContent, Button, Input, cn } from "./ui.jsx";
import { useAuth } from "./AuthProvider.jsx";
import { validateEmail } from "./utils/formUtils.js";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validateField(name, value) {
    if (name === "email") {
      const result = validateEmail(value);
      return result.valid ? "" : result.message;
    }
    if (name === "password" && !value) {
      return "Password is required.";
    }
    return "";
  }

  function handleChange(name, value) {
    if (name === "email") setEmail(value);
    if (name === "password") setPassword(value);

    const message = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: message }));
    setGlobalError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGlobalError("");

    const emailError = validateField("email", email);
    const passwordError = validateField("password", password);

    if (emailError || passwordError) {
      setErrors({ email: emailError || "", password: passwordError || "" });
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      const from = location.state?.from?.pathname;
      const fallback = user.role === "ADMIN" ? "/admin" : "/client";
      navigate(from || fallback, { replace: true });
    } catch (err) {
      setGlobalError(err.message || "Invalid email or password.");
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
            Welcome back
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sign in to your Orbit workspace
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  value={email}
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  autoComplete="current-password"
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

              {globalError && (
                <p className="text-xs text-red-500 text-center">{globalError}</p>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-indigo-600 font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}