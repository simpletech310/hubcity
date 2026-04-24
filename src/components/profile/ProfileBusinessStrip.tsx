import Link from "next/link";
import Icon from "@/components/ui/Icon";

interface BusinessSummary {
  id: string;
  slug: string | null;
  name: string;
  category: string | null;
  description: string | null;
  image_urls: string[] | null;
  rating_avg: number | null;
  rating_count: number | null;
  is_verified?: boolean | null;
  account_type: string | null;
}

interface ProfileBusinessStripProps {
  business: BusinessSummary;
}

/**
 * Culture blockprint business strip: 72×72 framed thumb, kicker "§ BUSINESS",
 * Anton name, meta row (category · rating · ad), ink-block primary CTA.
 */
export default function ProfileBusinessStrip({ business }: ProfileBusinessStripProps) {
  const href = `/business/${business.slug || business.id}`;
  const cover = business.image_urls?.[0] ?? null;
  const isAd = business.account_type === "ads_only";

  return (
    <div
      className="mb-4 flex items-stretch gap-3 p-3"
      style={{
        border: "2px solid var(--rule-strong-c)",
        background: "var(--paper)",
      }}
    >
      <div
        className="c-frame-strong shrink-0 overflow-hidden"
        style={{ width: 72, height: 72 }}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={business.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "var(--ink-strong)", color: "var(--gold-c)" }}
          >
            <Icon name="store" size={22} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span className="c-kicker" style={{ color: "var(--ink-mute)" }}>
            § BUSINESS
          </span>
          {business.is_verified && (
            <span className="c-kicker" style={{ color: "var(--gold-c)" }}>
              · VERIFIED
            </span>
          )}
        </div>
        <p
          className="c-card-t truncate"
          style={{ fontSize: 18, marginTop: 4 }}
        >
          {business.name}
        </p>
        <div
          className="mt-1 flex items-center gap-3 flex-wrap c-meta"
          style={{ color: "var(--ink-mute)" }}
        >
          {business.category && (
            <span style={{ color: "var(--ink-soft)" }}>
              {business.category.toUpperCase()}
            </span>
          )}
          {business.rating_avg != null &&
            business.rating_count != null &&
            business.rating_count > 0 && (
              <span
                style={{
                  background: "var(--ink-strong)",
                  color: "var(--gold-c)",
                  padding: "2px 6px",
                  fontWeight: 700,
                }}
              >
                ★ {business.rating_avg.toFixed(1)} · {business.rating_count}
              </span>
            )}
          {isAd && (
            <span style={{ color: "var(--gold-c)", fontWeight: 700 }}>
              AD PARTNER
            </span>
          )}
        </div>
      </div>

      <Link
        href={href}
        className="c-ui shrink-0 press self-center"
        style={{
          background: "var(--ink-strong)",
          color: "var(--gold-c)",
          padding: "10px 14px",
        }}
      >
        VIEW
      </Link>
    </div>
  );
}
