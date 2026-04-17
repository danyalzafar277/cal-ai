"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
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

interface MonthlyTrendChartProps {
  investments: Investment[];
  revenues: Revenue[];
  currency?: string;
}

export function MonthlyTrendChart({
  investments,
  revenues,
  currency = "USD",
}: MonthlyTrendChartProps) {
  const data = buildMonthlyChartData(investments, revenues, 12);
  const hasData = data.some((d) => d.investment > 0 || d.revenue > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Net P&L Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
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
                tickFormatter={(v) =>
                  formatCurrency(v, currency).replace(/\.00$/, "")
                }
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
                  name === "net" ? "Net P&L" : name,
                ]}
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="hsl(142 72% 29%)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name="net"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No chart data available yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
