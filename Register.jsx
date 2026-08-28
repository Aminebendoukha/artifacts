// src/Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Boxes } from "lucide-react";
import { Card, CardContent, Button, Input, cn } from "./ui.jsx";
import { useAuth } from "./AuthProvider.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    email: "",
    password: "",
    role: "CLIENT",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.companyName.trim() || !form.email.trim() || !form.password) {
      setError("All fields are required.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setSubmitting(true);
    try {
      const user = await register(form);
      navigate(user.role === "ADMIN" ? "/admin" : "/client", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Boxes className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">Set up your Orbit workspace</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Company / Workspace Name
                </label>
                <Input
                  placeholder="e.g. Atlas Retail Group"
                  value={form.companyName}
                  onChange={(e) => update("companyName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <Input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Register as</label>
                <div className="flex rounded-lg border border-slate-300 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => update("role", "CLIENT")}
                    className={cn(
                      "flex-1 py-2 text-sm font-medium transition-colors",
                      form.role === "CLIENT" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Client
                  </button>
                  <button
                    type="button"
                    onClick={() => update("role", "ADMIN")}
                    className={cn(
                      "flex-1 py-2 text-sm font-medium transition-colors",
                      form.role === "ADMIN" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Admin (testing)
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  This toggle is for local testing only — production would gate Admin registration.
                </p>
              </div>

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
