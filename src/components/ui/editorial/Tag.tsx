import clsx from "clsx";

type Tone = "default" | "gold" | "coral" | "emerald" | "cyan" | "ghost";

const toneClass: Record<Tone, string> = {
  default:
    "bg-black/40 border border-white/10 text-white/80",
  gold: "bg-gold/10 border border-gold/30 text-gold",
  coral: "bg-coral/10 border border-coral/30 text-coral",
  emerald: "bg-emerald/10 border border-emerald/30 text-emerald",
  cyan: "bg-cyan/10 border border-cyan/30 text-cyan",
  ghost: "bg-transparent border border-white/10 text-white/60",
};

/**
 * Tiny uppercase letter-spaced chip — used for profile tags, category
 * filters, meta-badges on heroes. Replaces the dozen inline `text-[9px]`
 * pill implementations scattered across the app.
 */
export default function Tag({
  children,
  tone = "default",
  size = "sm",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  size?: "xs" | "sm";
  className?: string;
}) {
  const sizeClass =
    size === "xs"
      ? "text-[9px] px-1.5 py-[3px] tracking-[0.12em]"
      : "text-[10px] px-2.5 py-1 tracking-[0.14em]";
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full font-semibold uppercase backdrop-blur-sm leading-none",
        sizeClass,
        toneClass[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
