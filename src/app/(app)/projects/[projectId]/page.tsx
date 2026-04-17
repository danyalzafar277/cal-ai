"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Edit,
  Archive,
  RotateCcw,
  Trash2,
  Plus,
  TrendingDown,
  TrendingUp,
  DollarSign,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { KPICard } from "@/components/shared/KPICard";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { InvestmentRevenueChart } from "@/components/charts/InvestmentRevenueChart";
import { RecoveryChart } from "@/components/charts/RecoveryChart";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { useAuthStore } from "@/store";
import { useProject } from "@/hooks/useProjects";
import { useInvestments } from "@/hooks/useInvestments";
import { useRevenues } from "@/hooks/useRevenues";
import { useProjectMetrics } from "@/hooks/useMetrics";
import { usePermissions } from "@/hooks/usePermissions";

import {
  archiveProject,
  restoreProject,
  softDeleteProject,
  updateProject,
} from "@/lib/services/projects";
import {
  createInvestment,
  softDeleteInvestment,
} from "@/lib/services/investments";
import { createRevenue, softDeleteRevenue } from "@/lib/services/revenues";
import { logActivity } from "@/lib/services/activity";
import { formatCurrency, formatDate, formatRelative, formatPercent } from "@/lib/format";

import { ProjectForm } from "@/components/projects/ProjectForm";
import { InvestmentForm } from "@/components/investments/InvestmentForm";
import { RevenueForm } from "@/components/revenue/RevenueForm";
import type { ProjectFormValues, InvestmentFormValues, RevenueFormValues } from "@/lib/validations";
import type { Investment, Revenue } from "@/types";
import { cn } from "@/lib/utils";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { user, workspace } = useAuthStore();
  const { can } = usePermissions();

  const { project, loading } = useProject(projectId);
  const { investments } = useInvestments(workspace?.id ?? null, projectId);
  const { revenues } = useRevenues(workspace?.id ?? null, projectId);
  const metrics = useProjectMetrics(investments, revenues);

  const [editOpen, setEditOpen] = useState(false);
  const [addInvOpen, setAddInvOpen] = useState(false);
  const [addRevOpen, setAddRevOpen] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <PageLoader />;
  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="This project may have been deleted or does not exist."
        action={{ label: "Back to projects", onClick: () => router.push("/projects") }}
      />
    );
  }

  async function handleEdit(values: ProjectFormValues) {
    setSubmitting(true);
    try {
      await updateProject(project!.id, user!.uid, values);
      await logActivity(workspace!.id, user!.uid, user!.displayName ?? "", "project.updated", "project", project!.id, project!.name, project!.id);
      toast.success("Project updated");
      setEditOpen(false);
    } catch { toast.error("Failed to update project"); }
    finally { setSubmitting(false); }
  }

  async function handleAddInvestment(values: InvestmentFormValues) {
    setSubmitting(true);
    try {
      const inv = await createInvestment(workspace!.id, projectId, user!.uid, values);
      await logActivity(workspace!.id, user!.uid, user!.displayName ?? "", "investment.created", "investment", inv.id, `${values.category} - ${values.amount}`, projectId);
      toast.success("Investment added");
      setAddInvOpen(false);
    } catch { toast.error("Failed to add investment"); }
    finally { setSubmitting(false); }
  }

  async function handleAddRevenue(values: RevenueFormValues) {
    setSubmitting(true);
    try {
      const rev = await createRevenue(workspace!.id, projectId, user!.uid, values);
      await logActivity(workspace!.id, user!.uid, user!.displayName ?? "", "revenue.created", "revenue", rev.id, `${values.source} - ${values.amount}`, projectId);
      toast.success("Revenue added");
      setAddRevOpen(false);
    } catch { toast.error("Failed to add revenue"); }
    finally { setSubmitting(false); }
  }

  async function handleArchiveToggle() {
    try {
      if (project!.status === "archived") {
        await restoreProject(project!.id, user!.uid);
        toast.success("Project restored");
      } else {
        await archiveProject(project!.id, user!.uid);
        toast.success("Project archived");
      }
      setArchiveConfirm(false);
    } catch { toast.error("Action failed"); }
  }

  async function handleDelete() {
    try {
      await softDeleteProject(project!.id, user!.uid);
      toast.success("Project deleted");
      router.push("/projects");
    } catch { toast.error("Failed to delete project"); }
    setDeleteConfirm(false);
  }

  async function handleReset() {
    // Soft-delete all investments and revenues
    try {
      await Promise.all([
        ...investments.map((i) => softDeleteInvestment(i.id, user!.uid)),
        ...revenues.map((r) => softDeleteRevenue(r.id, user!.uid)),
      ]);
      toast.success("Financial data reset");
    } catch { toast.error("Reset failed"); }
    setResetConfirm(false);
  }

  const isArchived = project.status === "archived";
  const netColor = metrics.netProfitLoss >= 0 ? "text-green-600" : "text-red-500";

  return (
    <>
      {/* Project header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ backgroundColor: project.colorTag + "20" }}
          >
            {project.iconEmoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{project.name}</h1>
              {isArchived && <Badge variant="secondary">Archived</Badge>}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{project.type}</Badge>
              <span className="text-xs text-muted-foreground">{project.currency}</span>
              {project.platforms.map((p) => (
                <span key={p} className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {p}
                </span>
              ))}
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {can("investment.create") && !isArchived && (
            <Button size="sm" variant="outline" onClick={() => setAddInvOpen(true)}>
              <TrendingDown className="w-4 h-4 text-red-500" />
              Add investment
            </Button>
          )}
          {can("revenue.create") && !isArchived && (
            <Button size="sm" onClick={() => setAddRevOpen(true)}>
              <TrendingUp className="w-4 h-4" />
              Add revenue
            </Button>
          )}
          {can("project.edit") && (
            <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}>
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {can("project.archive") && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setArchiveConfirm(true)}
              title={isArchived ? "Restore project" : "Archive project"}
            >
              {isArchived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            </Button>
          )}
          {can("project.reset") && !isArchived && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setResetConfirm(true)}
              title="Reset financial data"
              className="text-amber-600 hover:text-amber-700"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          {can("project.delete") && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeleteConfirm(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total invested"
          value={formatCurrency(metrics.totalInvestment, project.currency)}
          icon={TrendingDown}
          iconColor="text-red-500"
          subtitle={`${metrics.investmentCount} record${metrics.investmentCount !== 1 ? "s" : ""}`}
        />
        <KPICard
          title="Total revenue"
          value={formatCurrency(metrics.totalRevenue, project.currency)}
          icon={TrendingUp}
          iconColor="text-green-600"
          subtitle={`${metrics.revenueCount} record${metrics.revenueCount !== 1 ? "s" : ""}`}
          accent
        />
        <KPICard
          title="Net P&L"
          value={`${metrics.netProfitLoss >= 0 ? "+" : ""}${formatCurrency(metrics.netProfitLoss, project.currency)}`}
          icon={DollarSign}
          iconColor={metrics.netProfitLoss >= 0 ? "text-green-600" : "text-red-500"}
          subtitle={metrics.netProfitLoss >= 0 ? "Profit" : "Loss"}
        />
        <KPICard
          title="Recovery"
          value={metrics.totalInvestment > 0 ? formatPercent(metrics.recoveryPercent) : "—"}
          icon={BarChart3}
          iconColor="text-primary"
          subtitle={
            metrics.totalInvestment > 0
              ? `${formatCurrency(metrics.remainingToRecover, project.currency)} remaining`
              : "No investment yet"
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <InvestmentRevenueChart
          investments={investments}
          revenues={revenues}
          currency={project.currency}
        />
        <RecoveryChart metrics={metrics} currency={project.currency} />
      </div>

      {/* Recent activity tabs */}
      <Tabs defaultValue="investments">
        <TabsList>
          <TabsTrigger value="investments">
            Recent Investments ({investments.slice(0, 5).length})
          </TabsTrigger>
          <TabsTrigger value="revenues">
            Recent Revenue ({revenues.slice(0, 5).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="investments">
          <Card>
            <CardContent className="p-0">
              {investments.length === 0 ? (
                <EmptyState
                  icon={TrendingDown}
                  title="No investments yet"
                  description="Add your first investment to start tracking costs."
                  action={
                    can("investment.create") && !isArchived
                      ? { label: "Add investment", onClick: () => setAddInvOpen(true) }
                      : undefined
                  }
                />
              ) : (
                <div className="divide-y">
                  {investments.slice(0, 8).map((inv) => (
                    <InvestmentRow key={inv.id} investment={inv} currency={project.currency} />
                  ))}
                  {investments.length > 8 && (
                    <div className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/projects/${projectId}/investments`)}
                      >
                        View all {investments.length} investments
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenues">
          <Card>
            <CardContent className="p-0">
              {revenues.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="No revenue yet"
                  description="Add your first revenue entry to start tracking income."
                  action={
                    can("revenue.create") && !isArchived
                      ? { label: "Add revenue", onClick: () => setAddRevOpen(true) }
                      : undefined
                  }
                />
              ) : (
                <div className="divide-y">
                  {revenues.slice(0, 8).map((rev) => (
                    <RevenueRow key={rev.id} revenue={rev} currency={project.currency} />
                  ))}
                  {revenues.length > 8 && (
                    <div className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/projects/${projectId}/revenue`)}
                      >
                        View all {revenues.length} revenue entries
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
          </DialogHeader>
          <ProjectForm
            onSubmit={handleEdit}
            defaultValues={{
              name: project.name,
              type: project.type,
              description: project.description,
              iconEmoji: project.iconEmoji,
              colorTag: project.colorTag,
              launchDate: project.launchDate ?? "",
              platforms: project.platforms,
              currency: project.currency,
              targetRecoveryAmount: project.targetRecoveryAmount,
              targetMonthlyRevenue: project.targetMonthlyRevenue,
              tags: project.tags,
            }}
            submitLabel="Save changes"
            loading={submitting}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={addInvOpen} onOpenChange={setAddInvOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add investment</DialogTitle>
          </DialogHeader>
          <InvestmentForm
            onSubmit={handleAddInvestment}
            loading={submitting}
            defaultCurrency={project.currency}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={addRevOpen} onOpenChange={setAddRevOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add revenue</DialogTitle>
          </DialogHeader>
          <RevenueForm
            onSubmit={handleAddRevenue}
            loading={submitting}
            defaultCurrency={project.currency}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={archiveConfirm}
        onOpenChange={setArchiveConfirm}
        title={isArchived ? "Restore project?" : "Archive project?"}
        description={
          isArchived
            ? "This project will be moved back to active projects."
            : "This project will be archived and hidden from active views. All data is preserved."
        }
        confirmLabel={isArchived ? "Restore" : "Archive"}
        onConfirm={handleArchiveToggle}
      />

      <ConfirmDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        title="Delete project?"
        description="This project will be soft-deleted and hidden. This action cannot be reversed from the UI."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />

      <ConfirmDialog
        open={resetConfirm}
        onOpenChange={setResetConfirm}
        title="Reset financial data?"
        description="All investments and revenues for this project will be soft-deleted. The project identity is preserved. This cannot be undone."
        confirmLabel="Reset data"
        onConfirm={handleReset}
        destructive
      />
    </>
  );
}

function InvestmentRow({ investment, currency }: { investment: Investment; currency: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{investment.category}</span>
          <span className="text-xs text-muted-foreground">· {investment.platform}</span>
        </div>
        {investment.note && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{investment.note}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-red-500">
          -{formatCurrency(investment.amount, currency)}
        </p>
        <p className="text-xs text-muted-foreground">{formatDate(investment.date)}</p>
      </div>
    </div>
  );
}

function RevenueRow({ revenue, currency }: { revenue: Revenue; currency: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{revenue.source}</span>
          <span className="text-xs text-muted-foreground">· {revenue.platform}</span>
        </div>
        {revenue.note && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{revenue.note}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-green-600">
          +{formatCurrency(revenue.amount, currency)}
        </p>
        <p className="text-xs text-muted-foreground">{formatDate(revenue.date)}</p>
      </div>
    </div>
  );
}
