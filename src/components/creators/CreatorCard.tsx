import Link from "next/link";
import Icon from "@/components/ui/Icon";
import CreatorFeaturedTile from "@/components/creators/CreatorFeaturedTile";
import type { FeaturedMedia, FeaturedKind } from "@/lib/featured-media";
import type { CreatorTier } from "@/types/database";

export interface WorkItem {
  id: string;
  kind: FeaturedKind;
  thumb: string | null;
  href: string;
  label?: string | null;
}

interface CreatorCardProps {
  id: string;
  display_name: string;
  handle: string | null;
  avatar_url: string | null;
  bio: string | null;
  verified: boolean;
  profile_tags: string[] | null;
  city: string | null;
  /** Pinned or auto-selected hero piece. Null if there's truly no media. */
  featured: FeaturedMedia | null;
  /** Up to 6 normalized squares for the portfolio strip. */
  work: WorkItem[];
  stats: { reels: number; videos: number; posts: number; tracks: number };
  discipline: string;
  tier: CreatorTier | null;
  sectionNum: string;
}

const KIND_ABBR: Record<FeaturedKind, string> = {
  reel: "REEL",
  video: "VID",
  post: "POST",
  track: "TRK",
  exhibit: "ART",
};

const TIER_LABEL: Record<CreatorTier, string> = {
  starter: "Starter",
  rising: "Rising",
  partner: "Partner",
  premium: "Premium",
};

