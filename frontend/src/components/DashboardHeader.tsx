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
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
      <h1 className="text-lg font-semibold text-gray-900">{storeName}</h1>
      <div className="flex items-center gap-3">
        <PeriodSelector period={period} onChange={onPeriodChange} />
        <button
          onClick={onLogout}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
