type CreatorTier = "starter" | "rising" | "partner" | "premium";

interface CreatorBadgeProps {
  tier?: CreatorTier;
  size?: "sm" | "md";
}

const tierConfig: Record<CreatorTier, { label: string; bg: string; text: string; border: string }> = {
  starter: {
    label: "Creator",
    bg: "bg-white/10",
    text: "text-white/70",
    border: "border-white/20",
  },
  rising: {
    label: "Rising Creator",
    bg: "bg-hc-blue/15",
    text: "text-hc-blue",
    border: "border-hc-blue/20",
  },
  partner: {
    label: "Partner",
    bg: "bg-hc-purple/15",
    text: "text-hc-purple",
    border: "border-hc-purple/20",
  },
  premium: {
    label: "Premium",
    bg: "bg-gold/15",
    text: "text-gold",
    border: "border-gold/20",
  },
};

export default function CreatorBadge({ tier = "starter", size = "sm" }: CreatorBadgeProps) {
  const config = tierConfig[tier];

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border font-semibold tracking-wide uppercase
        ${config.bg} ${config.text} ${config.border}
        ${size === "sm" ? "px-2 py-0.5 text-[8px]" : "px-2.5 py-0.5 text-[9px]"}
      `}
    >
      <svg
        width={size === "sm" ? 8 : 10}
        height={size === "sm" ? 8 : 10}
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        <path d="M8 1a1 1 0 0 1 .894.553L10.382 5h3.618a1 1 0 0 1 .707 1.707L11.414 10l1.293 3.293a1 1 0 0 1-1.414 1.414L8 12.414l-3.293 2.293a1 1 0 0 1-1.414-1.414L4.586 10 1.293 6.707A1 1 0 0 1 2 5h3.618l1.488-3.447A1 1 0 0 1 8 1z" />
      </svg>
      {config.label}
    </span>
  );
}
