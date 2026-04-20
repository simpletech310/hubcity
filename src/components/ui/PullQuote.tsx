import clsx from "clsx";

interface PullQuoteProps {
  quote: string;
  attribution?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClass: Record<NonNullable<PullQuoteProps["size"]>, string> = {
  sm: "text-[15px]",
  md: "text-[17px]",
  lg: "text-[22px]",
};

export default function PullQuote({
  quote,
  attribution,
  size = "md",
  className,
}: PullQuoteProps) {
  return (
    <blockquote
      className={clsx("flex gap-4", className)}
    >
      <div className="w-[2px] shrink-0 self-stretch bg-gold" aria-hidden />
      <div className="min-w-0">
        <p
          className={clsx(
            "font-display italic text-ivory/90 leading-snug",
            sizeClass[size]
          )}
        >
          &ldquo;{quote}&rdquo;
        </p>
        {attribution && (
          <cite className="block mt-3 text-[10px] font-bold text-gold uppercase tracking-editorial-tight not-italic">
            — {attribution}
          </cite>
        )}
      </div>
    </blockquote>
  );
}
