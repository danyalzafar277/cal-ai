import * as XLSX from "xlsx";
import type { Investment, Revenue, Project, Transaction } from "@/types";
import { formatDate, formatCurrency } from "./format";

function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportInvestmentsToExcel(
  investments: Investment[],
  projectName = "All Projects"
) {
  const rows = investments.map((i) => ({
    Date: formatDate(i.date),
    Platform: i.platform,
    Category: i.category,
    Amount: i.amount,
    Currency: i.currency,
    "Payment Method": i.paymentMethod,
    Note: i.note,
    Status: i.status,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Investments");
  downloadWorkbook(wb, `investments_${projectName}_${Date.now()}.xlsx`);
}

export function exportRevenuesToExcel(
  revenues: Revenue[],
  projectName = "All Projects"
) {
  const rows = revenues.map((r) => ({
    Date: formatDate(r.date),
    Source: r.source,
    Platform: r.platform,
    Amount: r.amount,
    Currency: r.currency,
    "Payment Method": r.paymentMethod,
    Reference: r.reference,
    Note: r.note,
    Status: r.status,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Revenues");
  downloadWorkbook(wb, `revenues_${projectName}_${Date.now()}.xlsx`);
}

export function exportTransactionsToExcel(
  transactions: Transaction[],
  filename = "transactions"
) {
  const rows = transactions.map((t) => ({
    Type: t.type === "investment" ? "Investment" : "Revenue",
    Date: formatDate(t.date),
    Project: t.projectName,
    Platform: t.platform,
    "Category / Source": t.categoryOrSource,
    Amount: t.amount,
    Currency: t.currency,
    "Payment Method": t.paymentMethod,
    Note: t.note,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transactions");
  downloadWorkbook(wb, `${filename}_${Date.now()}.xlsx`);
}

export function exportProjectReport(
  project: Project,
  investments: Investment[],
  revenues: Revenue[]
) {
  const wb = XLSX.utils.book_new();

  const totalInv = investments
    .filter((i) => i.status === "active")
    .reduce((s, i) => s + i.amount, 0);
  const totalRev = revenues
    .filter((r) => r.status === "active")
    .reduce((s, r) => s + r.amount, 0);

  const summaryRows = [
    { Metric: "Project Name", Value: project.name },
    { Metric: "Type", Value: project.type },
    { Metric: "Currency", Value: project.currency },
    { Metric: "Status", Value: project.status },
    { Metric: "Total Investment", Value: formatCurrency(totalInv, project.currency) },
    { Metric: "Total Revenue", Value: formatCurrency(totalRev, project.currency) },
    { Metric: "Net Profit/Loss", Value: formatCurrency(totalRev - totalInv, project.currency) },
    {
      Metric: "Recovery %",
      Value: totalInv > 0 ? `${((totalRev / totalInv) * 100).toFixed(1)}%` : "0%",
    },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  const invRows = investments.map((i) => ({
    Date: formatDate(i.date),
    Platform: i.platform,
    Category: i.category,
    Amount: i.amount,
    "Payment Method": i.paymentMethod,
    Note: i.note,
  }));
  const wsInv = XLSX.utils.json_to_sheet(invRows);
  XLSX.utils.book_append_sheet(wb, wsInv, "Investments");

  const revRows = revenues.map((r) => ({
    Date: formatDate(r.date),
    Source: r.source,
    Platform: r.platform,
    Amount: r.amount,
    "Payment Method": r.paymentMethod,
    Reference: r.reference,
    Note: r.note,
  }));
  const wsRev = XLSX.utils.json_to_sheet(revRows);
  XLSX.utils.book_append_sheet(wb, wsRev, "Revenue");

  downloadWorkbook(wb, `report_${project.name}_${Date.now()}.xlsx`);
}
