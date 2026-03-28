"use client";

export type Period = "today" | "week" | "month";

const PERIODS: readonly { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

interface PeriodSelectorProps {
  period: Period;
  onChange: (period: Period) => void;
}

export function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface-muted p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
            period === p.value
              ? "bg-surface-raised text-text-primary shadow-sm ring-1 ring-white/[0.06]"
              : "text-text-tertiary hover:text-text-secondary"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
