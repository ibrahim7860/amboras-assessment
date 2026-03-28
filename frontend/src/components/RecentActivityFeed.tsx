"use client";

interface Activity {
  eventId: string;
  eventType: string;
  timestamp: string;
  data: Record<string, unknown>;
}

const BADGE_COLORS: Record<string, string> = {
  page_view: "bg-blue-500/10 text-blue-400",
  add_to_cart: "bg-amber-500/10 text-amber-400",
  purchase: "bg-emerald-500/10 text-emerald-400",
  signup: "bg-violet-500/10 text-violet-400",
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
    <div className="card-elevated p-0">
      <div className="flex items-center gap-2 px-6 pt-6 pb-4">
        <h3 className="text-sm font-semibold text-text-primary">
          Recent Activity
        </h3>
        {liveEvents.length > 0 && (
          <span className="flex items-center gap-1.5 rounded-md bg-green-500/10 px-2 py-0.5 text-[11px] font-semibold text-green-400">
            <span className="live-dot" />
            Live
          </span>
        )}
      </div>
      <div className="scrollbar-thin max-h-96 overflow-y-auto pb-2">
        {merged.map((event, i) => {
          const isLive = i < liveEvents.length;
          return (
            <div
              key={event.eventId}
              className={`flex items-start gap-3 px-6 py-3 transition-all duration-300 ${
                i < merged.length - 1 ? "border-b border-border-subtle" : ""
              } ${
                isLive
                  ? "border-l-2 border-l-green-400 bg-green-400/[0.04]"
                  : "hover:bg-white/[0.02]"
              }`}
            >
              <span
                className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                  BADGE_COLORS[event.eventType] || "bg-white/5 text-text-secondary"
                }`}
              >
                {event.eventType.replace(/_/g, " ")}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-text-secondary">
                {(event.data?.productName as string) ||
                  (event.data?.page as string) ||
                  event.eventType}
              </span>
              <span className="shrink-0 font-mono text-[11px] text-text-tertiary">
                {relativeTime(event.timestamp)}
              </span>
            </div>
          );
        })}
        {merged.length === 0 && (
          <p className="py-8 text-center text-sm text-text-tertiary">
            No recent activity
          </p>
        )}
      </div>
    </div>
  );
}
