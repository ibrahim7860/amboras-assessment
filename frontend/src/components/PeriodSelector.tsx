"use client";

export type Period = "today" | "week" | "month" | "custom";

export interface DateRange {
  startDate: string;
  endDate: string;
}

const PERIODS: readonly { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "custom", label: "Custom" },
];

interface PeriodSelectorProps {
  period: Period;
  onChange: (period: Period) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
}

export function PeriodSelector({
  period,
  onChange,
  dateRange,
  onDateRangeChange,
}: PeriodSelectorProps) {
  const showDateInputs = period === "custom" && dateRange && onDateRangeChange;

  return (
    <div className="flex flex-wrap items-center gap-2">
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
      {showDateInputs && (
        <>
          <div className="hidden h-5 w-px bg-border sm:block" />
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateRange.startDate}
              max={dateRange.endDate}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, startDate: e.target.value })
              }
              className="h-[30px] rounded-md border border-border bg-surface-muted px-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
              –
            </span>
            <input
              type="date"
              value={dateRange.endDate}
              min={dateRange.startDate}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, endDate: e.target.value })
              }
              className="h-[30px] rounded-md border border-border bg-surface-muted px-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </>
      )}
    </div>
  );
}
