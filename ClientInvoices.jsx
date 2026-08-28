import React, { useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Lock, ReceiptText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Modal, useToast } from "./ui.jsx";
import { formatCurrency, INVOICE_STATUS_STYLES, formatRelativeTime } from "./orderConstants.jsx";
import { useInvoicesQuery, usePayInvoiceMutation } from "./orbitApi.jsx";

function paymentLabel(invoice) {
  return invoice.status === "PENDING_DEPOSIT" ? "Pay Deposit (50%)" : "Pay Invoice";
}

export default function ClientInvoices() {
  const { toast } = useToast();
  const { data: invoices = [], isLoading, isError, error, refetch } = useInvoicesQuery();
  const payInvoiceMutation = usePayInvoiceMutation();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ cardName: "", cardNumber: "", expiry: "", cvc: "" });

  const summary = useMemo(() => {
    const unpaid = invoices.filter((invoice) => invoice.status !== "PAID").length;
    const totalDue = invoices.reduce((sum, invoice) => sum + (invoice.status === "PAID" ? 0 : Number(invoice.amount)), 0);
    return { unpaid, totalDue };
  }, [invoices]);

  function openPayment(invoice) {
    setSelectedInvoice(invoice);
    setPaymentForm({ cardName: "", cardNumber: "", expiry: "", cvc: "" });
  }

  async function submitPayment(event) {
    event.preventDefault();
    if (!selectedInvoice) {
      return;
    }

    try {
      await payInvoiceMutation.mutateAsync({ invoiceId: selectedInvoice.id });
      toast({ title: "Payment confirmed", description: `${selectedInvoice.invoiceNumber} has been marked as paid.` });
      setSelectedInvoice(null);
    } catch (mutationError) {
      toast({
        title: "Payment failed",
        description: mutationError?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return <Card className="bg-white dark:bg-slate-900"><CardContent className="py-12 text-center text-slate-500">Loading invoices...</CardContent></Card>;
  }

  if (isError) {
    return (
      <Card className="bg-white dark:bg-slate-900">
        <CardContent className="py-12 text-center space-y-3">
          <p className="text-slate-700 dark:text-slate-100">Failed to load invoices.</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error?.message ?? "Please try again."}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Invoices</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track your outstanding work, deposits, and completed payments.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-white dark:bg-slate-900">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Outstanding Invoices</CardTitle>
            <ReceiptText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{summary.unpaid}</p>
            <p className="text-xs text-slate-400 mt-1">Invoices awaiting settlement</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Due</CardTitle>
            <CreditCard className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(summary.totalDue)}</p>
            <p className="text-xs text-slate-400 mt-1">Including deposits and open invoices</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-slate-900">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Invoice #</th>
                  <th className="px-4 py-3 font-medium">Order Name</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{invoice.order.projectName}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{formatCurrency(invoice.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge className={INVOICE_STATUS_STYLES[invoice.status]}>
                        {invoice.status === "PENDING_DEPOSIT" ? "Pending Deposit" : invoice.status === "PAID" ? "Paid" : "Unpaid"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{invoice.dueDate}</td>
                    <td className="px-4 py-3 text-right">
                      {invoice.status !== "PAID" ? (
                        <Button onClick={() => openPayment(invoice)}>{paymentLabel(invoice)}</Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" /> Paid {formatRelativeTime(invoice.paidAt ?? invoice.createdAt)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal open={!!selectedInvoice} onClose={() => setSelectedInvoice(null)}>
        {selectedInvoice && (
          <form onSubmit={submitPayment} className="p-6 space-y-5">
            <div>
              <p className="text-xs text-slate-400">{selectedInvoice.invoiceNumber}</p>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{selectedInvoice.order.projectName}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{formatCurrency(selectedInvoice.amount)}</p>
            </div>

            <div className="grid gap-4">
              <Input required placeholder="Cardholder name" value={paymentForm.cardName} onChange={(event) => setPaymentForm((form) => ({ ...form, cardName: event.target.value }))} />
              <Input required placeholder="Card number" value={paymentForm.cardNumber} onChange={(event) => setPaymentForm((form) => ({ ...form, cardNumber: event.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input required placeholder="MM/YY" value={paymentForm.expiry} onChange={(event) => setPaymentForm((form) => ({ ...form, expiry: event.target.value }))} />
                <Input required placeholder="CVC" value={paymentForm.cvc} onChange={(event) => setPaymentForm((form) => ({ ...form, cvc: event.target.value }))} />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-sm text-slate-600 dark:text-slate-300 flex items-start gap-3">
              <Lock className="h-4 w-4 mt-0.5 text-emerald-500" />
              This is a mock Stripe payment flow. Submitting will mark the invoice as paid and refresh the dashboard immediately.
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setSelectedInvoice(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={payInvoiceMutation.isPending}>
                {payInvoiceMutation.isPending ? "Processing..." : paymentLabel(selectedInvoice)}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}