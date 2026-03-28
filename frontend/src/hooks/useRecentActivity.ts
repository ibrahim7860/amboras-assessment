import useSWR from "swr";
import { swrFetcher } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface Activity {
  eventId: string;
  eventType: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export function useRecentActivity() {
  const { token } = useAuth();

  const { data, error, isLoading } = useSWR<Activity[]>(
    token ? "/analytics/recent-activity?limit=20" : null,
    swrFetcher,
    { refreshInterval: 10000 }
  );

  return { activities: data, isLoading, error };
}
