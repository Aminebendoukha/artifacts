import React, { useState } from "react";
import { Building2, PlusCircle, RefreshCw, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Modal, Input, useToast } from "./ui.jsx";
import { formatCurrency } from "./orderConstants.jsx";
import { useClientsQuery, useCreateClientWorkspaceMutation } from "./orbitApi.jsx";

export default function AdminClients() {
  const { toast } = useToast();
  const { data: clients = [], isLoading, isError, error, refetch } = useClientsQuery();
  const createWorkspaceMutation = useCreateClientWorkspaceMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");

  async function submitNewClient(event) {
    event.preventDefault();

    try {
      await createWorkspaceMutation.mutateAsync({ name });
      toast({ title: "Workspace created", description: `${name} was added successfully.` });
      setModalOpen(false);
      setName("");
    } catch (mutationError) {
      toast({
        title: "Creation failed",
        description: mutationError?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return <Card className="bg-white dark:bg-slate-900"><CardContent className="py-12 text-center text-slate-500">Loading clients...</CardContent></Card>;
  }

  if (isError) {
    return (
      <Card className="bg-white dark:bg-slate-900">
        <CardContent className="py-12 text-center space-y-3">
          <p className="text-slate-700 dark:text-slate-100">Failed to load clients.</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error?.message ?? "Please try again."}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Client Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View all workspaces, active projects, and total spend.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <PlusCircle className="h-4 w-4" /> Create New Client Workspace
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-900">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Workspaces</CardTitle>
            <Building2 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{clients.length}</p>
            <p className="text-xs text-slate-400 mt-1">Active client accounts</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Active Projects</CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{clients.reduce((sum, client) => sum + client.activeProjects, 0)}</p>
            <p className="text-xs text-slate-400 mt-1">Across all workspaces</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Spend</CardTitle>
            <RefreshCw className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(clients.reduce((sum, client) => sum + client.totalSpend, 0))}</p>
            <p className="text-xs text-slate-400 mt-1">Paid invoice revenue</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-slate-900">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Workspace</th>
                  <th className="px-4 py-3 font-medium">Active Projects</th>
                  <th className="px-4 py-3 font-medium">Total Spend</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{client.name}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{client.activeProjects}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{formatCurrency(client.totalSpend)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(client.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={submitNewClient} className="p-6 space-y-5">
          <div>
            <p className="text-xs text-slate-400">Workspace</p>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mt-1">Create New Client Workspace</h2>
          </div>
          <Input required placeholder="e.g. Northwind Logistics" value={name} onChange={(event) => setName(event.target.value)} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createWorkspaceMutation.isPending}>
              {createWorkspaceMutation.isPending ? "Creating..." : "Create Workspace"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}