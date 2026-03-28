"use client";

interface KpiCardProps {
  title: string;
  value: number;
  format: "currency" | "percentage" | "integer";
}

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
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">
        {formatValue(value, format)}
      </p>
    </div>
  );
}
