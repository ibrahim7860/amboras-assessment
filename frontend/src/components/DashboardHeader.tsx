"use client";

import { PeriodSelector, type Period, type DateRange } from "./PeriodSelector";

interface DashboardHeaderProps {
  storeName: string;
  onLogout: () => void;
  period: Period;
  onPeriodChange: (period: Period) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function DashboardHeader({
  storeName,
  onLogout,
  period,
  onPeriodChange,
  dateRange,
  onDateRangeChange,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 px-6 py-4 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="shrink-0 text-base font-bold tracking-tight text-text-primary">
          {storeName}
        </h1>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <PeriodSelector
              period={period}
              onChange={onPeriodChange}
              dateRange={dateRange}
              onDateRangeChange={onDateRangeChange}
            />
          </div>
          <button
            onClick={onLogout}
            className="shrink-0 rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="mt-3 sm:hidden">
        <PeriodSelector
          period={period}
          onChange={onPeriodChange}
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
        />
      </div>
    </header>
  );
}
