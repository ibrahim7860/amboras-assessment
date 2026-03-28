"use client";

interface Activity {
  eventId: string;
  eventType: string;
  timestamp: string;
  data: Record<string, unknown>;
}

const BADGE_COLORS: Record<string, string> = {
  page_view: "bg-blue-100 text-blue-700",
  add_to_cart: "bg-amber-100 text-amber-700",
  purchase: "bg-green-100 text-green-700",
  signup: "bg-purple-100 text-purple-700",
};

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface RecentActivityFeedProps {
  activities: Activity[];
  liveEvents: Activity[];
}

export function RecentActivityFeed({
  activities,
  liveEvents,
}: RecentActivityFeedProps) {
  const seen = new Set<string>();
  const merged: Activity[] = [];
  for (const event of [...liveEvents, ...activities]) {
    if (!seen.has(event.eventId)) {
      seen.add(event.eventId);
      merged.push(event);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-sm font-medium text-gray-500">
        Recent Activity
      </h3>
      <div className="scrollbar-thin max-h-96 space-y-3 overflow-y-auto">
        {merged.map((event, i) => (
          <div
            key={event.eventId}
            className={`flex items-start gap-3 rounded-lg p-2 transition-all duration-300 ${
              i < liveEvents.length ? "bg-indigo-50/50" : ""
            }`}
          >
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                BADGE_COLORS[event.eventType] || "bg-gray-100 text-gray-700"
              }`}
            >
              {event.eventType.replace(/_/g, " ")}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-gray-700">
              {(event.data?.productName as string) ||
                (event.data?.page as string) ||
                event.eventType}
            </span>
            <span className="shrink-0 text-xs text-gray-400">
              {relativeTime(event.timestamp)}
            </span>
          </div>
        ))}
        {merged.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            No recent activity
          </p>
        )}
      </div>
    </div>
  );
}
