"use client";

import { useState } from "react";
import type { ManagerAction } from "@/types/database";
import ImpactBadge from "@/components/officials/ImpactBadge";

interface ActionTimelineProps {
  actions: ManagerAction[];
}

const ACTION_TYPE_STYLES: Record<string, { color: string; label: string }> = {
  policy_implementation: { color: "bg-blue-500/15 text-blue-400 border-blue-500/20", label: "Policy" },
  corrective_action: { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", label: "Corrective" },
  hiring_appointment: { color: "bg-purple-500/15 text-purple-400 border-purple-500/20", label: "Hiring" },
  agenda_control: { color: "bg-amber-500/15 text-amber-400 border-amber-500/20", label: "Agenda" },
  financial_disclosure: { color: "bg-pink-500/15 text-pink-400 border-pink-500/20", label: "Financial" },
  records_transparency: { color: "bg-orange-500/15 text-orange-400 border-orange-500/20", label: "Records" },
  audit_oversight: { color: "bg-red-500/15 text-red-400 border-red-500/20", label: "Audit" },
};

const ACTION_TYPE_DOT: Record<string, string> = {
  policy_implementation: "bg-blue-400",
  corrective_action: "bg-emerald-400",
  hiring_appointment: "bg-purple-400",
  agenda_control: "bg-amber-400",
  financial_disclosure: "bg-pink-400",
  records_transparency: "bg-orange-400",
  audit_oversight: "bg-red-400",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ActionTimeline({ actions }: ActionTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (actions.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
        <p className="text-sm text-white/40">No actions on record.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      {/* Vertical timeline line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-zinc-800 rounded-full" />

      <div className="space-y-3">
        {actions.map((action) => {
          const isExpanded = expandedId === action.id;
          const typeConfig =
            ACTION_TYPE_STYLES[action.action_type] ||
            { color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20", label: action.action_type.replace(/_/g, " ") };
          const dotColor = ACTION_TYPE_DOT[action.action_type] || "bg-zinc-500";

          return (
            <div key={action.id} className="relative">
              {/* Timeline dot */}
              <div
                className={`absolute -left-6 top-4 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 ${dotColor} z-10`}
              />

              {/* Action card */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden transition-colors hover:border-zinc-700">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : action.id)}
                  className="w-full p-4 text-left"
                >
                  {/* Date */}
                  <span className="text-[11px] text-white/30 tabular-nums">
                    {formatDate(action.action_date)}
                  </span>

                  {/* Title */}
                  <h4 className="text-[13px] font-semibold text-white leading-snug mt-1">
                    {action.title}
                  </h4>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${typeConfig.color}`}
                    >
                      {typeConfig.label}
                    </span>
                    <ImpactBadge level={action.impact_level} />
                    {action.category && (
                      <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[9px] font-semibold text-white/40 uppercase tracking-wide">
                        {action.category.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-zinc-800/60">
                    <div className="pt-3 space-y-3">
                      {action.description && (
                        <div>
                          <span className="text-[11px] text-white/30 uppercase tracking-wide font-semibold block mb-1">
                            Description
                          </span>
                          <p className="text-[12px] text-white/60 leading-relaxed">
                            {action.description}
                          </p>
                        </div>
                      )}

                      {action.outcome && (
                        <div>
                          <span className="text-[11px] text-white/30 uppercase tracking-wide font-semibold block mb-1">
                            Outcome
                          </span>
                          <p className="text-[12px] text-white/60 leading-relaxed">
                            {action.outcome}
                          </p>
                        </div>
                      )}

                      {action.accountability_notes && (
                        <div>
                          <span className="text-[11px] text-white/30 uppercase tracking-wide font-semibold block mb-1">
                            Accountability Notes
                          </span>
                          <p className="text-[12px] text-white/50 italic leading-relaxed">
                            {action.accountability_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