export default function CreatorCard({
  display_name,
  handle,
  avatar_url,
  bio,
  verified,
  profile_tags,
  city,
  featured,
  work,
  stats,
  discipline,
  tier,
  sectionNum,
}: CreatorCardProps) {
  const initials = display_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const profileHref = handle ? `/user/${handle}` : "#";

  // Build an exactly-6-cell portfolio grid (pad with placeholders for symmetry).
  const cells: (WorkItem | null)[] = [];
  for (let i = 0; i < 6; i++) {
    cells.push(work[i] ?? null);
  }

  const subline = [
    discipline,
    tier ? TIER_LABEL[tier] : null,
    city,
  ].filter(Boolean).join(" · ");

  return (
    <section style={{ borderTop: "2px solid var(--rule-strong-c)" }}>
      {/* Section header bar */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{
          background: "var(--paper)",
          borderBottom: "1px solid var(--rule-strong-c)",
        }}
      >
        <div className="flex items-baseline gap-2.5">
          <span
            className="c-display c-tabnum"
            style={{
              fontSize: 22,
              lineHeight: 1,
              color: "var(--gold-c)",
              letterSpacing: "-0.02em",
            }}
          >
            № {sectionNum}
          </span>
          <span
            className="c-kicker"
            style={{
              fontSize: 9,
              color: "var(--ink-strong)",
              letterSpacing: "0.14em",
            }}
          >
            {discipline.toUpperCase()}
          </span>
        </div>
        <span className="c-kicker" style={{ fontSize: 9, opacity: 0.5 }}>
          {(city ?? "EVERYWHERE").toUpperCase()}
        </span>
      </div>

      {/* Identity row */}
      <div
        className="px-5 pt-5 pb-4 flex items-start gap-4"
        style={{ background: "var(--paper)" }}
      >
        <Link href={profileHref} className="shrink-0 relative">
          <div
            className="overflow-hidden relative"
            style={{
              width: 64,
              height: 64,
              border: "2px solid var(--rule-strong-c)",
              background: "var(--ink-strong)",
              boxShadow: "3px 3px 0 var(--gold-c)",
            }}
          >
            {avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar_url}
                alt={display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span
                  className="c-card-t"
                  style={{ fontSize: 22, color: "var(--gold-c)" }}
                >
                  {initials}
                </span>
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-1.5">
            <Link href={profileHref} className="min-w-0">
              <h2
                className="c-hero"
                style={{
                  fontSize: 22,
                  color: "var(--ink-strong)",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                {display_name}
              </h2>
            </Link>
            {verified && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0 mt-1"
                style={{ color: "var(--gold-c)" }}
                aria-label="verified"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M9 12l2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          {(handle || subline) && (
            <p
              className="c-kicker mt-1 truncate"
              style={{ fontSize: 9, opacity: 0.7, color: "var(--ink-strong)", letterSpacing: "0.14em" }}
            >
              {handle && <span style={{ color: "var(--gold-c)" }}>@{handle}</span>}
              {handle && subline ? <span style={{ opacity: 0.5 }}> · </span> : null}
              {subline}
            </p>
          )}
          {bio && (
            <p
              className="c-serif-it mt-2 line-clamp-2"
              style={{ fontSize: 13, color: "var(--ink-strong)", lineHeight: 1.35, opacity: 0.85 }}
            >
              {bio}
            </p>
          )}
          {profile_tags && profile_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {profile_tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="c-kicker"
                  style={{
                    fontSize: 9,
                    color: "var(--ink-strong)",
                    padding: "3px 7px",
                    border: "1.5px solid var(--rule-strong-c)",
                    background: "var(--paper-warm)",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Featured tile */}
      {featured ? (
        <div className="px-5 pb-4" style={{ background: "var(--paper)" }}>
          <p
            className="c-kicker mb-2"
            style={{ fontSize: 9, opacity: 0.6, letterSpacing: "0.16em", color: "var(--ink-strong)" }}
          >
            § FEATURED
          </p>
          <CreatorFeaturedTile media={featured} aspect="16/10" />
        </div>
      ) : (
        // Empty state: keeps card height consistent without leaving a gap
        <div className="px-5 pb-4" style={{ background: "var(--paper)" }}>
          <div
            className="w-full flex items-center justify-center"
            style={{
              aspectRatio: "16/10",
              background: "var(--paper-warm)",
              border: "2px dashed var(--rule-strong-c)",
              color: "var(--ink-strong)",
              opacity: 0.55,
            }}
          >
            <p className="c-kicker" style={{ fontSize: 10, letterSpacing: "0.16em" }}>
              NO FEATURED YET
            </p>
          </div>
        </div>
      )}

      {/* Portfolio grid — uniform 1:1 squares */}
      <div className="px-5 pb-4" style={{ background: "var(--paper)" }}>
        <p
          className="c-kicker mb-2"
          style={{ fontSize: 9, opacity: 0.6, letterSpacing: "0.16em", color: "var(--ink-strong)" }}
        >
          § PORTFOLIO
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {cells.map((item, i) => {
            if (!item) {
              return (
                <Link
                  key={`empty-${i}`}
                  href={profileHref}
                  className="block press"
                  style={{
                    aspectRatio: "1/1",
                    background: "var(--paper-warm)",
                    border: "1.5px dashed var(--rule-strong-c)",
                  }}
                  aria-label="More on profile"
                />
              );
            }
            const kindAbbr = KIND_ABBR[item.kind];
            return (
              <Link
                key={item.id}
                href={item.href}
                className="relative overflow-hidden press"
                style={{
                  aspectRatio: "1/1",
                  background: "var(--ink-strong)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                {item.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumb}
                    alt={item.label ?? kindAbbr}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ color: "var(--gold-c)" }}
                  >
                    <Icon
                      name={
                        item.kind === "track"
                          ? "music"
                          : item.kind === "video"
                          ? "film"
                          : "frame"
                      }
                      size={18}
                    />
                  </div>
                )}
                {/* Kind chip top-left */}
                <span
                  className="absolute top-1 left-1 c-kicker"
                  style={{
                    fontSize: 7,
                    letterSpacing: "0.14em",
                    background: "rgba(0,0,0,0.55)",
                    color: "#fff",
                    padding: "2px 4px",
                    border: "1px solid rgba(255,255,255,0.18)",
                  }}
                >
                  {kindAbbr}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stats row — always shown */}
      <div
        className="px-5 pb-4 flex items-center gap-5"
        style={{ background: "var(--paper)" }}
      >
        <Stat label="MOMENTS" value={stats.reels} />
        <Stat label="VIDEOS" value={stats.videos} />
        <Stat label="POSTS" value={stats.posts} />
        <Stat label="TRACKS" value={stats.tracks} />
      </div>

      {/* CTA */}
      <div
        className="px-5 pb-5"
        style={{ background: "var(--paper)" }}
      >
        <Link
          href={profileHref}
          className="c-btn c-btn-primary press w-full block text-center"
        >
          VIEW PROFILE →
        </Link>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className="c-display c-tabnum"
        style={{ fontSize: 16, color: "var(--ink-strong)", lineHeight: 1 }}
      >
        {value}
      </span>
      <span className="c-kicker" style={{ fontSize: 8, opacity: 0.55, letterSpacing: "0.14em" }}>
        {label}
      </span>
    </div>
  );
}
