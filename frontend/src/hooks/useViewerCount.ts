import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { API_URL, fetchWithAuth } from "@/lib/api";

export function useViewerCount() {
  const { token } = useAuth();
  const [viewerCount, setViewerCount] = useState<number>(1);

  useEffect(() => {
    if (!token) return;

    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const es = new EventSource(
      `${API_URL}/analytics/viewers/stream?token=${token}`
    );

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (typeof parsed.count === "number") {
          setViewerCount(parsed.count);
        }
      } catch {}
    };

    es.onerror = () => {
      es.close();

      const poll = async () => {
        try {
          const res = await fetchWithAuth("/analytics/viewers/count");
          const data = await res.json();
          if (typeof data.count === "number") {
            setViewerCount(data.count);
          }
        } catch {}
      };

      poll();
      pollInterval = setInterval(poll, 5000);
    };

    return () => {
      es.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [token]);

  return { viewerCount };
}
