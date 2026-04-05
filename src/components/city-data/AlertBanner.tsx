"use client";

import { useState, useMemo } from "react";

interface CityAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  body: string;
  affected_districts: number[];
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300",
  warning: "bg-yellow-500/15 border-yellow-500/30 text-yellow-300",
  critical: "bg-red-500/15 border-red-500/30 text-red-300",
};

const SEVERITY_BADGE: Record<string, string> = {
  info: "bg-cyan-500/20 text-cyan-400",
  warning: "bg-yellow-500/20 text-yellow-400",
  critical: "bg-red-500/20 text-red-400",
};

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

interface AlertBannerProps {
  alerts: CityAlert[];
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const sortedAlerts = useMemo(
    () =>
      [...alerts]
        .filter((a) => !dismissedIds.has(a.id))
        .sort(
          (a, b) =>
            (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3)
        ),
    [alerts, dismissedIds]
  );

  if (sortedAlerts.length === 0) return null;

  const topAlert = sortedAlerts[0];
  const style = SEVERITY_STYLES[topAlert.severity] ?? SEVERITY_STYLES.info;
  const badgeStyle = SEVERITY_BADGE[topAlert.severity] ?? SEVERITY_BADGE.info;

  return (
    <div
      className={`animate-in slide-in-from-top flex items-center gap-3 rounded-xl border px-4 py-3 ${style}`}
    >
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyle}`}>
          {topAlert.severity.toUpperCase()}
        </span>
        <p className="truncate text-sm font-medium">{topAlert.title}</p>
        {sortedAlerts.length > 1 && (
          <span className="shrink-0 text-xs opacity-60">
            +{sortedAlerts.length - 1} more
          </span>
        )}
      </div>
      <button
        onClick={() => setDismissedIds((prev) => new Set([...prev, topAlert.id]))}
        className="shrink-0 rounded-lg p-1 hover:bg-white/10 transition-colors"
        aria-label="Dismiss alert"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
