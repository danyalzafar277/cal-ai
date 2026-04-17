"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { useProject } from "@/hooks/useProjects";
import { useAuthStore } from "@/store";
import { useInvestments } from "@/hooks/useInvestments";
import { useRevenues } from "@/hooks/useRevenues";
import { exportProjectReport } from "@/lib/export";
import { formatCurrency, formatPercent } from "@/lib/format";
import { calculateProjectMetrics } from "@/lib/metrics";

export default function ProjectReportsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { workspace } = useAuthStore();
  const { project, loading } = useProject(projectId);
  const { investments } = useInvestments(workspace?.id ?? null, projectId);
  const { revenues } = useRevenues(workspace?.id ?? null, projectId);

  if (loading) return <PageLoader />;
  if (!project) return null;

  const metrics = calculateProjectMetrics(investments, revenues);
  const currency = project.currency;

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => router.push(`/projects/${projectId}`)}>
        <ArrowLeft className="w-4 h-4" /> Back to {project.name}
      </Button>
      <PageHeader title="Reports" icon={BarChart3} description={`Export financial data for ${project.name}`} />

      <div className="max-w-lg space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total invested</span><span className="font-semibold">{formatCurrency(metrics.totalInvestment, currency)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total revenue</span><span className="font-semibold text-green-600">{formatCurrency(metrics.totalRevenue, currency)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Net P&L</span><span className={`font-semibold ${metrics.netProfitLoss >= 0 ? "text-green-600" : "text-red-500"}`}>{metrics.netProfitLoss >= 0 ? "+" : ""}{formatCurrency(metrics.netProfitLoss, currency)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Recovery</span><span className="font-semibold">{metrics.totalInvestment > 0 ? formatPercent(metrics.recoveryPercent) : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">ROI</span><span className="font-semibold">{metrics.totalInvestment > 0 ? formatPercent(metrics.roiPercent) : "—"}</span></div>
          </CardContent>
        </Card>

        <Button
          className="w-full"
          onClick={() => exportProjectReport(project, investments, revenues)}
        >
          <Download className="w-4 h-4" />
          Export full report (.xlsx)
        </Button>
      </div>
    </>
  );
}
