"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, TrendingUp, Download, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { RevenueForm } from "@/components/revenue/RevenueForm";
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
import { useRevenues } from "@/hooks/useRevenues";
import { usePermissions } from "@/hooks/usePermissions";
import { createRevenue, updateRevenue, softDeleteRevenue } from "@/lib/services/revenues";
import { logActivity } from "@/lib/services/activity";
import { exportRevenuesToExcel } from "@/lib/export";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Revenue } from "@/types";
import type { RevenueFormValues } from "@/lib/validations";

export default function ProjectRevenuePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { user, workspace } = useAuthStore();
  const { can } = usePermissions();
  const { project } = useProject(projectId);
  const { revenues, loading } = useRevenues(workspace?.id ?? null, projectId);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Revenue | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Revenue | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const columns: ColumnDef<Revenue>[] = [
    { accessorKey: "date", header: "Date", cell: ({ row }) => <span className="text-sm">{formatDate(row.original.date)}</span> },
    { accessorKey: "source", header: "Source", cell: ({ row }) => <Badge variant="outline" className="text-xs">{row.original.source}</Badge> },
    { accessorKey: "platform", header: "Platform", cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.platform}</span> },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => <span className="text-sm font-semibold text-green-600">+{formatCurrency(row.original.amount, row.original.currency)}</span> },
    { accessorKey: "paymentMethod", header: "Method", cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.paymentMethod || "—"}</span> },
    { accessorKey: "reference", header: "Ref", cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.reference || "—"}</span> },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          {can("revenue.edit") && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditTarget(row.original)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {can("revenue.delete") && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(row.original)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  async function handleAdd(values: RevenueFormValues) {
    setSubmitting(true);
    try {
      const rev = await createRevenue(workspace!.id, projectId, user!.uid, values);
      await logActivity(workspace!.id, user!.uid, user!.displayName ?? "", "revenue.created", "revenue", rev.id, values.source, projectId);
      toast.success("Revenue added");
      setAddOpen(false);
    } catch { toast.error("Failed to add"); }
    finally { setSubmitting(false); }
  }

  async function handleEdit(values: RevenueFormValues) {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await updateRevenue(editTarget.id, user!.uid, values);
      toast.success("Updated");
      setEditTarget(null);
    } catch { toast.error("Failed to update"); }
    finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await softDeleteRevenue(deleteTarget.id, user!.uid);
      toast.success("Deleted");
      setDeleteTarget(null);
    } catch { toast.error("Failed to delete"); }
  }

  if (loading) return <PageLoader />;
  const total = revenues.reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => router.push(`/projects/${projectId}`)}>
        <ArrowLeft className="w-4 h-4" /> Back to {project?.name}
      </Button>
      <PageHeader
        title="Revenue"
        description={`${revenues.length} record${revenues.length !== 1 ? "s" : ""} · ${formatCurrency(total, project?.currency ?? "USD")}`}
        icon={TrendingUp}
        actions={
          <div className="flex items-center gap-2">
            {can("export.data") && (
              <Button variant="outline" size="sm" onClick={() => exportRevenuesToExcel(revenues, project?.name)}>
                <Download className="w-4 h-4" /> Export
              </Button>
            )}
            {can("revenue.create") && (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4" /> Add revenue
              </Button>
            )}
          </div>
        }
      />

      {revenues.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No revenue yet" action={can("revenue.create") ? { label: "Add revenue", onClick: () => setAddOpen(true) } : undefined} />
      ) : (
        <DataTable columns={columns} data={revenues} searchPlaceholder="Search revenue…" />
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add revenue</DialogTitle></DialogHeader>
          <RevenueForm onSubmit={handleAdd} loading={submitting} defaultCurrency={project?.currency} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit revenue</DialogTitle></DialogHeader>
          {editTarget && (
            <RevenueForm
              onSubmit={handleEdit}
              loading={submitting}
              submitLabel="Save changes"
              defaultValues={{ source: editTarget.source, platform: editTarget.platform, amount: editTarget.amount, currency: editTarget.currency, date: editTarget.date, paymentMethod: editTarget.paymentMethod, reference: editTarget.reference, note: editTarget.note }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} title="Delete revenue?" description="This will be removed from all totals." confirmLabel="Delete" onConfirm={handleDelete} destructive />
    </>
  );
}
