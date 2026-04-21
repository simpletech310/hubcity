import Icon, { type IconName } from "@/components/ui/Icon";

type BadgeVariant =
  | "gold"
  | "emerald"
  | "coral"
  | "cyan"
  | "pink"
  | "purple"
  | "blue";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  iconName?: IconName;
  size?: "sm" | "md";
  shine?: boolean;
}

// Editorial palette: every variant now resolves to black-ink panel + gold or
// status accent. 'purple' and 'blue' are kept for back-compat but remap to
// the neutral ink-and-gold treatment so no call site shows legacy hc-purple.
const variantStyles: Record<BadgeVariant, string> = {
  gold: "bg-gold/10 text-gold border-gold/25",
  emerald: "bg-emerald/10 text-emerald border-emerald/25",
  coral: "bg-coral/10 text-coral border-coral/25",
  cyan: "bg-cyan/10 text-cyan border-cyan/25",
  pink: "bg-gold/10 text-gold border-gold/25",
  purple: "bg-white/[0.04] text-ivory/80 border-white/10",
  blue: "bg-white/[0.04] text-ivory/80 border-white/10",
};

export default function Badge({
  label,
  variant = "gold",
  icon,
  iconName,
  size = "sm",
  shine = false,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border font-semibold tracking-wide uppercase
        ${variantStyles[variant]}
        ${size === "sm" ? "px-2.5 py-0.5 text-[9px]" : "px-3 py-1 text-[10px]"}
        ${shine ? "badge-shine" : ""}
      `}
    >
      {iconName ? <Icon name={iconName} size={size === "sm" ? 10 : 12} /> : icon}
      {label}
    </span>
  );
}
