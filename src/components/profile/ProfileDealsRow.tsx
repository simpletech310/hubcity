import Link from "next/link";
import Icon from "@/components/ui/Icon";

interface DealItem {
  id: string;
  kind: "promotion" | "coupon" | "special";
  title: string;
  description: string | null;
  /** Percent off (e.g. 20 for 20%). */
  discount_percent: number | null;
  /** Flat cents off (e.g. 500 for $5.00). */
  discount_amount_cents: number | null;
  /** Coupon / promo code, shown in a chip. */
  code: string | null;
  /** ISO date string — omitted if no expiry. */
  valid_until: string | null;
  /** Used to deep-link into the parent business. */
  business_slug: string | null;
  business_id: string;
}

interface ProfileDealsRowProps {
  deals: DealItem[];
}

function formatDeadline(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return null;
  if (diffDays === 0) return "Ends today";
  if (diffDays === 1) return "Ends tomorrow";
  if (diffDays < 7) return `${diffDays} days left`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ProfileDealsRow({ deals }: ProfileDealsRowProps) {
  if (deals.length === 0) return null;

  return (
    <div className="-mx-5 px-5 overflow-x-auto scrollbar-hide">
      <div className="flex gap-3 snap-x snap-mandatory pb-1">
        {deals.map((deal) => {
          const deadline = formatDeadline(deal.valid_until);
          const href = `/business/${deal.business_slug || deal.business_id}`;
          return (
            <Link
              key={`${deal.kind}-${deal.id}`}
              href={href}
              className="snap-start shrink-0 w-[230px] group press"
            >
              <div className="relative h-full rounded-xl overflow-hidden border border-emerald/25 bg-emerald/5 p-3.5 pl-4">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald" />
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon name="tag" size={14} className="text-emerald" />
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald">
                    {deal.kind === "special" ? "Special" : deal.kind === "coupon" ? "Coupon" : "Deal"}
                  </span>
                </div>
                <p className="text-[13px] font-bold text-white line-clamp-2">
                  {deal.title}
                </p>
                {deal.description && (
                  <p className="text-[11px] text-white/50 mt-0.5 line-clamp-2">
                    {deal.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {deal.discount_percent != null && (
                    <span className="text-[11px] font-bold text-emerald">
                      {deal.discount_percent}% OFF
                    </span>
                  )}
                  {deal.discount_amount_cents != null && (
                    <span className="text-[11px] font-bold text-emerald">
                      ${(deal.discount_amount_cents / 100).toFixed(2)} OFF
                    </span>
                  )}
                  {deal.code && (
                    <span className="text-[10px] font-bold bg-emerald/10 text-emerald px-2 py-0.5 rounded-full border border-emerald/20 font-mono">
                      {deal.code}
                    </span>
                  )}
                </div>
                {deadline && (
                  <p className="text-[10px] text-white/40 mt-2">{deadline}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
