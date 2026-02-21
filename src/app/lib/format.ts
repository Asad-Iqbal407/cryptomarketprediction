﻿export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (Number.isNaN(numValue)) {
    return "-";
  }
  
  const maximumFractionDigits = numValue >= 1 ? 2 : 6;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(numValue);
}

export function formatCompact(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (Number.isNaN(numValue)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(numValue);
}

export function formatPercent(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (Number.isNaN(numValue)) {
    return "-";
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    signDisplay: "always",
  }).format(numValue)}%`;
}

export function formatUpdated(iso: string): string {
  const date = new Date(iso);
  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date)} UTC`;
}
