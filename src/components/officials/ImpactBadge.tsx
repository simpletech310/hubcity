// ─── Impact Level Badge ────────────────────────────────
// Reusable badge for HIGH / MEDIUM / LOW impact levels

const IMPACT_STYLES: Record<string, string> = {
  high: "bg-red-500/15 text-red-400 border-red-500/20",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  low: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

interface ImpactBadgeProps {
  level: "low" | "medium" | "high";
}

export default function ImpactBadge({ level }: ImpactBadgeProps) {
  const style = IMPACT_STYLES[level] || IMPACT_STYLES.low;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${style}`}
    >
      {level}
    </span>
  );
}
