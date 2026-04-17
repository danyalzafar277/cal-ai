import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { CURRENCIES } from "@/types";

export function formatCurrency(
  amount: number,
  currencyCode: string = "USD"
): string {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  const symbol = currency?.symbol ?? currencyCode;

  if (Math.abs(amount) >= 1_000_000) {
    return `${symbol}${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${symbol}${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(
  date: string | Date | Timestamp | null | undefined,
  dateFormat = "MMM d, yyyy"
): string {
  if (!date) return "—";
  try {
    let d: Date;
    if (typeof date === "string") {
      d = parseISO(date);
    } else if (date instanceof Date) {
      d = date;
    } else {
      // Firestore Timestamp
      d = (date as Timestamp).toDate();
    }
    if (!isValid(d)) return "—";
    return format(d, dateFormat);
  } catch {
    return "—";
  }
}

export function formatRelative(
  date: string | Date | Timestamp | null | undefined
): string {
  if (!date) return "—";
  try {
    let d: Date;
    if (typeof date === "string") {
      d = parseISO(date);
    } else if (date instanceof Date) {
      d = date;
    } else {
      d = (date as Timestamp).toDate();
    }
    if (!isValid(d)) return "—";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "—";
  }
}

export function toDateInputValue(timestamp: Timestamp | null): string {
  if (!timestamp) return "";
  return format(timestamp.toDate(), "yyyy-MM-dd");
}
