import clsx from "clsx";
import EditorialNumber from "./EditorialNumber";
import SectionKicker from "./SectionKicker";

/**
 * Wrapper that frames a single "feature" — the numbered magazine-spread
 * treatment used on /creators. Gives any page the numbered header row
 * and a clean `<article>` element without each page re-implementing
 * the chrome.
 *
 * Compose as:
 *   <FeatureSpread index={1} total={9} kicker="Creator · Compton">
 *     <HeroBlock ... />
 *     <PullQuote ... />
 *     <SnapCarousel ... />
 *   </FeatureSpread>
 */
export default function FeatureSpread({
  index,
  total,
  kicker,
  first,
  className,
  children,
}: {
  index: number;
  total?: number;
  kicker?: string;
  first?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article
      className={clsx(
        "relative border-t border-white/[0.06]",
        first && "border-t-0",
        className
      )}
    >
      <div className="px-5 pt-8 pb-4 flex items-end justify-between">
        <div className="flex items-baseline gap-3 min-w-0">
          <EditorialNumber n={index} size="lg" />
          {kicker && (
            <SectionKicker tone="muted" className="truncate">
              {kicker}
            </SectionKicker>
          )}
        </div>
        {total !== undefined && (
          <div className="text-[10px] font-bold tracking-editorial uppercase text-white/25 tabular-nums">
            {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>
        )}
      </div>
      {children}
    </article>
  );
}
