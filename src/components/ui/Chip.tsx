"use client";

interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  color?: string;
  icon?: React.ReactNode;
}

export default function Chip({
  label,
  active = false,
  onClick,
  color,
  icon,
}: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-semibold
        whitespace-nowrap transition-all duration-300 press shrink-0
        ${
          active
            ? "bg-gold text-midnight shadow-lg shadow-gold/20"
            : "bg-white/[0.06] text-txt-secondary hover:text-white hover:bg-white/[0.1] border border-border-subtle"
        }
      `}
      style={active && color ? { backgroundColor: color } : undefined}
    >
      {icon}
      {label}
    </button>
  );
}
