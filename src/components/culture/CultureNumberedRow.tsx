import Link from "next/link";
import { ReactNode } from "react";

interface CultureNumberedRowProps {
  /** Number shown on the left (e.g. "01", "02", "03"). */
  n: string | number;
  /** Right-aligned image thumbnail URL. */
  img?: string | null;
  /** Alt text for the image. */
  imgAlt?: string;
  /** Small black badge to the left of the kicker. */
  tag?: string;
  /** Meta kicker above the title (e.g. "8PM · HUB RADIO"). */
  kicker?: string;
  /** Main row title — rendered in Archivo Narrow 800. */
  title: ReactNode;
  /** Optional meta line under the title (e.g. "142 going · Free RSVP"). */
  meta?: string;
  /** If provided, wraps the row in a Link. */
  href?: string;
  /** First row in a list: show a top rule. Default true. */
  topRule?: boolean;
}

/**
 * CultureNumberedRow — the big-numbered list pattern used in the "Tonight"
 * rail on Home, the "Top Posts" list on the Creator Dashboard, and the
 * Radio Stations list on Stream Hub.
 *
 * Layout: 40px Anton number · optional badge + kicker + title + meta · 80x96
 * framed thumbnail on the right. 2px top border separates each row.
 *
 * Design spec: culture-core.jsx · NumberedRow
 */
export default function CultureNumberedRow({
  n,
  img,
  imgAlt = "",
  tag,
  kicker,
  title,
  meta,
  href,
  topRule = true,
}: CultureNumberedRowProps) {
  const Wrapper = href ? Link : "div";
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      {...(wrapperProps as { href: string })}
      className="flex gap-3.5 py-4"
      style={{
        borderTop: topRule ? "2px solid var(--rule-strong-c)" : undefined,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        className="c-hero shrink-0"
        style={{ fontSize: 40, lineHeight: 0.9, width: 48 }}
      >
        {typeof n === "number" ? String(n).padStart(2, "0") : n}
      </div>
      <div className="flex-1 min-w-0">
        {(tag || kicker) && (
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {tag && <span className="c-badge c-badge-ink">{tag}</span>}
            {kicker && (
              <span className="c-kicker" style={{ fontSize: 9 }}>
                {kicker}
              </span>
            )}
          </div>
        )}
        <div
          className="c-card-t"
          style={{ fontSize: 18, textWrap: "balance" as const }}
        >
          {title}
        </div>
        {meta && (
          <div className="c-meta mt-1.5">
            {meta}
          </div>
        )}
      </div>
      {img && (
        <div
          className="shrink-0 c-frame"
          style={{ width: 80, height: 96 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={imgAlt}
            className="w-full h-full object-cover block"
          />
        </div>
      )}
    </Wrapper>
  );
}
