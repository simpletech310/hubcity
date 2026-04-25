"use client";

import Icon, { type IconName } from "@/components/ui/Icon";

interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  color?: string;
  icon?: React.ReactNode;
  iconName?: IconName;
}

export default function Chip({
  label,
  active = false,
  onClick,
  color,
  icon,
  iconName,
}: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-semibold
        whitespace-nowrap transition-all duration-300 press shrink-0
        ${
          active
            ? "glass-chip-active text-gold-light"
            : "glass-chip hover:bg-black/[0.08]"
        }
      `}
      style={active && color ? { backgroundColor: color } : (!active ? { color: "var(--ink-mute)" } : undefined)}
    >
      {iconName ? <Icon name={iconName} size={16} /> : icon}
      {label}
    </button>
  );
}
