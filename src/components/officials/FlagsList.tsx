import type { OfficialFlag, FlagSeverity } from "@/types/database";

interface FlagsListProps {
  flags: OfficialFlag[];
}

const SEVERITY_ORDER: Record<FlagSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const SEVERITY_BORDER: Record<FlagSeverity, string> = {
  critical: "border-l-red-500",
  warning: "border-l-amber-500",
  info: "border-l-blue-500",
};

const SEVERITY_LABEL_STYLE: Record<FlagSeverity, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/20",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  info: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

export default function FlagsList({ flags }: FlagsListProps) {
  if (flags.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
        <p className="text-sm text-white/40">No flags on record.</p>
      </div>
    );
  }

  const sorted = [...flags].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );

  return (
    <div className="space-y-2">
      {sorted.map((flag) => (
        <div
          key={flag.id}
          className={`rounded-2xl border border-zinc-800 bg-zinc-900 border-l-[3px] overflow-hidden ${
            SEVERITY_BORDER[flag.severity]
          }`}
        >
          <div className="p-4">
            {/* Top row: badges */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {/* Flag type */}
              <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[9px] font-semibold text-white/50 uppercase tracking-wide">
                {flag.flag_type.replace(/_/g, " ")}
              </span>

              {/* Severity */}
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                  SEVERITY_LABEL_STYLE[flag.severity]
                }`}
              >
                {flag.severity}
              </span>

              {/* Resolved */}
              {flag.is_resolved && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400 uppercase tracking-wide">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Resolved
                </span>
              )}
            </div>

            {/* Title */}
            <h4 className="text-[14px] font-bold text-white leading-snug">
              {flag.title}
            </h4>

            {/* Description */}
            {flag.description && (
              <p className="mt-1.5 text-[12px] text-white/50 leading-relaxed">
                {flag.description}
              </p>
            )}

            {/* Date */}
            <p className="mt-2 text-[10px] text-white/25 tabular-nums">
              Flagged{" "}
              {new Date(flag.flagged_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
