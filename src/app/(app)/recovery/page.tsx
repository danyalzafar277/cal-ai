"use client";

import { useMemo } from "react";
import { PieChart } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { KPICard } from "@/components/shared/KPICard";
import { RecoveryChart } from "@/components/charts/RecoveryChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { useAuthStore } from "@/store";
import { useProjects } from "@/hooks/useProjects";
import { useInvestments } from "@/hooks/useInvestments";
import { useRevenues } from "@/hooks/useRevenues";
import { calculateProjectMetrics } from "@/lib/metrics";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function RecoveryPage() {
  const { workspace } = useAuthStore();
  const { projects, loading: projLoading } = useProjects(workspace?.id ?? null);
  const { investments, loading: invLoading } = useInvestments(workspace?.id ?? null);
  const { revenues, loading: revLoading } = useRevenues(workspace?.id ?? null);
  const loading = projLoading || invLoading || revLoading;

  const activeProjects = projects.filter((p) => p.status === "active");

  const projectData = useMemo(() => {
    return activeProjects.map((p) => {
      const inv = investments.filter((i) => i.projectId === p.id);
      const rev = revenues.filter((r) => r.projectId === p.id);
      const m = calculateProjectMetrics(inv, rev);
      return { project: p, metrics: m };
    }).sort((a, b) => b.metrics.recoveryPercent - a.metrics.recoveryPercent);
  }, [activeProjects, investments, revenues]);

  // Company-wide totals
  const totalInvestment = projectData.reduce(
    (s, d) => s + d.metrics.totalInvestment, 0
  );
  const totalRevenue = projectData.reduce(
    (s, d) => s + d.metrics.totalRevenue, 0
  );
  const companyMetrics = calculateProjectMetrics(
    investments.filter((i) =>
      activeProjects.some((p) => p.id === i.projectId)
    ),
    revenues.filter((r) =>
      activeProjects.some((p) => p.id === r.projectId)
    )
  );

  if (loading) return <PageLoader />;

  const currency = workspace?.defaultCurrency ?? "USD";

  return (
    <>
      <PageHeader
        title="Recovery Analysis"
        description="Track investment recovery across all projects"
        icon={PieChart}
      />

      {activeProjects.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="No active projects"
          description="Create projects and add financial data to see recovery analysis."
        />
      ) : (
        <>
          {/* Company-wide recovery */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Total invested"
              value={formatCurrency(companyMetrics.totalInvestment, currency)}
            />
            <KPICard
              title="Total recovered"
              value={formatCurrency(companyMetrics.totalRevenue, currency)}
              accent
            />
            <KPICard
              title="Recovery rate"
              value={
                companyMetrics.totalInvestment > 0
                  ? formatPercent(companyMetrics.recoveryPercent)
                  : "—"
              }
            />
            <KPICard
              title="Remaining"
              value={formatCurrency(companyMetrics.remainingToRecover, currency)}
            />
          </div>

          {/* Per-project recovery */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Per-Project Recovery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {projectData.map(({ project, metrics }) => {
                const pct = Math.min(metrics.recoveryPercent, 100);
                const colorClass =
                  metrics.recoveryPercent >= 100
                    ? "text-green-600"
                    : metrics.recoveryPercent >= 50
                    ? "text-amber-600"
                    : "text-red-500";

                return (
                  <div key={project.id}>
                    <div className="flex items-center justify-between mb-2">
                      <Link
                        href={`/projects/${project.id}`}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <span className="text-base">{project.iconEmoji}</span>
                        <span className="text-sm font-medium">{project.name}</span>
                      </Link>
                      <div className="text-right">
                        <span className={cn("text-sm font-bold", colorClass)}>
                          {metrics.totalInvestment > 0
                            ? formatPercent(metrics.recoveryPercent)
                            : "—"}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatCurrency(metrics.totalRevenue, project.currency)} /{" "}
                          {formatCurrency(metrics.totalInvestment, project.currency)}
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={pct}
                      className={cn(
                        "h-2",
                        metrics.recoveryPercent >= 100 && "[&>div]:bg-green-600",
                        metrics.recoveryPercent >= 50 &&
                          metrics.recoveryPercent < 100 &&
                          "[&>div]:bg-amber-500",
                        metrics.recoveryPercent < 50 && "[&>div]:bg-red-400"
                      )}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(metrics.remainingToRecover, project.currency)} remaining
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ROI: {metrics.totalInvestment > 0 ? formatPercent(metrics.roiPercent) : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
