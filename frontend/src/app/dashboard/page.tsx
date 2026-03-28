"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useTopProducts } from "@/hooks/useTopProducts";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { useEventSource } from "@/hooks/useEventSource";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ViewerCount } from "@/components/ViewerCount";
import { KpiCard } from "@/components/KpiCard";
import { RevenueChart } from "@/components/RevenueChart";
import { TopProductsTable } from "@/components/TopProductsTable";
import { RecentActivityFeed } from "@/components/RecentActivityFeed";
import type { Period, DateRange } from "@/components/PeriodSelector";

function getDefaultDateRange(): DateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export default function DashboardPage() {
  const { token, store, logout, isLoading } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("today");
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);

  const { overview, isLoading: overviewLoading, error: overviewError } = useAnalytics(
    period,
    period === "custom" ? dateRange : undefined,
  );
  const { products, isLoading: productsLoading, error: productsError } = useTopProducts(
    period === "custom" ? "month" : period,
  );
  const { activities, isLoading: activitiesLoading, error: activitiesError } = useRecentActivity();
  const { liveEvents } = useEventSource();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/login");
    }
  }, [isLoading, token, router]);

  if (!isLoading && !token) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm font-medium text-text-tertiary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        storeName={store?.name || "Dashboard"}
        onLogout={logout}
        period={period}
        onPeriodChange={setPeriod}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="flex justify-end">
          <ViewerCount />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {overviewError ? (
            <div className="col-span-full rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
              Failed to load metrics. Try refreshing the page.
            </div>
          ) : overviewLoading || !overview ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-shimmer h-[104px] rounded-xl border border-border"
              />
            ))
          ) : (
            <>
              <KpiCard
                title="Revenue"
                value={overview.revenue}
                format="currency"
              />
              <KpiCard
                title="Page Views"
                value={overview.eventCounts?.page_views ?? 0}
                format="integer"
              />
              <KpiCard
                title="Purchases"
                value={overview.eventCounts?.purchases ?? 0}
                format="integer"
              />
              <KpiCard
                title="Conversion Rate"
                value={overview.conversionRate}
                format="percentage"
              />
            </>
          )}
        </div>

        {/* Chart */}
        {overview?.eventCounts && (
          <RevenueChart eventCounts={overview.eventCounts} />
        )}

        {/* Bottom grid: Products + Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {productsError ? (
            <div className="rounded-[14px] border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
              Failed to load products. Try refreshing the page.
            </div>
          ) : productsLoading || !products ? (
            <div className="skeleton-shimmer h-64 rounded-[14px] border border-border" />
          ) : (
            <TopProductsTable products={products} />
          )}

          {activitiesError ? (
            <div className="rounded-[14px] border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
              Failed to load activity. Try refreshing the page.
            </div>
          ) : activitiesLoading || !activities ? (
            <div className="skeleton-shimmer h-64 rounded-[14px] border border-border" />
          ) : (
            <RecentActivityFeed
              activities={activities}
              liveEvents={liveEvents}
            />
          )}
        </div>
      </main>
    </div>
  );
}
