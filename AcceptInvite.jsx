// AcceptInvite.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Boxes } from "lucide-react";
import { Card, CardContent, Button, Input, useToast, cn } from "./ui.jsx";
import { apiFetch } from "./apiClient.jsx";

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadInvite() {
      try {
        const data = await apiFetch(`/invites/${token}`);
        if (!cancelled) {
          setInvite(data.data);
        }
      } catch (err) {
        if (!cancelled) {
          toast({
            title: "Invalid invite",
            description: err.message || "This invite link is not valid.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInvite();

    return () => {
      cancelled = true;
    };
  }, [token, toast]);

  function validateField(name, value) {
    if (name === "password") {
      return validatePassword(value).valid ? "" : validatePassword(value).message;
    }
    if (name === "confirmPassword") {
      return validatePassword(value, {
        isConfirm: true,
        confirmPassword: password,
      }).valid
        ? ""
        : validatePassword(value, {
            isConfirm: true,
            confirmPassword: password,
          }).message;
    }
    return "";
  }

  function handleChange(name, value) {
    if (name === "password") setPassword(value);
    if (name === "confirmPassword") setConfirmPassword(value);

    const message = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: message }));
    setGlobalError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const passwordError = validateField("password", password);
    const confirmError = validateField("confirmPassword", confirmPassword);

    if (passwordError || confirmError) {
      setErrors({
        password: passwordError || "",
        confirmPassword: confirmError || "",
      });
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiFetch(`/invites/${token}/accept`, {
        method: "POST",
        body: { password },
      });

      localStorage.setItem(TOKEN_KEY, data.data.token);

      toast({
        title: "Invite accepted",
        description: "Your account has been created. Redirecting...",
      });

      setTimeout(() => {
        navigate("/client", { replace: true });
      }, 800);
    } catch (err) {
      setGlobalError(err.message || "Failed to accept invite.");
      toast({
        title: "Accept failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            Loading invite...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-slate-700 dark:text-slate-100">
              This invite is invalid or expired.
            </p>
            <Button onClick={() => navigate("/login")}>Go to login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Boxes className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Accept invite
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Join <span className="font-medium">{invite.workspace.name}</span>
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <Input
                  type="email"
                  value={invite.email}
                  disabled
                  className="bg-slate-100 dark:bg-slate-800"
                />
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
                  value={password}
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
                  value={confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword ? "confirmPassword-error" : undefined
                  }
                  className={cn(
                    errors.confirmPassword && "border-red-500 focus:border-red-500"
                  )}
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
                {submitting ? "Creating account..." : "Create account & join"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}