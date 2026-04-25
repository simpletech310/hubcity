import clsx from "clsx";

export default function SectionKicker({
  children,
  tone = "gold",
  className,
}: {
  children: React.ReactNode;
  tone?: "gold" | "muted";
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "text-[10px] font-bold uppercase tracking-editorial leading-none",
        tone === "gold" ? "text-gold" : "",
        className
      )}
      style={tone === "muted" ? { color: "var(--ink-strong)", opacity: 0.5 } : undefined}
    >
      {children}
    </span>
  );
}
