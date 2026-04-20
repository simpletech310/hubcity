import clsx from "clsx";
import SectionKicker from "./SectionKicker";

/**
 * Full-bleed page masthead — the magazine cover treatment used at the
 * top of every list page. Mirror of newspaper front page: volume line,
 * headline, strap, gold rule.
 *
 * Example:
 *   <Masthead
 *     volume="VOL · 01"
 *     issue="ISSUE 23"
 *     headline="THIS WEEK"
 *     strap="In Compton, CA"
 *   />
 */
export default function Masthead({
  volume,
  issue,
  headline,
  strap,
  rightSlot,
  className,
}: {
  volume?: string;
  issue?: string;
  headline: string;
  strap?: string;
  rightSlot?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={clsx(
        "relative px-5 pt-6 pb-5 border-b border-white/[0.08]",
        className
      )}
    >
      {/* Volume strip */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3 text-[10px] tracking-editorial-tight uppercase text-white/40 tabular-nums">
          {volume && <span>{volume}</span>}
          {volume && issue && (
            <span className="inline-block w-1 h-1 rounded-full bg-gold/60" />
          )}
          {issue && <span>{issue}</span>}
        </div>
        {rightSlot && <div>{rightSlot}</div>}
      </div>

      {/* Headline */}
      <h1 className="masthead text-white text-[44px] sm:text-[56px]">
        {headline}
      </h1>

      {/* Strap + gold rule */}
      {strap && (
        <div className="mt-4 flex items-center gap-3">
          <span className="block h-[2px] w-8 bg-gold" />
          <SectionKicker tone="muted">{strap}</SectionKicker>
        </div>
      )}
    </header>
  );
}
