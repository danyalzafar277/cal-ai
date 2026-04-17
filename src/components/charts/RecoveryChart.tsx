"use client";

import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { ProjectMetrics } from "@/types";
import { cn } from "@/lib/utils";

interface RecoveryChartProps {
  metrics: ProjectMetrics;
  currency?: string;
}

export function RecoveryChart({
  metrics,
  currency = "USD",
}: RecoveryChartProps) {
  const { totalInvestment, totalRevenue, recoveryPercent } = metrics;
  const capped = Math.min(recoveryPercent, 100);
  const remaining = Math.max(0, 100 - capped);

  const pieData = totalInvestment > 0
    ? [
        { name: "Recovered", value: capped, color: "hsl(142 72% 29%)" },
        { name: "Remaining", value: remaining, color: "hsl(240 6% 90%)" },
      ]
    : [{ name: "No data", value: 100, color: "hsl(240 6% 90%)" }];

  const colorClass =
    recoveryPercent >= 100
      ? "text-green-600"
      : recoveryPercent >= 50
      ? "text-amber-600"
      : "text-red-500";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Recovery Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Donut chart */}
          <div className="relative flex-shrink-0">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={60}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(1)}%`]}
                  contentStyle={{
                    fontSize: "11px",
                    borderRadius: "6px",
                    border: "1px solid hsl(240 6% 90%)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-xl font-bold", colorClass)}>
                {totalInvestment > 0
                  ? `${Math.min(recoveryPercent, 999).toFixed(0)}%`
                  : "—"}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Total invested
              </p>
              <p className="text-base font-bold">
                {formatCurrency(totalInvestment, currency)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Total recovered
              </p>
              <p className="text-base font-bold text-green-600">
                {formatCurrency(totalRevenue, currency)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Remaining
              </p>
              <p className="text-base font-bold text-red-500">
                {formatCurrency(metrics.remainingToRecover, currency)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
