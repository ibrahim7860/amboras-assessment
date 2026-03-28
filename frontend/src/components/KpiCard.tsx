"use client";

interface KpiCardProps {
  title: string;
  value: number;
  format: "currency" | "percentage" | "integer";
}

const ACCENT_MAP: Record<string, { bar: string; bg: string }> = {
  Revenue: { bar: "bg-kpi-revenue", bg: "bg-kpi-revenue-bg" },
  "Page Views": { bar: "bg-kpi-views", bg: "bg-kpi-views-bg" },
  Purchases: { bar: "bg-kpi-purchases", bg: "bg-kpi-purchases-bg" },
  "Conversion Rate": { bar: "bg-kpi-conversion", bg: "bg-kpi-conversion-bg" },
};

function formatValue(value: number, format: KpiCardProps["format"]): string {
  switch (format) {
    case "currency":
      return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case "percentage":
      return `${value.toFixed(1)}%`;
    case "integer":
      return value.toLocaleString("en-US");
  }
}

export function KpiCard({ title, value, format }: KpiCardProps) {
  const accent = ACCENT_MAP[title] || { bar: "bg-primary", bg: "" };

  return (
    <div className="card-surface group relative overflow-hidden p-6 transition-shadow">
      <div className={`absolute inset-x-0 top-0 h-0.5 ${accent.bar}`} />
      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
        {title}
      </p>
      <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-text-primary">
        {formatValue(value, format)}
      </p>
    </div>
  );
}
