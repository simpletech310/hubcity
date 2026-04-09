import Image from "next/image";

interface RollCallEntry {
  official_name: string;
  position: string;
  notes?: string | null;
  photo_url?: string | null;
}

interface RollCallDisplayProps {
  rolls: RollCallEntry[];
}

const POSITION_DOT: Record<string, string> = {
  aye: "bg-emerald-400",
  nay: "bg-red-400",
  abstain: "bg-amber-400",
  absent: "bg-zinc-500",
  na: "bg-zinc-500",
  placed_on_ballot: "bg-blue-400",
};

const POSITION_LABELS: Record<string, string> = {
  aye: "AYE",
  nay: "NAY",
  abstain: "ABSTAIN",
  absent: "ABSENT",
  na: "N/A",
  placed_on_ballot: "BALLOT",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function RollCallDisplay({ rolls }: RollCallDisplayProps) {
  if (rolls.length === 0) {
    return (
      <p className="text-sm text-white/40 py-2">No roll call data available.</p>
    );
  }

  return (
    <div className="space-y-1">
      {rolls.map((roll, i) => {
        const key = roll.position.toLowerCase().replace(/\s+/g, "_");
        const dotColor = POSITION_DOT[key] || POSITION_DOT.na;
        const label = POSITION_LABELS[key] || roll.position.toUpperCase();

        return (
          <div
            key={`${roll.official_name}-${i}`}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-white/[0.03] transition-colors"
          >
            {/* Position dot */}
            <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />

            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 ring-1 ring-white/[0.06] flex items-center justify-center overflow-hidden shrink-0">
              {roll.photo_url ? (
                <Image
                  src={roll.photo_url}
                  alt={roll.official_name}
                  width={28}
                  height={28}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[9px] font-bold text-gold/70 font-heading">
                  {getInitials(roll.official_name)}
                </span>
              )}
            </div>

            {/* Name + position */}
            <div className="flex-1 min-w-0">
              <span className="text-[12px] font-medium text-white/80 truncate block">
                {roll.official_name}
              </span>
              {roll.notes && (
                <span className="text-[10px] text-white/30 italic truncate block">
                  {roll.notes}
                </span>
              )}
            </div>

            {/* Position label */}
            <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide shrink-0">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
