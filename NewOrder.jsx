import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileText, X, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, Button, Input, Textarea, Select, useToast } from "./ui.jsx";
import { Stepper } from "./ui.jsx";
import { BUDGET_RANGES, SERVICE_TYPES } from "./orderConstants.jsx";
import { useCreateOrderMutation } from "./orbitApi.jsx";

const STEPS = ["Details", "Requirements", "Review"];

export default function NewOrder() {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    projectName: "",
    serviceType: SERVICE_TYPES[0],
    description: "",
    budget: BUDGET_RANGES[1],
    deadline: "",
    files: [],
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const createOrderMutation = useCreateOrderMutation();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validateStep1() {
    const e = {};
    if (!form.projectName.trim()) e.projectName = "Project name is required.";
    if (!form.description.trim() || form.description.trim().length < 10)
      e.description = "Please provide a description (min. 10 characters).";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e = {};
    if (!form.deadline) e.deadline = "Please choose a deadline.";
    else if (new Date(form.deadline) < new Date(new Date().toDateString()))
      e.deadline = "Deadline cannot be in the past.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(s + 1, 3));
  }

  function goBack() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  }

  function handleFiles(fileList) {
    const names = Array.from(fileList).map((f) => f.name);
    update("files", [...form.files, ...names]);
  }

  function removeFile(name) {
    update("files", form.files.filter((f) => f !== name));
  }

  async function handleSubmit() {
    try {
      const order = await createOrderMutation.mutateAsync({
        projectName: form.projectName,
        serviceType: form.serviceType,
        description: form.description,
        budgetRange: form.budget,
        deadline: form.deadline,
        attachments: form.files,
      });

      toast({
        title: "Order submitted",
        description: `${order.orderNumber} — "${order.projectName}" was created successfully.`,
      });
      navigate("/client");
    } catch (mutationError) {
      toast({
        title: "Order submission failed",
        description: mutationError?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New Order</h1>
        <p className="text-sm text-slate-500 mt-1">Tell us about your project in a few quick steps.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Stepper steps={STEPS} currentStep={step} />

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Name</label>
                <Input
                  placeholder="e.g. Customer Portal Revamp"
                  value={form.projectName}
                  onChange={(e) => update("projectName", e.target.value)}
                />
                {errors.projectName && <p className="text-xs text-red-500 mt-1">{errors.projectName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Service Type</label>
                <Select value={form.serviceType} onChange={(e) => update("serviceType", e.target.value)}>
                  {SERVICE_TYPES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <Textarea
                  rows={5}
                  placeholder="Describe your project goals, scope, and any specific requirements..."
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Budget Range</label>
                <Select value={form.budget} onChange={(e) => update("budget", e.target.value)}>
                  {BUDGET_RANGES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Deadline</label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => update("deadline", e.target.value)}
                />
                {errors.deadline && <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Attachments</label>
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-10 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors"
                >
                  <UploadCloud className="h-8 w-8 text-slate-400" />
                  <p className="text-sm text-slate-600">
                    <span className="text-indigo-600 font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-400">PDF, DOCX, PNG up to 10MB (mock upload)</p>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  />
                </label>
                {form.files.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {form.files.map((f) => (
                      <li key={f} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                        <span className="flex items-center gap-2 text-slate-700">
                          <FileText className="h-4 w-4 text-slate-400" /> {f}
                        </span>
                        <button onClick={() => removeFile(f)} className="text-slate-400 hover:text-red-500">
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                <SummaryRow label="Project Name" value={form.projectName} />
                <SummaryRow label="Service Type" value={form.serviceType} />
                <SummaryRow label="Description" value={form.description} />
                <SummaryRow label="Budget" value={form.budget} />
                <SummaryRow label="Deadline" value={form.deadline} />
                <SummaryRow label="Attachments" value={form.files.length ? form.files.join(", ") : "None"} />
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Please review your order details before submitting. Our team will respond within 1 business day.
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            <Button variant="outline" onClick={goBack} disabled={step === 1}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < 3 ? (
              <Button onClick={goNext}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
                <Button onClick={handleSubmit} disabled={createOrderMutation.isPending}>
                {createOrderMutation.isPending ? "Submitting..." : "Submit Order"} <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 px-4 py-3">
      <span className="text-sm text-slate-500 sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-slate-900 font-medium break-words">{value || "—"}</span>
    </div>
  );
}
