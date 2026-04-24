import { ReactNode } from "react";

interface CultureMastheadProps {
  /** Volume label — e.g. "VOL.4" */
  vol?: string;
  /** Issue label — e.g. "ISS.14" */
  iss?: string;
  /** Short date stamp — e.g. "APR 23" */
  date?: string;
  /** Wordmark displayed as the hero title. Defaults to "CULTURE." */
  wordmark?: string;
  /** Optional right-aligned action buttons (search, bell, etc). */
  actions?: ReactNode;
}

/**
 * CultureMasthead — the newspaper-style header that anchors every editorial
 * screen (Home, Culture, Food, Tickets, Messages, etc.). It's a tight
 * two-line block: kicker meta above, stamped Anton wordmark below, with a
 * thick 3px printed rule underneath.
 *
 * Design spec: culture-core.jsx · Masthead
 */
export default function CultureMasthead({
  vol = "VOL.4",
  iss,
  date,
  wordmark = "CULTURE.",
  actions,
}: CultureMastheadProps) {
  const kickerParts = [vol, iss, date].filter(Boolean).join(" · ");

  return (
    <div
      className="flex items-end justify-between px-[18px] pt-[6px] pb-3"
      style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
    >
      <div className="min-w-0">
        {kickerParts && (
          <div className="c-kicker" style={{ opacity: 0.65 }}>
            {kickerParts}
          </div>
        )}
        <div
          className="c-hero mt-1"
          style={{ fontSize: 44, lineHeight: 0.85, letterSpacing: "-0.02em" }}
        >
          {wordmark}
        </div>
      </div>
      {actions && (
        <div className="flex gap-2 pb-1 shrink-0 items-center">{actions}</div>
      )}
    </div>
  );
}
