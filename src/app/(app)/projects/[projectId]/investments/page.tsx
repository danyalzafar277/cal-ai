"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, TrendingDown, Download, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { InvestmentForm } from "@/components/investments/InvestmentForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useAuthStore } from "@/store";
import { useProject } from "@/hooks/useProjects";
import { useInvestments } from "@/hooks/useInvestments";
import { usePermissions } from "@/hooks/usePermissions";
import {
  createInvestment,
  updateInvestment,
  softDeleteInvestment,
} from "@/lib/services/investments";
import { logActivity } from "@/lib/services/activity";
import { exportInvestmentsToExcel } from "@/lib/export";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Investment } from "@/types";
import type { InvestmentFormValues } from "@/lib/validations";

export default function ProjectInvestmentsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { user, workspace } = useAuthStore();
  const { can } = usePermissions();
  const { project } = useProject(projectId);
  const { investments, loading } = useInvestments(workspace?.id ?? null, projectId);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Investment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Investment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const columns: ColumnDef<Investment>[] = [
    { accessorKey: "date", header: "Date", cell: ({ row }) => <span className="text-sm">{formatDate(row.original.date)}</span> },
    { accessorKey: "category", header: "Category", cell: ({ row }) => <Badge variant="outline" className="text-xs">{row.original.category}</Badge> },
    { accessorKey: "platform", header: "Platform", cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.platform}</span> },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => <span className="text-sm font-semibold text-red-500">-{formatCurrency(row.original.amount, row.original.currency)}</span> },
    { accessorKey: "paymentMethod", header: "Method", cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.paymentMethod || "—"}</span> },
    { accessorKey: "note", header: "Note", cell: ({ row }) => <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{row.original.note || "—"}</span> },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          {can("investment.edit") && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditTarget(row.original)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {can("investment.delete") && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(row.original)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  async function handleAdd(values: InvestmentFormValues) {
    setSubmitting(true);
    try {
      const inv = await createInvestment(workspace!.id, projectId, user!.uid, values);
      await logActivity(workspace!.id, user!.uid, user!.displayName ?? "", "investment.created", "investment", inv.id, values.category, projectId);
      toast.success("Investment added");
      setAddOpen(false);
    } catch { toast.error("Failed to add"); }
    finally { setSubmitting(false); }
  }

  async function handleEdit(values: InvestmentFormValues) {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await updateInvestment(editTarget.id, user!.uid, values);
      toast.success("Updated");
      setEditTarget(null);
    } catch { toast.error("Failed to update"); }
    finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await softDeleteInvestment(deleteTarget.id, user!.uid);
      toast.success("Deleted");
      setDeleteTarget(null);
    } catch { toast.error("Failed to delete"); }
  }

  if (loading) return <PageLoader />;

  const total = investments.reduce((s, i) => s + i.amount, 0);

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => router.push(`/projects/${projectId}`)}>
        <ArrowLeft className="w-4 h-4" />
        Back to {project?.name}
      </Button>
      <PageHeader
        title="Investments"
        description={`${investments.length} record${investments.length !== 1 ? "s" : ""} · ${formatCurrency(total, project?.currency ?? "USD")}`}
        icon={TrendingDown}
        actions={
          <div className="flex items-center gap-2">
            {can("export.data") && (
              <Button variant="outline" size="sm" onClick={() => exportInvestmentsToExcel(investments, project?.name)}>
                <Download className="w-4 h-4" /> Export
              </Button>
            )}
            {can("investment.create") && (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4" /> Add investment
              </Button>
            )}
          </div>
        }
      />

      {investments.length === 0 ? (
        <EmptyState icon={TrendingDown} title="No investments yet" action={can("investment.create") ? { label: "Add investment", onClick: () => setAddOpen(true) } : undefined} />
      ) : (
        <DataTable columns={columns} data={investments} searchPlaceholder="Search investments…" />
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add investment</DialogTitle></DialogHeader>
          <InvestmentForm onSubmit={handleAdd} loading={submitting} defaultCurrency={project?.currency} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit investment</DialogTitle></DialogHeader>
          {editTarget && (
            <InvestmentForm
              onSubmit={handleEdit}
              loading={submitting}
              submitLabel="Save changes"
              defaultValues={{ platform: editTarget.platform, category: editTarget.category, amount: editTarget.amount, currency: editTarget.currency, date: editTarget.date, paymentMethod: editTarget.paymentMethod, note: editTarget.note }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} title="Delete investment?" description="This will be removed from all totals." confirmLabel="Delete" onConfirm={handleDelete} destructive />
    </>
  );
}
