"use client";

import { useState, useMemo } from "react";
import Icon from "@/components/ui/Icon";

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

const SEVERITY_STYLES: Record<string, { bg: string; border: string; text: string; badge: string; icon: string }> = {
  critical: {
    bg: "bg-red-500/8",
    border: "border-red-500/20",
    text: "text-red-300",
    badge: "bg-red-500/20 text-red-400",
    icon: "text-red-400",
  },
  warning: {
    bg: "bg-yellow-500/8",
    border: "border-yellow-500/20",
    text: "text-yellow-300",
    badge: "bg-yellow-500/20 text-yellow-400",
    icon: "text-yellow-400",
  },
  info: {
    bg: "bg-cyan/8",
    border: "border-cyan/20",
    text: "text-cyan",
    badge: "bg-cyan/20 text-cyan",
    icon: "text-cyan",
  },
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
  const [expanded, setExpanded] = useState(false);

  const sortedAlerts = useMemo(
    () =>
      [...alerts]
        .filter((a) => !dismissedIds.has(a.id))
        .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3)),
    [alerts, dismissedIds]
  );

  if (sortedAlerts.length === 0) return null;

  const displayed = expanded ? sortedAlerts : [sortedAlerts[0]];

  return (
    <div className="space-y-2">
      {displayed.map((alert) => {
        const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
        return (
          <div
            key={alert.id}
            className={`rounded-xl border ${style.bg} ${style.border} px-4 py-3`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <Icon name="alert" size={16} className={style.icon} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${style.badge}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className={`text-[13px] font-semibold ${style.text} leading-tight`}>{alert.title}</p>
                {expanded && alert.body && (
                  <p className="text-[11px] text-white/40 mt-1 leading-relaxed">{alert.body}</p>
                )}
              </div>
              <button
                onClick={() => setDismissedIds((prev) => new Set([...prev, alert.id]))}
                className="shrink-0 w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.1] transition-colors"
                aria-label="Dismiss alert"
              >
                <Icon name="close" size={12} className="text-white/40" />
              </button>
            </div>
          </div>
        );
      })}

      {sortedAlerts.length > 1 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-center text-[11px] text-white/30 font-medium py-1 press"
        >
          {expanded ? "Show less" : `+${sortedAlerts.length - 1} more alert${sortedAlerts.length - 1 > 1 ? "s" : ""}`}
        </button>
      )}
    </div>
  );
}
