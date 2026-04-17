"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowLeftRight, Download } from "lucide-react";

import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { usePermissions } from "@/hooks/usePermissions";
import { exportTransactionsToExcel } from "@/lib/export";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Transaction } from "@/types";

export default function TransactionsPage() {
  const { workspace } = useAuthStore();
  const { can } = usePermissions();
  const { projects } = useProjects(workspace?.id ?? null);
  const { investments, loading: invLoading } = useInvestments(workspace?.id ?? null);
  const { revenues, loading: revLoading } = useRevenues(workspace?.id ?? null);

  const [filterProject, setFilterProject] = useState("all");
  const [filterType, setFilterType] = useState<"all" | "investment" | "revenue">("all");
  const loading = invLoading || revLoading;

  const getProjectName = (id: string) =>
    projects.find((p) => p.id === id)?.name ?? id;

  const allTransactions = useMemo((): Transaction[] => {
    const invT: Transaction[] = investments.map((i) => ({
      id: i.id,
      type: "investment",
      projectId: i.projectId,
      projectName: getProjectName(i.projectId),
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
    }));
    const revT: Transaction[] = revenues.map((r) => ({
      id: r.id,
      type: "revenue",
      projectId: r.projectId,
      projectName: getProjectName(r.projectId),
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
    }));
    return [...invT, ...revT].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investments, revenues]);

  const filtered = useMemo(() => {
    return allTransactions.filter((t) => {
      if (filterProject !== "all" && t.projectId !== filterProject) return false;
      if (filterType !== "all" && t.type !== filterType) return false;
      return true;
    });
  }, [allTransactions, filterProject, filterType]);

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm">{formatDate(row.original.date)}</span>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge
          variant={row.original.type === "investment" ? "destructive" : "success"}
          className="text-xs capitalize"
        >
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "projectName",
      header: "Project",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.projectName}</span>
      ),
    },
    {
      accessorKey: "categoryOrSource",
      header: "Category / Source",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.categoryOrSource}
        </span>
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
        <span
          className={`text-sm font-semibold ${
            row.original.type === "investment"
              ? "text-red-500"
              : "text-green-600"
          }`}
        >
          {row.original.type === "investment" ? "-" : "+"}
          {formatCurrency(row.original.amount, row.original.currency)}
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
  ];

  if (loading) return <PageLoader />;

  const activeProjects = projects.filter((p) => p.status === "active");

  return (
    <>
      <PageHeader
        title="Transactions"
        description={`${filtered.length} transaction${filtered.length !== 1 ? "s" : ""}`}
        icon={ArrowLeftRight}
        actions={
          can("export.data") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportTransactionsToExcel(filtered)}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          )
        }
      />

      <div className="flex gap-3 mb-4 flex-wrap">
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-48">
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
        <Select
          value={filterType}
          onValueChange={(v) =>
            setFilterType(v as "all" | "investment" | "revenue")
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="investment">Investment</SelectItem>
            <SelectItem value="revenue">Revenue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {allTransactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions yet"
          description="Add investments or revenue to your projects to see transactions here."
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          searchPlaceholder="Search transactions…"
        />
      )}
    </>
  );
}
