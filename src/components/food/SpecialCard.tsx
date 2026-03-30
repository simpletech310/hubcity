import Link from "next/link";
import type { FoodSpecial } from "@/types/database";

export default function SpecialCard({ special }: { special: FoodSpecial }) {
  const businessName =
    (special.business as unknown as { name: string })?.name ?? "Local Business";
  const businessSlug =
    (special.business as unknown as { slug: string })?.slug ?? "";

  const validUntil = new Date(special.valid_until).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="shrink-0 w-[200px] bg-card rounded-2xl border border-border-subtle overflow-hidden p-3.5 hover:border-gold/20 transition-all press">
      <p className="text-[10px] text-txt-secondary font-medium mb-1 truncate">
        {businessName}
      </p>
      <h3 className="font-heading font-bold text-[13px] mb-2 line-clamp-2 leading-tight">
        {special.title}
      </h3>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-txt-secondary text-xs line-through">
          ${(special.original_price / 100).toFixed(2)}
        </span>
        <span className="font-heading font-bold text-gold text-base">
          ${(special.special_price / 100).toFixed(2)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-txt-secondary">
          Until {validUntil}
        </span>
        {businessSlug && (
          <Link
            href={`/business/${businessSlug}`}
            className="text-[10px] text-gold font-semibold"
          >
            View
          </Link>
        )}
      </div>
    </div>
  );
}
