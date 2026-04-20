import clsx from "clsx";

type Variant = "full" | "compact" | "stacked";

/**
 * Product wordmark — single source of truth for the "Culture" brand.
 * Used in Header, auth screens, 404, email footer.
 *
 *   <Wordmark variant="full" />     → Culture. (C. in gold, rest white)
 *   <Wordmark variant="compact" />  → C. (gold serif crest, for inner pages)
 *   <Wordmark variant="stacked" />  → Culture / Your city, curated.
 */
export default function Wordmark({
  variant = "full",
  size = 24,
  className,
  tone = "on-dark",
}: {
  variant?: Variant;
  size?: number;
  className?: string;
  tone?: "on-dark" | "on-light";
}) {
  const primaryColor = tone === "on-dark" ? "text-white" : "text-midnight";
  const accent = "text-gold";

  if (variant === "compact") {
    return (
      <span
        className={clsx(
          "inline-flex items-center justify-center leading-none select-none",
          "font-display",
          accent,
          className
        )}
        style={{ fontSize: size }}
        aria-label="Culture"
      >
        C<span className="opacity-90">.</span>
      </span>
    );
  }

  if (variant === "stacked") {
    return (
      <span
        className={clsx("inline-flex flex-col leading-[0.95] select-none", className)}
        aria-label="Culture"
      >
        <span className={clsx("font-display", primaryColor)} style={{ fontSize: size }}>
          <span className={accent}>C</span>ulture
          <span className={accent}>.</span>
        </span>
        <span className="mt-1 byline">Your city, curated</span>
      </span>
    );
  }

  return (
    <span
      className={clsx(
        "inline-flex items-baseline leading-none select-none font-display",
        primaryColor,
        className
      )}
      style={{ fontSize: size }}
      aria-label="Culture"
    >
      <span className={accent}>C</span>ulture<span className={accent}>.</span>
    </span>
  );
}
