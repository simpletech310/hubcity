// ─── Vote Position Badge ───────────────────────────────
// Colored badge for vote positions (AYE, NAY, ABSTAIN, etc.)

const POSITION_STYLES: Record<string, string> = {
  aye: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  nay: "bg-red-500/15 text-red-400 border-red-500/20",
  abstain: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  absent: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  na: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  placed_on_ballot: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

const POSITION_LABELS: Record<string, string> = {
  aye: "AYE",
  nay: "NAY",
  abstain: "ABSTAIN",
  absent: "ABSENT",
  na: "N/A",
  placed_on_ballot: "PLACED ON BALLOT",
};

interface PositionBadgeProps {
  position: string;
}

export default function PositionBadge({ position }: PositionBadgeProps) {
  const key = position.toLowerCase().replace(/\s+/g, "_");
  const style = POSITION_STYLES[key] || POSITION_STYLES.na;
  const label = POSITION_LABELS[key] || position.toUpperCase();

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${style}`}
    >
      {label}
    </span>
  );
}
