// InviteClient.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Boxes, Mail } from "lucide-react";
import { Card, CardContent, Button, Input, useToast, cn } from "./ui.jsx";
import { useAuth } from "./AuthProvider.jsx";
import { apiFetch } from "./apiClient.jsx";
import { validateEmail } from "./utils/formUtils.js";

export default function InviteClient() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inviteToken, setInviteToken] = useState(null);

  function validateField(name, value) {
    if (name === "email") {
      const result = validateEmail(value);
      return result.valid ? "" : result.message;
    }
    return "";
  }

  function handleChange(name, value) {
    if (name === "email") setEmail(value);
    const message = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: message }));
    setGlobalError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGlobalError("");

    const emailError = validateField("email", email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    if (!user?.workspaceId) {
      setGlobalError("Workspace information not available. Please log in again.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiFetch("/invites", {
        method: "POST",
        body: {
          email: email.trim().toLowerCase(),
          workspaceId: user.workspaceId,
        },
      });

      setInviteToken(data.data.token);
      toast({
        title: "Invite created",
        description: "Share the invite link below with the client.",
      });
    } catch (err) {
      setGlobalError(err.message || "Failed to create invite.");
      toast({
        title: "Invite failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const inviteLink = inviteToken
    ? `${window.location.origin}/invite/${inviteToken}`
    : "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Boxes className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Invite a client
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create an invite link for a new client to join your workspace
          </p>
        </div>

        {!inviteToken ? (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Client email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="client@company.com"
                    value={email}
                    onChange={(e) => handleChange("email", e.target.value)}
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

                {globalError && (
                  <p className="text-xs text-red-500 text-center">{globalError}</p>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Creating invite..." : "Create invite link"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/40">
                <Mail className="h-5 w-5 text-indigo-600" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {inviteLink}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Send this link to the client
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    toast({
                      title: "Link copied",
                      description: "Invite link copied to clipboard.",
                    });
                  }}
                >
                  Copy link
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setInviteToken(null);
                    setEmail("");
                  }}
                >
                  Create another
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/admin")}
              >
                Back to admin dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}