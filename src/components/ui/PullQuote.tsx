import clsx from "clsx";

interface PullQuoteProps {
  quote: string;
  attribution?: string;
  className?: string;
}

export default function PullQuote({ quote, attribution, className }: PullQuoteProps) {
  return (
    <blockquote
      className={clsx(
        "border-l-[3px] border-gold pl-5 py-2",
        className
      )}
    >
      <p className="font-display italic text-xl text-white/90 leading-relaxed">
        &ldquo;{quote}&rdquo;
      </p>
      {attribution && (
        <cite className="block mt-3 text-xs font-heading font-semibold text-gold uppercase tracking-wider not-italic">
          — {attribution}
        </cite>
      )}
    </blockquote>
  );
}
