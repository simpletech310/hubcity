import Link from "next/link";

interface DealItem {
  id: string;
  kind: "promotion" | "coupon" | "special";
  title: string;
  description: string | null;
  discount_percent: number | null;
  discount_amount_cents: number | null;
  code: string | null;
  valid_until: string | null;
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
  if (diffDays === 0) return "ENDS TODAY";
  if (diffDays === 1) return "ENDS TOMORROW";
  if (diffDays < 7) return `${diffDays} DAYS LEFT`;
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}

export default function ProfileDealsRow({ deals }: ProfileDealsRowProps) {
  if (deals.length === 0) return null;

  return (
    <div className="-mx-5 px-5 overflow-x-auto scrollbar-hide">
      <div className="flex gap-3 snap-x snap-mandatory pb-1">
        {deals.map((deal) => {
          const deadline = formatDeadline(deal.valid_until);
          const href = `/business/${deal.business_slug || deal.business_id}`;
          const kindLabel =
            deal.kind === "special"
              ? "SPECIAL"
              : deal.kind === "coupon"
                ? "COUPON"
                : "DEAL";
          return (
            <Link
              key={`${deal.kind}-${deal.id}`}
              href={href}
              className="snap-start shrink-0 w-[230px] group press block"
            >
              <div
                className="relative h-full p-4"
                style={{
                  border: "2px solid var(--rule-strong-c)",
                  background: "var(--paper)",
                }}
              >
                {/* Left ink block rule */}
                <div
                  className="absolute left-0 top-0 bottom-0"
                  style={{ width: 6, background: "var(--ink-strong)" }}
                />
                <div className="pl-2">
                  <span
                    className="c-kicker inline-block"
                    style={{
                      background: "var(--gold-c)",
                      color: "var(--ink-strong)",
                      padding: "2px 6px",
                    }}
                  >
                    § {kindLabel}
                  </span>
                  <p
                    className="c-card-t mt-2 line-clamp-2"
                    style={{ fontSize: 16 }}
                  >
                    {deal.title}
                  </p>
                  {deal.description && (
                    <p
                      className="c-body mt-1 line-clamp-2"
                      style={{ fontSize: 11, color: "var(--ink-mute)" }}
                    >
                      {deal.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {deal.discount_percent != null && (
                      <span
                        className="c-display"
                        style={{ fontSize: 20, color: "var(--ink-strong)" }}
                      >
                        {deal.discount_percent}% OFF
                      </span>
                    )}
                    {deal.discount_amount_cents != null && (
                      <span
                        className="c-display"
                        style={{ fontSize: 20, color: "var(--ink-strong)" }}
                      >
                        ${(deal.discount_amount_cents / 100).toFixed(2)} OFF
                      </span>
                    )}
                    {deal.code && (
                      <span
                        className="c-meta"
                        style={{
                          background: "var(--ink-strong)",
                          color: "var(--gold-c)",
                          padding: "2px 6px",
                          fontWeight: 700,
                        }}
                      >
                        {deal.code}
                      </span>
                    )}
                  </div>
                  {deadline && (
                    <p
                      className="c-kicker mt-2"
                      style={{ color: "var(--ink-mute)", fontSize: 9 }}
                    >
                      {deadline}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
