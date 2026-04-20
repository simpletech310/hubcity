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
        tone === "gold" ? "text-gold" : "text-white/50",
        className
      )}
    >
      {children}
    </span>
  );
}
