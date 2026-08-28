import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, CheckCircle2, Circle, MessageSquare, Paperclip, AtSign, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Textarea, cn, useToast } from "./ui.jsx";
import {
  ORDER_STATUS_OPTIONS,
  ORDER_STATUS_STYLES,
  formatCurrency,
  formatRelativeTime,
} from "./orderConstants.jsx";
import {
  useAddOrderCommentMutation,
  useOrderQuery,
  useOrderThreadQuery,
  useUploadFileMutation,
} from "./orbitApi.jsx";

const TAB_OPTIONS = [
  { value: "metadata", label: "Metadata" },
  { value: "activity", label: "Activity & Messages" },
];

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: order, isLoading, isError, error, refetch } = useOrderQuery(id);
  const { data: thread } = useOrderThreadQuery(id);
  const addOrderCommentMutation = useAddOrderCommentMutation();
  const uploadFileMutation = useUploadFileMutation();
  const [activeTab, setActiveTab] = useState("metadata");
  const [draft, setDraft] = useState("");
  const [queuedFiles, setQueuedFiles] = useState([]);
  const [commenting, setCommenting] = useState(false);

  const timeline = useMemo(() => {
    const commentEvents = (thread?.comments ?? []).map((comment) => ({
      id: `comment-${comment.id}`,
      type: "comment",
      createdAt: comment.createdAt,
      user: comment.user,
      summary: comment.text,
      attachments: comment.attachments ?? [],
    }));

    const activityEvents = (thread?.activities ?? []).map((activity) => ({
      id: `activity-${activity.id}`,
      type: "activity",
      createdAt: activity.createdAt,
      user: activity.user,
      summary: activity.summary,
    }));

    return [...commentEvents, ...activityEvents].sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
  }, [thread]);

  async function handleAttachFiles(event) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    try {
      const uploaded = await Promise.all(files.map((file) => uploadFileMutation.mutateAsync(file)));
      setQueuedFiles((current) => [...current, ...uploaded]);
      toast({ title: "Files attached", description: `${uploaded.length} file(s) are ready to send with the message.` });
    } catch (uploadError) {
      toast({
        title: "Upload failed",
        description: uploadError?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  }

  function insertMention(mention) {
    setDraft((current) => `${current}${current ? " " : ""}${mention}`);
  }

  async function submitComment(event) {
    event.preventDefault();

    if (!draft.trim()) {
      toast({ title: "Comment required", description: "Please type a message before sending.", variant: "destructive" });
      return;
    }

    try {
      setCommenting(true);
      await addOrderCommentMutation.mutateAsync({ orderId: id, text: draft, attachments: queuedFiles });
      toast({ title: "Comment posted", description: "The thread has been updated in real time." });
      setDraft("");
      setQueuedFiles([]);
    } catch (mutationError) {
      toast({
        title: "Comment failed",
        description: mutationError?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCommenting(false);
    }
  }

  if (isLoading) {
    return <Card className="bg-white dark:bg-slate-900"><CardContent className="py-12 text-center text-slate-500">Loading order details...</CardContent></Card>;
  }

  if (isError) {
    return (
      <Card className="bg-white dark:bg-slate-900">
        <CardContent className="py-12 text-center space-y-3">
          <p className="text-slate-700 dark:text-slate-100">Unable to load the order.</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error?.message ?? "Please try again."}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 dark:text-slate-400">Order not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/client")}>Back to Dashboard</Button>
      </div>
    );
  }

  const currentIdx = ORDER_STATUS_OPTIONS.findIndex((status) => status.label === order.status);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate("/client")} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-400">{order.orderNumber}</p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{order.projectName}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{order.workspaceName}</p>
        </div>
        <Badge className={cn("text-sm px-3 py-1", ORDER_STATUS_STYLES[order.status])}>{order.status}</Badge>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 w-fit">
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.value
                ? "bg-indigo-600 text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "metadata" ? (
        <>
          <Card className="bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Progress Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 space-y-8">
                {ORDER_STATUS_OPTIONS.map(({ label: status }, idx) => {
                  const done = idx <= currentIdx;
                  return (
                    <li key={status} className="ml-6">
                      <span
                        className={cn(
                          "absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900",
                          done ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-400"
                        )}
                      >
                        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
                      </span>
                      <p className={cn("text-sm font-medium", done ? "text-slate-900 dark:text-slate-100" : "text-slate-400")}>{status}</p>
                      {idx === currentIdx && <p className="text-xs text-slate-400 mt-0.5">Current stage as of {order.date}</p>}
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <DetailRow label="Service Type" value={order.serviceType} />
                <DetailRow label="Budget" value={order.budgetRange} />
                <DetailRow label="Deadline" value={order.deadline} />
                <DetailRow label="Date Created" value={order.date} />
                <div>
                  <p className="text-slate-500 dark:text-slate-400 mb-1">Description</p>
                  <p className="text-slate-800 dark:text-slate-100">{order.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                {order.attachments?.length === 0 ? (
                  <p className="text-sm text-slate-400">No files attached.</p>
                ) : (
                  <ul className="space-y-2">
                    {order.attachments?.map((file) => (
                      <li key={file.id ?? file.fileName} className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
                        <FileText className="h-4 w-4 text-slate-400" /> {file.fileName}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {order.invoices?.length === 0 ? (
                <p className="text-sm text-slate-400">No invoices available yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {order.invoices.map((invoice) => (
                    <div key={invoice.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                      <p className="text-xs text-slate-400">{invoice.invoiceNumber}</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(invoice.amount)}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Due {invoice.dueDate}</p>
                      <Badge className={cn("mt-3", ORDER_STATUS_STYLES[invoice.status === "PAID" ? "Completed" : invoice.status === "PENDING_DEPOSIT" ? "Review" : "Pending"])}>
                        {invoice.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-3 bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Activity & Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={submitComment} className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/40">
                <Textarea
                  rows={4}
                  placeholder="Write an update, mention a teammate with @, or share progress notes..."
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => insertMention("@Atlas Team")} className="inline-flex items-center gap-1 rounded-full border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <AtSign className="h-3 w-3" /> Atlas Team
                  </button>
                  <button type="button" onClick={() => insertMention("@Admin")} className="inline-flex items-center gap-1 rounded-full border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <AtSign className="h-3 w-3" /> Admin
                  </button>
                  <button type="button" onClick={() => insertMention("@Client")} className="inline-flex items-center gap-1 rounded-full border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <AtSign className="h-3 w-3" /> Client
                  </button>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <Paperclip className="h-3 w-3" /> Attach files
                    <Input type="file" multiple className="hidden" onChange={handleAttachFiles} />
                  </label>
                  {queuedFiles.length > 0 && <span className="text-xs text-slate-500">{queuedFiles.length} attachment(s) queued</span>}
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={commenting}>
                    {commenting ? "Posting..." : "Post Comment"}
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>

              <div className="space-y-4">
                {timeline.length === 0 ? (
                  <p className="text-sm text-slate-400">No activity yet.</p>
                ) : (
                  timeline.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {entry.type === "comment" ? `${entry.user?.workspace?.name ?? "Team"} commented` : entry.summary}
                          </p>
                          <p className="text-xs text-slate-400">{formatRelativeTime(entry.createdAt)}</p>
                        </div>
                        <Badge className={entry.type === "comment" ? ORDER_STATUS_STYLES.Review : ORDER_STATUS_STYLES.Pending}>
                          {entry.type === "comment" ? "Message" : "Audit"}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{entry.summary}</p>
                      {entry.attachments?.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {entry.attachments.map((attachment) => (
                            <div key={attachment.id ?? attachment.fileName} className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
                              <FileText className="h-4 w-4 text-slate-400" /> {attachment.fileName}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 bg-white dark:bg-slate-900 h-fit">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Quick Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailRow label="Current Stage" value={order.status} />
              <DetailRow label="Client" value={order.workspaceName} />
              <DetailRow label="Budget" value={order.budgetRange} />
              <DetailRow label="Attachments" value={order.attachments?.length ?? 0} />
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-slate-600 dark:text-slate-300 text-xs">
                Messages and audit events are merged chronologically, so the thread doubles as the activity log.
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-slate-900 dark:text-slate-100 font-medium text-right">{value}</span>
    </div>
  );
}