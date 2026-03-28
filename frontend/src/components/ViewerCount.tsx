"use client";

import { useViewerCount } from "@/hooks/useViewerCount";

export function ViewerCount() {
  const { viewerCount } = useViewerCount();

  const label =
    viewerCount === 1 ? "1 viewer online" : `${viewerCount} viewers online`;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
      <span className="live-dot" />
      <span className="text-xs font-medium text-text-secondary">{label}</span>
    </div>
  );
}
