"use client";

import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, TrendingUp, Download, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuthStore } from "@/store";
import { useProjects } from "@/hooks/useProjects";
import { useRevenues } from "@/hooks/useRevenues";
import { usePermissions } from "@/hooks/usePermissions";
import {
  createRevenue,
  updateRevenue,
  softDeleteRevenue,
} from "@/lib/services/revenues";
import { logActivity } from "@/lib/services/activity";
import { exportRevenuesToExcel } from "@/lib/export";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Revenue } from "@/types";
import type { RevenueFormValues } from "@/lib/validations";

export default function RevenuePage() {
  const { user, workspace } = useAuthStore();
  const { can } = usePermissions();
  const { projects } = useProjects(workspace?.id ?? null);
  const { revenues, loading } = useRevenues(workspace?.id ?? null);

  const [filterProject, setFilterProject] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Revenue | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Revenue | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const activeProjects = projects.filter((p) => p.status === "active");

  const filtered = useMemo(() => {
    if (filterProject === "all") return revenues;
    return revenues.filter((r) => r.projectId === filterProject);
  }, [revenues, filterProject]);

  const getProjectName = (id: string) =>
    projects.find((p) => p.id === id)?.name ?? id;

  const columns: ColumnDef<Revenue>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm">{formatDate(row.original.date)}</span>
      ),
    },
    {
      id: "project",
      header: "Project",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {getProjectName(row.original.projectId)}
        </span>
      ),
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.source}
        </Badge>
      ),
    },
    {
      accessorKey: "platform",
      header: "Platform",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.platform}
        </span>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-green-600">
          +{formatCurrency(row.original.amount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.reference || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          {can("revenue.edit") && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setEditTarget(row.original)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {can("revenue.delete") && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  async function handleAdd(values: RevenueFormValues) {
    if (!selectedProjectId) { toast.error("Please select a project"); return; }
    setSubmitting(true);
    try {
      const rev = await createRevenue(workspace!.id, selectedProjectId, user!.uid, values);
      await logActivity(workspace!.id, user!.uid, user!.displayName ?? "", "revenue.created", "revenue", rev.id, `${values.source}`, selectedProjectId);
      toast.success("Revenue added");
      setAddOpen(false);
    } catch { toast.error("Failed to add revenue"); }
    finally { setSubmitting(false); }
  }

  async function handleEdit(values: RevenueFormValues) {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await updateRevenue(editTarget.id, user!.uid, values);
      toast.success("Revenue updated");
      setEditTarget(null);
    } catch { toast.error("Failed to update revenue"); }
    finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await softDeleteRevenue(deleteTarget.id, user!.uid);
      toast.success("Revenue deleted");
      setDeleteTarget(null);
    } catch { toast.error("Failed to delete revenue"); }
  }

  if (loading) return <PageLoader />;

  const totalAmount = filtered.reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <PageHeader
        title="Revenue"
        description={`${filtered.length} record${filtered.length !== 1 ? "s" : ""} · Total: ${formatCurrency(totalAmount, workspace?.defaultCurrency ?? "USD")}`}
        icon={TrendingUp}
        actions={
          <div className="flex items-center gap-2">
            {can("export.data") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportRevenuesToExcel(filtered)}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            )}
            {can("revenue.create") && (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4" />
                Add revenue
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-4">
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {activeProjects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.iconEmoji} {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {revenues.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No revenue yet"
          description="Add revenue entries across your projects."
          action={
            can("revenue.create")
              ? { label: "Add revenue", onClick: () => setAddOpen(true) }
              : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          searchPlaceholder="Search revenue…"
        />
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add revenue</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <label className="text-sm font-medium mb-1.5 block">Project *</label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {activeProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.iconEmoji} {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <RevenueForm
            onSubmit={handleAdd}
            loading={submitting}
            defaultCurrency={workspace?.defaultCurrency ?? "USD"}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit revenue</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <RevenueForm
              onSubmit={handleEdit}
              loading={submitting}
              submitLabel="Save changes"
              defaultValues={{
                source: editTarget.source,
                platform: editTarget.platform,
                amount: editTarget.amount,
                currency: editTarget.currency,
                date: editTarget.date,
                paymentMethod: editTarget.paymentMethod,
                reference: editTarget.reference,
                note: editTarget.note,
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete revenue?"
        description="This revenue entry will be removed from all totals."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
