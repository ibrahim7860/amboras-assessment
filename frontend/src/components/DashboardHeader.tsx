"use client";

import { PeriodSelector, type Period } from "./PeriodSelector";

interface DashboardHeaderProps {
  storeName: string;
  onLogout: () => void;
  period: Period;
  onPeriodChange: (period: Period) => void;
}

export function DashboardHeader({
  storeName,
  onLogout,
  period,
  onPeriodChange,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-background/70 px-6 py-4 backdrop-blur-xl">
      <h1 className="text-base font-bold tracking-tight text-text-primary">
        {storeName}
      </h1>
      <div className="flex items-center gap-3">
        <PeriodSelector period={period} onChange={onPeriodChange} />
        <button
          onClick={onLogout}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-text-tertiary transition-colors hover:bg-surface-muted hover:text-text-secondary"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
