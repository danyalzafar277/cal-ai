"use client";

import { useRouter } from "next/navigation";
import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  FolderOpen,
  BarChart3,
  Plus,
  Trophy,
  AlertCircle,
  Activity,
} from "lucide-react";

import { KPICard } from "@/components/shared/KPICard";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { InvestmentRevenueChart } from "@/components/charts/InvestmentRevenueChart";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useAuthStore } from "@/store";
import { useProjects } from "@/hooks/useProjects";
import { useInvestments } from "@/hooks/useInvestments";
import { useRevenues } from "@/hooks/useRevenues";
import { useCompanyMetrics } from "@/hooks/useMetrics";
import { usePermissions } from "@/hooks/usePermissions";

import { formatCurrency, formatPercent, formatRelative } from "@/lib/format";
import { calculateProjectMetrics } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const { user, workspace } = useAuthStore();
  const { can } = usePermissions();

  const { projects, loading: projLoading } = useProjects(workspace?.id ?? null);
  const { investments, loading: invLoading } = useInvestments(workspace?.id ?? null);
  const { revenues, loading: revLoading } = useRevenues(workspace?.id ?? null);

  const companyMetrics = useCompanyMetrics(projects, investments, revenues);
  const loading = projLoading || invLoading || revLoading;

  const activeProjects = projects.filter((p) => p.status === "active");

  if (loading) return <PageLoader />;

  const topProjects = activeProjects
    .map((p) => {
      const inv = investments.filter((i) => i.projectId === p.id);
      const rev = revenues.filter((r) => r.projectId === p.id);
      const m = calculateProjectMetrics(inv, rev);
      return { project: p, metrics: m };
    })
    .sort((a, b) => b.metrics.totalInvestment - a.metrics.totalInvestment)
    .slice(0, 5);

  return (
    <>
      {/* Welcome */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            Good day, {user?.displayName?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {workspace?.name} · {activeProjects.length} active project{activeProjects.length !== 1 ? "s" : ""}
          </p>
        </div>
        {can("project.create") && (
          <Button size="sm" onClick={() => router.push("/projects/new")}>
            <Plus className="w-4 h-4" />
            New project
          </Button>
        )}
      </div>

      {activeProjects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create your first project to start tracking your app portfolio."
          action={
            can("project.create")
              ? {
                  label: "Create your first project",
                  onClick: () => router.push("/projects/new"),
                }
              : undefined
          }
        />
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Active projects"
              value={String(companyMetrics.activeProjects)}
              icon={FolderOpen}
              subtitle={`${companyMetrics.archivedProjects} archived`}
            />
            <KPICard
              title="Total invested"
              value={formatCurrency(
                companyMetrics.totalInvestment,
                workspace?.defaultCurrency ?? "USD"
              )}
              icon={TrendingDown}
              iconColor="text-red-500"
            />
            <KPICard
              title="Total revenue"
              value={formatCurrency(
                companyMetrics.totalRevenue,
                workspace?.defaultCurrency ?? "USD"
              )}
              icon={TrendingUp}
              iconColor="text-green-600"
              accent
            />
            <KPICard
              title="Net P&L"
              value={`${companyMetrics.netProfitLoss >= 0 ? "+" : ""}${formatCurrency(
                companyMetrics.netProfitLoss,
                workspace?.defaultCurrency ?? "USD"
              )}`}
              icon={DollarSign}
              iconColor={
                companyMetrics.netProfitLoss >= 0
                  ? "text-green-600"
                  : "text-red-500"
              }
              subtitle={
                companyMetrics.totalInvestment > 0
                  ? `${formatPercent(companyMetrics.recoveryPercent)} recovered`
                  : undefined
              }
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <InvestmentRevenueChart
              investments={investments}
              revenues={revenues}
              currency={workspace?.defaultCurrency ?? "USD"}
            />
            <MonthlyTrendChart
              investments={investments}
              revenues={revenues}
              currency={workspace?.defaultCurrency ?? "USD"}
            />
          </div>

          {/* Projects summary + best/worst */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Projects list */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                      Projects Overview
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-xs"
                    >
                      <Link href="/projects">View all</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {topProjects.length === 0 ? (
                    <p className="px-6 pb-4 text-sm text-muted-foreground">
                      No projects yet
                    </p>
                  ) : (
                    <div className="divide-y">
                      {topProjects.map(({ project, metrics }) => (
                        <Link
                          key={project.id}
                          href={`/projects/${project.id}`}
                          className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                            style={{ backgroundColor: project.colorTag + "20" }}
                          >
                            {project.iconEmoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {project.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(metrics.totalInvestment, project.currency)} invested
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={cn(
                                "text-sm font-semibold",
                                metrics.netProfitLoss >= 0
                                  ? "text-green-600"
                                  : "text-red-500"
                              )}
                            >
                              {metrics.netProfitLoss >= 0 ? "+" : ""}
                              {formatCurrency(metrics.netProfitLoss, project.currency)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {metrics.totalInvestment > 0
                                ? `${metrics.recoveryPercent.toFixed(0)}% recovered`
                                : "No data"}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Best / worst */}
            <div className="space-y-4">
              {companyMetrics.bestProject && (
                <Card className="border-green-200 bg-green-50/40">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                        Best Project
                      </span>
                    </div>
                    <p className="font-semibold text-sm">
                      {companyMetrics.bestProject.name}
                    </p>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      {companyMetrics.bestProject.netProfitLoss >= 0 ? "+" : ""}
                      {formatCurrency(
                        companyMetrics.bestProject.netProfitLoss,
                        workspace?.defaultCurrency ?? "USD"
                      )}
                    </p>
                  </CardContent>
                </Card>
              )}
              {companyMetrics.worstProject && (
                <Card className="border-red-200 bg-red-50/40">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                        Needs Attention
                      </span>
                    </div>
                    <p className="font-semibold text-sm">
                      {companyMetrics.worstProject.name}
                    </p>
                    <p className="text-lg font-bold text-red-500 mt-1">
                      {companyMetrics.worstProject.netProfitLoss >= 0 ? "+" : ""}
                      {formatCurrency(
                        companyMetrics.worstProject.netProfitLoss,
                        workspace?.defaultCurrency ?? "USD"
                      )}
                    </p>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Portfolio Recovery
                    </span>
                  </div>
                  <p className="text-2xl font-bold">
                    {companyMetrics.totalInvestment > 0
                      ? `${companyMetrics.recoveryPercent.toFixed(1)}%`
                      : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all active projects
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  );
}
