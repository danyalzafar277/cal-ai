"use client";

import { useState } from "react";
import { BarChart3, Download, FileSpreadsheet } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuthStore } from "@/store";
import { useProjects } from "@/hooks/useProjects";
import { useInvestments } from "@/hooks/useInvestments";
import { useRevenues } from "@/hooks/useRevenues";
import {
  exportProjectReport,
  exportInvestmentsToExcel,
  exportRevenuesToExcel,
  exportTransactionsToExcel,
} from "@/lib/export";
import { formatCurrency } from "@/lib/format";
import { calculateProjectMetrics } from "@/lib/metrics";
import type { Transaction } from "@/types";

export default function ReportsPage() {
  const { workspace } = useAuthStore();
  const { projects, loading: projLoading } = useProjects(workspace?.id ?? null);
  const { investments } = useInvestments(workspace?.id ?? null);
  const { revenues } = useRevenues(workspace?.id ?? null);

  const [selectedProject, setSelectedProject] = useState<string>("");
  const loading = projLoading;

  const activeProjects = projects.filter((p) => p.status === "active");
  const selectedProj = activeProjects.find((p) => p.id === selectedProject);

  function handleProjectReport() {
    if (!selectedProj) return;
    const inv = investments.filter((i) => i.projectId === selectedProj.id);
    const rev = revenues.filter((r) => r.projectId === selectedProj.id);
    exportProjectReport(selectedProj, inv, rev);
  }

  function handleAllInvestments() {
    exportInvestmentsToExcel(investments, "All Projects");
  }

  function handleAllRevenues() {
    exportRevenuesToExcel(revenues, "All Projects");
  }

  function handleAllTransactions() {
    const transactions: Transaction[] = [
      ...investments.map((i) => ({
        id: i.id,
        type: "investment" as const,
        projectId: i.projectId,
        projectName: projects.find((p) => p.id === i.projectId)?.name ?? "",
        platform: i.platform,
        categoryOrSource: i.category,
        amount: i.amount,
        currency: i.currency,
        date: i.date,
        paymentMethod: i.paymentMethod,
        note: i.note,
        status: i.status,
        createdBy: i.createdBy,
        createdAt: i.createdAt,
      })),
      ...revenues.map((r) => ({
        id: r.id,
        type: "revenue" as const,
        projectId: r.projectId,
        projectName: projects.find((p) => p.id === r.projectId)?.name ?? "",
        platform: r.platform,
        categoryOrSource: r.source,
        amount: r.amount,
        currency: r.currency,
        date: r.date,
        paymentMethod: r.paymentMethod,
        note: r.note,
        status: r.status,
        createdBy: r.createdBy,
        createdAt: r.createdAt,
      })),
    ];
    exportTransactionsToExcel(transactions, "all_transactions");
  }

  if (loading) return <PageLoader />;

  const totalInvestment = investments.reduce((s, i) => s + i.amount, 0);
  const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Export financial data across your projects"
        icon={BarChart3}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Project-specific report */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              Project Report
            </CardTitle>
            <CardDescription>
              Full financial report for a single project including summary, investments, and revenue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {activeProjects.map((p) => {
                  const m = calculateProjectMetrics(
                    investments.filter((i) => i.projectId === p.id),
                    revenues.filter((r) => r.projectId === p.id)
                  );
                  return (
                    <SelectItem key={p.id} value={p.id}>
                      {p.iconEmoji} {p.name} · {formatCurrency(m.totalInvestment, p.currency)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              disabled={!selectedProject}
              onClick={handleProjectReport}
            >
              <Download className="w-4 h-4" />
              Export project report (.xlsx)
            </Button>
          </CardContent>
        </Card>

        {/* Portfolio report */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              Portfolio Report
            </CardTitle>
            <CardDescription>
              All transactions across all projects — investments: {investments.length}, revenues: {revenues.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground space-y-1 mb-4">
              <p>Total invested: {formatCurrency(totalInvestment, workspace?.defaultCurrency ?? "USD")}</p>
              <p>Total revenue: {formatCurrency(totalRevenue, workspace?.defaultCurrency ?? "USD")}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={handleAllTransactions}>
              <Download className="w-4 h-4" />
              All transactions (.xlsx)
            </Button>
            <Button variant="outline" className="w-full" onClick={handleAllInvestments}>
              <Download className="w-4 h-4" />
              All investments (.xlsx)
            </Button>
            <Button variant="outline" className="w-full" onClick={handleAllRevenues}>
              <Download className="w-4 h-4" />
              All revenue (.xlsx)
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
