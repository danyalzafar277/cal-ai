"use client";

import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, TrendingDown, Download, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuthStore } from "@/store";
import { useProjects } from "@/hooks/useProjects";
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

export default function InvestmentsPage() {
  const { user, workspace } = useAuthStore();
  const { can } = usePermissions();
  const { projects } = useProjects(workspace?.id ?? null);
  const { investments, loading } = useInvestments(workspace?.id ?? null);

  const [filterProject, setFilterProject] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Investment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Investment | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const activeProjects = projects.filter((p) => p.status === "active");

  const filtered = useMemo(() => {
    if (filterProject === "all") return investments;
    return investments.filter((i) => i.projectId === filterProject);
  }, [investments, filterProject]);

  const getProjectName = (id: string) =>
    projects.find((p) => p.id === id)?.name ?? id;

  const columns: ColumnDef<Investment>[] = [
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
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.category}
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
        <span className="text-sm font-semibold text-red-500">
          -{formatCurrency(row.original.amount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: "Method",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.paymentMethod || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          {can("investment.edit") && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setEditTarget(row.original)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {can("investment.delete") && (
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

  async function handleAdd(values: InvestmentFormValues) {
    if (!selectedProjectId) { toast.error("Please select a project"); return; }
    setSubmitting(true);
    try {
      const inv = await createInvestment(workspace!.id, selectedProjectId, user!.uid, values);
      await logActivity(workspace!.id, user!.uid, user!.displayName ?? "", "investment.created", "investment", inv.id, `${values.category}`, selectedProjectId);
      toast.success("Investment added");
      setAddOpen(false);
    } catch { toast.error("Failed to add investment"); }
    finally { setSubmitting(false); }
  }

  async function handleEdit(values: InvestmentFormValues) {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await updateInvestment(editTarget.id, user!.uid, values);
      toast.success("Investment updated");
      setEditTarget(null);
    } catch { toast.error("Failed to update investment"); }
    finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await softDeleteInvestment(deleteTarget.id, user!.uid);
      toast.success("Investment deleted");
      setDeleteTarget(null);
    } catch { toast.error("Failed to delete investment"); }
  }

  if (loading) return <PageLoader />;

  const totalAmount = filtered.reduce((s, i) => s + i.amount, 0);

  return (
    <>
      <PageHeader
        title="Investments"
        description={`${filtered.length} record${filtered.length !== 1 ? "s" : ""} · Total: ${formatCurrency(totalAmount, workspace?.defaultCurrency ?? "USD")}`}
        icon={TrendingDown}
        actions={
          <div className="flex items-center gap-2">
            {can("export.data") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportInvestmentsToExcel(filtered)}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            )}
            {can("investment.create") && (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4" />
                Add investment
              </Button>
            )}
          </div>
        }
      />

      {/* Project filter */}
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

      {investments.length === 0 ? (
        <EmptyState
          icon={TrendingDown}
          title="No investments yet"
          description="Add investments across your projects to track costs."
          action={
            can("investment.create")
              ? { label: "Add investment", onClick: () => setAddOpen(true) }
              : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          searchPlaceholder="Search investments…"
          emptyState={
            <EmptyState title="No matching investments" />
          }
        />
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add investment</DialogTitle>
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
          <InvestmentForm
            onSubmit={handleAdd}
            loading={submitting}
            defaultCurrency={workspace?.defaultCurrency ?? "USD"}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit investment</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <InvestmentForm
              onSubmit={handleEdit}
              loading={submitting}
              submitLabel="Save changes"
              defaultValues={{
                platform: editTarget.platform,
                category: editTarget.category,
                amount: editTarget.amount,
                currency: editTarget.currency,
                date: editTarget.date,
                paymentMethod: editTarget.paymentMethod,
                note: editTarget.note,
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete investment?"
        description="This investment will be removed from all totals. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
