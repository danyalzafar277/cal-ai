"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildMonthlyChartData } from "@/lib/metrics";
import { formatCurrency } from "@/lib/format";
import type { Investment, Revenue } from "@/types";

interface InvestmentRevenueChartProps {
  investments: Investment[];
  revenues: Revenue[];
  currency?: string;
  months?: number;
}

export function InvestmentRevenueChart({
  investments,
  revenues,
  currency = "USD",
  months = 12,
}: InvestmentRevenueChartProps) {
  const data = buildMonthlyChartData(investments, revenues, months);
  const hasData = data.some((d) => d.investment > 0 || d.revenue > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Investment vs Revenue — Last {months} months
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 90%)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "hsl(240 4% 46%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(240 4% 46%)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatCurrency(v, currency).replace(/\.00$/, "")}
              />
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid hsl(240 6% 90%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value, currency),
                  name === "investment" ? "Investment" : "Revenue",
                ]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) =>
                  v === "investment" ? "Investment" : "Revenue"
                }
                wrapperStyle={{ fontSize: "12px" }}
              />
              <Bar
                dataKey="investment"
                fill="hsl(0 84% 60%)"
                radius={[3, 3, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="revenue"
                fill="hsl(142 72% 29%)"
                radius={[3, 3, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[240px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No chart data available yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
