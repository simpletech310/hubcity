interface CultureMarqueeProps {
  items: string[];
  /** Inverted color scheme: gold background + ink text. Default ink bg + paper text. */
  inverted?: boolean;
  /** Speed override in seconds (default 36s). */
  duration?: number;
}

/**
 * CultureMarquee — looping ticker strip. Used to surface tonight's events,
 * new drops, and breaking neighborhood dispatches just below the masthead.
 *
 * Implementation: the array is duplicated 3x so the CSS keyframe (defined
 * in globals as .c-ticker-track) can translate -33.333% and loop seamlessly.
 *
 * Design spec: culture-core.jsx · Marquee
 */
export default function CultureMarquee({
  items,
  inverted = false,
  duration = 36,
}: CultureMarqueeProps) {
  if (items.length === 0) return null;
  const loop = [...items, ...items, ...items];

  const wrapStyle = inverted
    ? { background: "var(--gold-c)", color: "var(--ink-strong)" }
    : { background: "var(--rule-strong-c)", color: "var(--paper)" };

  const starColor = inverted ? "var(--ink-strong)" : "var(--gold-c)";

  return (
    <div
      style={{
        ...wrapStyle,
        padding: "10px 0",
        overflow: "hidden",
        borderTop: "2px solid var(--rule-strong-c)",
        borderBottom: "2px solid var(--rule-strong-c)",
      }}
    >
      <div
        className="c-ticker-track"
        style={{
          fontFamily: "var(--font-anton), Anton, sans-serif",
          fontSize: 14,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          animationDuration: `${duration}s`,
        }}
      >
        {loop.map((t, i) => (
          <span
            key={`${t}-${i}`}
            style={{
              padding: "0 18px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span style={{ color: starColor }}>✱</span>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
