import clsx from "clsx";
import Link from "next/link";

type Variant = "stacked" | "split";

interface EditorialHeaderProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  variant?: Variant;
  seeAllHref?: string;
  seeAllLabel?: string;
  className?: string;
}

/**
 * Section header used across list pages. `split` renders kicker + title
 * on the left and a "see all →" link on the right with a gold rule
 * underneath; `stacked` keeps the original center/left kicker-over-title
 * shape for feature intros.
 */
export default function EditorialHeader({
  kicker,
  title,
  subtitle,
  align = "left",
  variant = "stacked",
  seeAllHref,
  seeAllLabel = "See all →",
  className,
}: EditorialHeaderProps) {
  if (variant === "split") {
    return (
      <div className={clsx("flex flex-col gap-2", className)}>
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col min-w-0">
            {kicker && (
              <span className="editorial-kicker mb-1.5 tracking-editorial">
                {kicker}
              </span>
            )}
            <h2 className="font-display text-[26px] text-white leading-none truncate">
              {title}
            </h2>
          </div>
          {seeAllHref && (
            <Link
              href={seeAllHref}
              className="text-[10px] font-bold tracking-editorial-tight uppercase text-gold press shrink-0"
            >
              {seeAllLabel}
            </Link>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-txt-secondary leading-relaxed max-w-xl">
            {subtitle}
          </p>
        )}
        <div className="mt-1 rule-hairline" />
      </div>
    );
  }

  return (
    <div className={clsx(align === "center" && "text-center", className)}>
      {kicker && (
        <div
          className={clsx(
            "flex items-center gap-2 mb-2",
            align === "center" && "justify-center"
          )}
        >
          <div className="w-[2px] h-4 bg-gold rounded-full" />
          <span className="editorial-kicker">{kicker}</span>
        </div>
      )}
      <h2 className="font-display text-3xl text-white leading-tight">{title}</h2>
      {subtitle && (
        <p className="text-sm text-txt-secondary mt-2 max-w-md leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
