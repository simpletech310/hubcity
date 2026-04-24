import Link from "next/link";
import type { FoodSpecial } from "@/types/database";

export default function SpecialCard({ special }: { special: FoodSpecial }) {
  const businessName =
    (special.business as unknown as { name: string })?.name ?? "Local Business";
  const businessSlug =
    (special.business as unknown as { slug: string })?.slug ?? "";

  const validUntil = new Date(special.valid_until)
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    .toUpperCase();

  return (
    <div
      className="shrink-0 w-[210px] p-3.5 press"
      style={{
        background: "var(--paper)",
        border: "2px solid var(--rule-strong-c)",
      }}
    >
      <p
        className="c-kicker truncate"
        style={{ fontSize: 9, letterSpacing: "0.14em", opacity: 0.6 }}
      >
        {businessName}
      </p>
      <h3
        className="c-card-t mt-1 line-clamp-2"
        style={{ fontSize: 14, color: "var(--ink-strong)", lineHeight: 1.2 }}
      >
        {special.title}
      </h3>
      <div className="flex items-baseline gap-2 mt-2">
        <span
          className="c-meta line-through"
          style={{ fontSize: 11, textTransform: "none", opacity: 0.55 }}
        >
          ${(special.original_price / 100).toFixed(2)}
        </span>
        <span
          className="c-hero"
          style={{ fontSize: 20, lineHeight: 1, color: "var(--ink-strong)" }}
        >
          ${(special.special_price / 100).toFixed(2)}
        </span>
      </div>
      <div
        className="flex items-center justify-between mt-3 pt-2"
        style={{ borderTop: "2px solid var(--rule-strong-c)" }}
      >
        <span className="c-kicker" style={{ fontSize: 9, opacity: 0.7 }}>
          UNTIL {validUntil}
        </span>
        {businessSlug && (
          <Link
            href={`/business/${businessSlug}`}
            className="c-kicker"
            style={{ fontSize: 9, color: "var(--gold-c)" }}
          >
            VIEW ↗
          </Link>
        )}
      </div>
    </div>
  );
}
