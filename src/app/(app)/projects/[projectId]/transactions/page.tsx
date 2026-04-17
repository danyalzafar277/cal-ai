"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProject } from "@/hooks/useProjects";

// The transactions page for a specific project reuses the global transactions page logic
// scoped to this project. We redirect to the global page with project filter applied.
// For simplicity, we import the full transactions view directly.

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store";
import { useInvestments } from "@/hooks/useInvestments";
import { useRevenues } from "@/hooks/useRevenues";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Transaction } from "@/types";

export default function ProjectTransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { workspace } = useAuthStore();
  const { project, loading: projLoading } = useProject(projectId);
  const { investments, loading: invLoading } = useInvestments(workspace?.id ?? null, projectId);
  const { revenues, loading: revLoading } = useRevenues(workspace?.id ?? null, projectId);

  const loading = projLoading || invLoading || revLoading;

  const transactions = useMemo((): Transaction[] => {
    const invT: Transaction[] = investments.map((i) => ({
      id: i.id, type: "investment" as const, projectId: i.projectId, projectName: project?.name ?? "",
      platform: i.platform, categoryOrSource: i.category, amount: i.amount, currency: i.currency,
      date: i.date, paymentMethod: i.paymentMethod, note: i.note, status: i.status,
      createdBy: i.createdBy, createdAt: i.createdAt,
    }));
    const revT: Transaction[] = revenues.map((r) => ({
      id: r.id, type: "revenue" as const, projectId: r.projectId, projectName: project?.name ?? "",
      platform: r.platform, categoryOrSource: r.source, amount: r.amount, currency: r.currency,
      date: r.date, paymentMethod: r.paymentMethod, note: r.note, status: r.status,
      createdBy: r.createdBy, createdAt: r.createdAt,
    }));
    return [...invT, ...revT].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investments, revenues]);

  const columns: ColumnDef<Transaction>[] = [
    { accessorKey: "date", header: "Date", cell: ({ row }) => <span className="text-sm">{formatDate(row.original.date)}</span> },
    { accessorKey: "type", header: "Type", cell: ({ row }) => (
      <Badge variant={row.original.type === "investment" ? "destructive" : "success"} className="text-xs capitalize">{row.original.type}</Badge>
    )},
    { accessorKey: "categoryOrSource", header: "Category / Source", cell: ({ row }) => <span className="text-sm">{row.original.categoryOrSource}</span> },
    { accessorKey: "platform", header: "Platform", cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.platform}</span> },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => (
      <span className={`text-sm font-semibold ${row.original.type === "investment" ? "text-red-500" : "text-green-600"}`}>
        {row.original.type === "investment" ? "-" : "+"}{formatCurrency(row.original.amount, row.original.currency)}
      </span>
    )},
    { accessorKey: "paymentMethod", header: "Method", cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.paymentMethod || "—"}</span> },
  ];

  if (loading) return <PageLoader />;

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => router.push(`/projects/${projectId}`)}>
        <ArrowLeft className="w-4 h-4" /> Back to {project?.name}
      </Button>
      <PageHeader
        title="Transactions"
        description={`${transactions.length} transaction${transactions.length !== 1 ? "s" : ""} for ${project?.name}`}
        icon={ArrowLeftRight}
      />
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">No transactions yet</p>
        </div>
      ) : (
        <DataTable columns={columns} data={transactions} searchPlaceholder="Search transactions…" />
      )}
    </>
  );
}
