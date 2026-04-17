"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { RecoveryChart } from "@/components/charts/RecoveryChart";
import { KPICard } from "@/components/shared/KPICard";
import { useAuthStore } from "@/store";
import { useProject } from "@/hooks/useProjects";
import { useInvestments } from "@/hooks/useInvestments";
import { useRevenues } from "@/hooks/useRevenues";
import { useProjectMetrics } from "@/hooks/useMetrics";
import { formatCurrency, formatPercent } from "@/lib/format";

export default function ProjectRecoveryPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { workspace } = useAuthStore();
  const { project, loading: projLoading } = useProject(projectId);
  const { investments } = useInvestments(workspace?.id ?? null, projectId);
  const { revenues } = useRevenues(workspace?.id ?? null, projectId);
  const metrics = useProjectMetrics(investments, revenues);

  if (projLoading) return <PageLoader />;

  const currency = project?.currency ?? "USD";

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => router.push(`/projects/${projectId}`)}>
        <ArrowLeft className="w-4 h-4" /> Back to {project?.name}
      </Button>
      <PageHeader title="Recovery Analysis" icon={PieChart} description={`Financial recovery for ${project?.name}`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total invested" value={formatCurrency(metrics.totalInvestment, currency)} />
        <KPICard title="Total revenue" value={formatCurrency(metrics.totalRevenue, currency)} accent />
        <KPICard title="Recovery %" value={metrics.totalInvestment > 0 ? formatPercent(metrics.recoveryPercent) : "—"} />
        <KPICard title="ROI %" value={metrics.totalInvestment > 0 ? formatPercent(metrics.roiPercent) : "—"} />
      </div>

      <div className="max-w-md">
        <RecoveryChart metrics={metrics} currency={currency} />
      </div>
    </>
  );
}
