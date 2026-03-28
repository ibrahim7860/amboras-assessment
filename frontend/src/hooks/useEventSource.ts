import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { API_URL } from "@/lib/api";

interface LiveEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export function useEventSource() {
  const { token } = useAuth();
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    if (!token) return;

    const es = new EventSource(
      `${API_URL}/analytics/events/stream?token=${token}`
    );

    es.onmessage = (event) => {
      try {
        const parsed: LiveEvent = JSON.parse(event.data);
        setLiveEvents((prev) => [parsed, ...prev].slice(0, 50));
      } catch {}
    };

    return () => {
      es.close();
    };
  }, [token]);

  return { liveEvents };
}
