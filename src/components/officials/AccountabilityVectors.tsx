"use client";

import { useState } from "react";
import type { AccountabilityVector } from "@/types/database";

interface AccountabilityVectorsProps {
  vectors: AccountabilityVector[];
  officialType: string;
}

export default function AccountabilityVectors({
  vectors,
  officialType,
}: AccountabilityVectorsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = vectors.filter((v) => v.applies_to.includes(officialType));

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
        <p className="text-sm text-white/40">
          No accountability vectors for this official type.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {filtered.map((vector) => {
        const isExpanded = expandedId === vector.id;

        return (
          <div
            key={vector.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden transition-colors hover:border-zinc-700"
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : vector.id)}
              className="w-full p-4 text-left"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <span className="text-base leading-none">
                    {vector.icon || "?"}
                  </span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-white leading-snug">
                    {vector.name}
                  </h4>
                  {vector.description && (
                    <p className="text-[11px] text-white/40 leading-relaxed mt-0.5 line-clamp-2">
                      {vector.description}
                    </p>
                  )}
                </div>

                {/* Expand indicator */}
                {vector.watch_for.length > 0 && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`shrink-0 text-white/20 transition-transform mt-1 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </div>
            </button>

            {/* Expanded: watch_for checklist */}
            {isExpanded && vector.watch_for.length > 0 && (
              <div className="px-4 pb-4 pt-0 border-t border-zinc-800/60">
                <div className="pt-3">
                  <span className="text-[10px] text-white/30 uppercase tracking-wide font-semibold block mb-2">
                    Watch For
                  </span>
                  <ul className="space-y-1.5">
                    {vector.watch_for.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-[12px] text-white/50 leading-relaxed"
                      >
                        <span className="w-4 h-4 rounded border border-zinc-700 bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                          <svg
                            width="8"
                            height="8"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-white/20"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
