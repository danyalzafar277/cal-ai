"use client";

import Link from "next/link";
import { Archive, MoreHorizontal, Copy, Trash2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/format";
import { calculateProjectMetrics } from "@/lib/metrics";
import type { Project, Investment, Revenue } from "@/types";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  investments: Investment[];
  revenues: Revenue[];
  onArchive?: (project: Project) => void;
  onRestore?: (project: Project) => void;
  onDuplicate?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  canEdit?: boolean;
  canArchive?: boolean;
  canDelete?: boolean;
  canDuplicate?: boolean;
}

export function ProjectCard({
  project,
  investments,
  revenues,
  onArchive,
  onRestore,
  onDuplicate,
  onDelete,
  canEdit,
  canArchive,
  canDelete,
  canDuplicate,
}: ProjectCardProps) {
  const metrics = calculateProjectMetrics(investments, revenues);
  const isArchived = project.status === "archived";

  const recoveryColor =
    metrics.recoveryPercent >= 100
      ? "text-green-600"
      : metrics.recoveryPercent >= 50
      ? "text-amber-600"
      : "text-red-500";

  return (
    <div
      className={cn(
        "bg-card border rounded-xl overflow-hidden transition-shadow hover:shadow-md",
        isArchived && "opacity-60"
      )}
    >
      {/* Color accent bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: project.colorTag }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: project.colorTag + "20" }}
            >
              {project.iconEmoji}
            </div>
            <div className="min-w-0">
              <Link href={`/projects/${project.id}`}>
                <h3 className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate">
                  {project.name}
                </h3>
              </Link>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className="text-[10px] py-0 h-4 px-1.5">
                  {project.type}
                </Badge>
                {isArchived && (
                  <Badge variant="secondary" className="text-[10px] py-0 h-4 px-1.5">
                    Archived
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {canEdit && (
                <DropdownMenuItem asChild>
                  <Link href={`/projects/${project.id}`}>Open project</Link>
                </DropdownMenuItem>
              )}
              {canDuplicate && onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(project)}>
                  <Copy className="w-4 h-4" />
                  Duplicate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canArchive && !isArchived && onArchive && (
                <DropdownMenuItem onClick={() => onArchive(project)}>
                  <Archive className="w-4 h-4" />
                  Archive
                </DropdownMenuItem>
              )}
              {canArchive && isArchived && onRestore && (
                <DropdownMenuItem onClick={() => onRestore(project)}>
                  <RotateCcw className="w-4 h-4" />
                  Restore
                </DropdownMenuItem>
              )}
              {canDelete && onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(project)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Invested
            </p>
            <p className="text-sm font-semibold">
              {formatCurrency(metrics.totalInvestment, project.currency)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Revenue
            </p>
            <p className="text-sm font-semibold text-green-600">
              {formatCurrency(metrics.totalRevenue, project.currency)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Net P&L
            </p>
            <p
              className={cn(
                "text-sm font-semibold",
                metrics.netProfitLoss >= 0 ? "text-green-600" : "text-red-500"
              )}
            >
              {metrics.netProfitLoss >= 0 ? "+" : ""}
              {formatCurrency(metrics.netProfitLoss, project.currency)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Recovery
            </p>
            <p className={cn("text-sm font-semibold", recoveryColor)}>
              {metrics.totalInvestment > 0
                ? `${metrics.recoveryPercent.toFixed(1)}%`
                : "—"}
            </p>
          </div>
        </div>

        {/* Platforms */}
        {project.platforms.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {project.platforms.slice(0, 3).map((p) => (
              <span
                key={p}
                className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground"
              >
                {p}
              </span>
            ))}
            {project.platforms.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{project.platforms.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
