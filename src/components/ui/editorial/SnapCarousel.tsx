import Link from "next/link";
import clsx from "clsx";
import SectionKicker from "./SectionKicker";
import EditorialNumber from "./EditorialNumber";

/**
 * Horizontal snap-scroll rail with an editorial header. Replaces the
 * half-dozen ad-hoc rails across the app (ReelsRail, ProfileEventsRow,
 * ProfileDealsRow, ProfileProductsRow, InlineEventsCard, InlineDealsCard,
 * SuggestedProfilesCard). One redesign cascades everywhere.
 */
export default function SnapCarousel({
  kicker,
  title,
  number,
  seeAllHref,
  seeAllLabel = "See all →",
  children,
  className,
  itemGap = "gap-3",
  pad = "px-5",
  rule = true,
  rail = true,
}: {
  kicker?: string;
  title?: string;
  number?: number;
  seeAllHref?: string;
  seeAllLabel?: string;
  children: React.ReactNode;
  className?: string;
  itemGap?: string;
  pad?: string;
  rule?: boolean;
  /** When false, skip the horizontal scroll wrapper and render children as-is
   *  (useful for reusing the numbered header on a grid-based sub-section). */
  rail?: boolean;
}) {
  const hasHeader = kicker || title || number !== undefined || seeAllHref;

  return (
    <section className={clsx("relative", className)}>
      {hasHeader && (
        <div className={clsx(pad, "mb-3 flex items-baseline justify-between gap-3")}>
          <div className="flex items-baseline gap-3 min-w-0">
            {number !== undefined && <EditorialNumber n={number} size="md" />}
            {kicker && <SectionKicker tone="muted">{kicker}</SectionKicker>}
            {title && (
              <h3 className="font-display text-[22px] text-white leading-none truncate">
                {title}
              </h3>
            )}
          </div>
          {seeAllHref && (
            <Link
              href={seeAllHref}
              className="text-[10px] font-bold tracking-editorial-tight uppercase text-gold press whitespace-nowrap"
            >
              {seeAllLabel}
            </Link>
          )}
        </div>
      )}

      {rule && hasHeader && (
        <div className={clsx(pad, "mb-4")}>
          <div className="rule-hairline" />
        </div>
      )}

      {rail ? (
        <div className="overflow-x-auto scrollbar-hide snap-x">
          <div className={clsx("flex pb-1", itemGap, pad)}>{children}</div>
        </div>
      ) : (
        children
      )}
    </section>
  );
}
