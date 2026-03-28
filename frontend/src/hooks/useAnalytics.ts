import useSWR from "swr";
import { swrFetcher } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface OverviewData {
  revenue: number;
  eventCounts: Record<string, number>;
  conversionRate: number;
}

export function useAnalytics(period: string) {
  const { token } = useAuth();

  const { data, error, isLoading } = useSWR<OverviewData>(
    token ? `/analytics/overview?period=${period}` : null,
    swrFetcher,
    { refreshInterval: 30000 }
  );

  return { overview: data, isLoading, error };
}
