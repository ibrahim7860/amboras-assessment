import useSWR from "swr";
import { swrFetcher } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { DateRange } from "@/components/PeriodSelector";

interface OverviewData {
  revenue: number;
  eventCounts: Record<string, number>;
  conversionRate: number;
}

export function useAnalytics(period: string, dateRange?: DateRange) {
  const { token } = useAuth();

  const key = token
    ? dateRange?.startDate && dateRange?.endDate
      ? `/analytics/overview?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      : `/analytics/overview?period=${period}`
    : null;

  const { data, error, isLoading } = useSWR<OverviewData>(key, swrFetcher, {
    refreshInterval: 30000,
  });

  return { overview: data, isLoading, error };
}
