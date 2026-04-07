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

const variantStyles: Record<BadgeVariant, string> = {
  gold: "bg-gold/15 text-gold-light border-gold/20",
  emerald: "bg-emerald/15 text-emerald border-emerald/20",
  coral: "bg-coral/15 text-coral border-coral/20",
  cyan: "bg-cyan/15 text-cyan border-cyan/20",
  pink: "bg-pink/15 text-pink border-pink/20",
  purple: "bg-hc-purple/15 text-hc-purple border-hc-purple/20",
  blue: "bg-hc-blue/15 text-hc-blue border-hc-blue/20",
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
