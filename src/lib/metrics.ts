import type { Investment, Revenue, ProjectMetrics, CompanyMetrics, Project } from "@/types";

export function calculateProjectMetrics(
  investments: Investment[],
  revenues: Revenue[]
): ProjectMetrics {
  const activeInvestments = investments.filter((i) => i.status === "active");
  const activeRevenues = revenues.filter((r) => r.status === "active");

  const totalInvestment = activeInvestments.reduce(
    (sum, i) => sum + i.amount,
    0
  );
  const totalRevenue = activeRevenues.reduce((sum, r) => sum + r.amount, 0);

  const netProfitLoss = totalRevenue - totalInvestment;
  const remainingToRecover = Math.max(0, totalInvestment - totalRevenue);

  const recoveryPercent =
    totalInvestment > 0 ? (totalRevenue / totalInvestment) * 100 : 0;

  const roiPercent =
    totalInvestment > 0
      ? ((totalRevenue - totalInvestment) / totalInvestment) * 100
      : 0;

  return {
    totalInvestment,
    totalRevenue,
    netProfitLoss,
    recoveryPercent,
    remainingToRecover,
    roiPercent,
    investmentCount: activeInvestments.length,
    revenueCount: activeRevenues.length,
  };
}

export function calculateCompanyMetrics(
  projects: Project[],
  allInvestments: Investment[],
  allRevenues: Revenue[]
): CompanyMetrics {
  const activeProjects = projects.filter((p) => p.status === "active");
  const archivedProjects = projects.filter((p) => p.status === "archived");

  let totalInvestment = 0;
  let totalRevenue = 0;
  let bestProject: { name: string; netProfitLoss: number } | null = null;
  let worstProject: { name: string; netProfitLoss: number } | null = null;

  for (const project of activeProjects) {
    const projectInvestments = allInvestments.filter(
      (i) => i.projectId === project.id && i.status === "active"
    );
    const projectRevenues = allRevenues.filter(
      (r) => r.projectId === project.id && r.status === "active"
    );

    const inv = projectInvestments.reduce((s, i) => s + i.amount, 0);
    const rev = projectRevenues.reduce((s, r) => s + r.amount, 0);
    const net = rev - inv;

    totalInvestment += inv;
    totalRevenue += rev;

    if (bestProject === null || net > bestProject.netProfitLoss) {
      bestProject = { name: project.name, netProfitLoss: net };
    }
    if (worstProject === null || net < worstProject.netProfitLoss) {
      worstProject = { name: project.name, netProfitLoss: net };
    }
  }

  const netProfitLoss = totalRevenue - totalInvestment;
  const recoveryPercent =
    totalInvestment > 0 ? (totalRevenue / totalInvestment) * 100 : 0;

  return {
    totalProjects: projects.length,
    activeProjects: activeProjects.length,
    archivedProjects: archivedProjects.length,
    totalInvestment,
    totalRevenue,
    netProfitLoss,
    recoveryPercent,
    bestProject: activeProjects.length > 0 ? bestProject : null,
    worstProject: activeProjects.length > 1 ? worstProject : null,
  };
}

export interface MonthlyDataPoint {
  month: string;
  investment: number;
  revenue: number;
  net: number;
}

export function buildMonthlyChartData(
  investments: Investment[],
  revenues: Revenue[],
  months = 12
): MonthlyDataPoint[] {
  const now = new Date();
  const result: MonthlyDataPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });

    const inv = investments
      .filter((item) => {
        if (item.status !== "active") return false;
        const itemDate = new Date(item.date);
        return (
          itemDate.getFullYear() === year && itemDate.getMonth() === month
        );
      })
      .reduce((s, item) => s + item.amount, 0);

    const rev = revenues
      .filter((item) => {
        if (item.status !== "active") return false;
        const itemDate = new Date(item.date);
        return (
          itemDate.getFullYear() === year && itemDate.getMonth() === month
        );
      })
      .reduce((s, item) => s + item.amount, 0);

    result.push({ month: label, investment: inv, revenue: rev, net: rev - inv });
  }

  return result;
}
