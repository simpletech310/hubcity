import clsx from "clsx";

/**
 * Full-width magazine rule — gold center cap with hairline wings. Used
 * between major sections on long list pages to give the feed a
 * "turn the page" rhythm.
 */
export default function IssueDivider({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex items-center gap-4 px-5 my-10 text-gold/70 select-none",
        className
      )}
      aria-hidden
    >
      <span className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/25 to-gold/40" />
      {label ? (
        <span className="font-display text-gold text-[15px] tracking-[0.32em] uppercase">
          {label}
        </span>
      ) : (
        <svg width="26" height="14" viewBox="0 0 26 14" className="text-gold/70">
          <path d="M0 7 H9 M26 7 H17 M13 2 L16 7 L13 12 L10 7 Z" fill="currentColor" stroke="currentColor" strokeWidth="0.6" />
        </svg>
      )}
      <span className="flex-1 h-px bg-gradient-to-l from-transparent via-gold/25 to-gold/40" />
    </div>
  );
}
