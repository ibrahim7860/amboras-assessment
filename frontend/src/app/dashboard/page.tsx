"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useTopProducts } from "@/hooks/useTopProducts";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { useEventSource } from "@/hooks/useEventSource";
import { DashboardHeader } from "@/components/DashboardHeader";
import { KpiCard } from "@/components/KpiCard";
import { RevenueChart } from "@/components/RevenueChart";
import { TopProductsTable } from "@/components/TopProductsTable";
import { RecentActivityFeed } from "@/components/RecentActivityFeed";
import type { Period } from "@/components/PeriodSelector";

export default function DashboardPage() {
  const { token, store, logout, isLoading } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("today");

  const { overview, isLoading: overviewLoading } = useAnalytics(period);
  const { products, isLoading: productsLoading } = useTopProducts(period);
  const { activities, isLoading: activitiesLoading } = useRecentActivity();
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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        storeName={store?.name || "Dashboard"}
        onLogout={logout}
        period={period}
        onPeriodChange={setPeriod}
      />

      <main className="mx-auto max-w-7xl space-y-6 p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {overviewLoading || !overview ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl border border-gray-200 bg-white"
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
          {productsLoading || !products ? (
            <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white" />
          ) : (
            <TopProductsTable products={products} />
          )}

          {activitiesLoading || !activities ? (
            <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white" />
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
