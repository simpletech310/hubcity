import Link from "next/link";
import Icon from "@/components/ui/Icon";
import ProfileActionButtons from "./ProfileActionButtons";
import ProfileRoleChips, {
  pickPrimaryRole,
  type ActiveRole,
} from "./ProfileRoleChips";
import ProfileCreatorCTA from "./ProfileCreatorCTA";
import type { Profile, Channel } from "@/types/database";

interface BusinessLite {
  id: string;
  slug: string | null;
  name: string;
  category: string | null;
}

interface ProfileHeroProps {
  profile: Profile;
  activeRoles: ActiveRole[];
  channel: Channel | null;
  business: BusinessLite | null;
  resourceCount: number;
  postCount: number;
  totalLikes: number;
  galleryCount: number;
  creatorStripeAccountId: string | null;
  currentUserId: string | null;
  isOwner: boolean;
  initialFollowing: boolean;
  coverImage: string | null;
}

/**
 * Culture blockprint hero:
 *   1. Framed avatar + kicker badge + Anton display name
 *   2. Fraunces italic bio
 *   3. 3-col stats grid with 2px inner vertical rules (primary = gold fill)
 *   4. Primary CTA (ink bg) + secondary CTA (bordered)
 *   5. ProfileCreatorCTA (Subscribe + Tip) — only when channel exists
 *   6. Social links row (framed icon tiles)
 */
export default function ProfileHero({
  profile,
  activeRoles,
  channel,
  business,
  resourceCount,
  postCount,
  totalLikes,
  galleryCount,
  creatorStripeAccountId,
  currentUserId,
  isOwner,
  initialFollowing,
  coverImage,
}: ProfileHeroProps) {
  const primaryRole = pickPrimaryRole(activeRoles);

  const subLabels: Partial<Record<ActiveRole, string | null>> = {};
  if (profile.district) {
    subLabels.city_official = `District ${profile.district}`;
  }
  if (channel?.type) {
    subLabels.content_creator = humanizeChannelType(channel.type);
  }
  if (business?.category) {
    subLabels.business_owner = titleCase(business.category);
  }

  const primaryCta = (() => {
    if (isOwner) return undefined;
    if (primaryRole === "business_owner" && business) {
      return {
        label: "View Business",
        href: `/business/${business.slug || business.id}`,
      };
    }
    if (primaryRole === "resource_provider") {
      return { label: "See Resources", href: "#resources" };
    }
    return undefined;
  })();

  const stats = resolveStats({
    primaryRole,
    postCount,
    channel,
    resourceCount,
    galleryCount,
    totalLikes,
  });

  const verified = profile.verification_status === "verified";
  const avatarSrc = coverImage || profile.avatar_url;

  // Build kicker badge text: VERIFIED · <primary role label>
  const kickerParts: string[] = [];
  if (verified) kickerParts.push("VERIFIED");
  if (primaryRole) kickerParts.push(rolePascalCase(primaryRole).toUpperCase());
  else kickerParts.push("MEMBER");
  const kickerText = `§ ${kickerParts.join(" · ")}`;

  // Issue + volume labels — same treatment as /home, /jobs, /events.
  const today = new Date();
  const volLabel = `VOL.${today.getFullYear() % 100}`;
  const issueLabel = `ISS.${(() => {
    const onejan = new Date(today.getFullYear(), 0, 1);
    return Math.ceil(
      ((today.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7,
    );
  })()}`;

  return (
    <>
      {/* --- EDITORIAL MASTHEAD: ← back · § VOL · ISSUE PROFILE --- */}
      <div
        className="px-[18px] pt-4 pb-3"
        style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/creators"
            className="c-kicker inline-flex items-center gap-1.5 press"
            style={{ color: "var(--ink-strong)", letterSpacing: "0.16em", fontSize: 11 }}
          >
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M10 12L6 8l4-4" />
            </svg>
            BACK
          </Link>
          <span
            className="c-kicker"
            style={{
              fontSize: 10,
              opacity: 0.55,
              color: "var(--ink-strong)",
              letterSpacing: "0.18em",
            }}
          >
            § {volLabel} · {issueLabel} · PROFILE
          </span>
        </div>
      </div>

      {/* --- HERO: kicker + display name big · avatar to the right --- */}
      <div
        className="px-[18px] pt-5 pb-6"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <span
              className="c-kicker inline-block"
              style={{
                background: "var(--ink-strong)",
                color: "var(--gold-c)",
                padding: "3px 8px",
                fontSize: 9,
                letterSpacing: "0.18em",
              }}
            >
              {kickerText}
            </span>
            <h1
              className="c-hero mt-3"
              style={{
                fontSize: 48,
                lineHeight: 0.86,
                letterSpacing: "-0.02em",
                color: "var(--ink-strong)",
              }}
            >
              {profile.display_name.toUpperCase()}.
            </h1>
            <div
              className="c-kicker mt-2"
              style={{
                color: "var(--ink-strong)",
                opacity: 0.6,
                fontSize: 10,
                letterSpacing: "0.18em",
              }}
            >
              @{profile.handle}
              {profile.district && ` · DISTRICT ${profile.district}`}
            </div>
          </div>
          <div
            className="c-frame-strong shrink-0 overflow-hidden"
            style={{ width: 96, height: 96 }}
          >
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt={profile.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center c-display"
                style={{
                  background: "var(--ink-strong)",
                  color: "var(--gold-c)",
                  fontSize: 32,
                }}
              >
                {profile.display_name
                  ?.split(" ")
                  .map((w: string) => w[0])
                  .join("")
                  .slice(0, 2)}
              </div>
            )}
          </div>
        </div>

        {profile.bio && (
          <p
            className="c-serif-it mt-4"
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              color: "var(--ink-strong)",
              opacity: 0.85,
            }}
          >
            {profile.bio}
          </p>
        )}

        {activeRoles.length > 0 && (
          <div className="mt-4">
            <ProfileRoleChips
              roles={activeRoles}
              subLabels={subLabels}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* --- STATS TRIPTYCH: 3-col with vertical 2px rules --- */}
      <div
        className="grid grid-cols-3"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="text-center"
            style={{
              padding: "20px 14px 18px",
              borderRight:
                i < stats.length - 1 ? "2px solid var(--rule-strong-c)" : "none",
              background: i === 0 ? "var(--gold-c)" : "var(--paper)",
            }}
          >
            <div
              className="c-display c-tabnum"
              style={{
                fontSize: 32,
                lineHeight: 0.9,
                letterSpacing: "-0.015em",
                color: "var(--ink-strong)",
              }}
            >
              {stat.value}
            </div>
            <div
              className="c-kicker mt-2"
              style={{
                fontSize: 9,
                letterSpacing: "0.18em",
                color: "var(--ink-strong)",
                opacity: i === 0 ? 0.85 : 0.6,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* --- ACTION BUTTONS --- */}
      <div
        className="px-[18px] py-[14px]"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <ProfileActionButtons
          targetUserId={profile.id}
          isSignedIn={!!currentUserId}
          isOwner={isOwner}
          initialFollowing={initialFollowing}
          primaryCta={primaryCta}
        />

        {channel && (
          <div className="mt-[10px]">
            <ProfileCreatorCTA
              channel={channel}
              stripeAccountId={creatorStripeAccountId}
              userId={currentUserId}
              isOwner={isOwner}
            />
          </div>
        )}

        <SocialLinksRow
          websiteUrl={profile.website_url}
          socialLinks={profile.social_links}
        />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Stats resolver
// ---------------------------------------------------------------------------

function resolveStats(args: {
  primaryRole: ActiveRole | null;
  postCount: number;
  channel: Channel | null;
  resourceCount: number;
  galleryCount: number;
  totalLikes: number;
}): Array<{ label: string; value: string }> {
  const {
    primaryRole,
    postCount,
    channel,
    resourceCount,
    galleryCount,
    totalLikes,
  } = args;

  if (primaryRole === "content_creator" && channel) {
    return [
      { label: "FOLLOWERS", value: fmt(channel.follower_count ?? 0) },
      { label: "POSTS", value: fmt(postCount) },
      { label: "LIKES", value: fmt(totalLikes) },
    ];
  }

  if (primaryRole === "resource_provider") {
    return [
      { label: "RESOURCES", value: fmt(resourceCount) },
      { label: "POSTS", value: fmt(postCount) },
      { label: "LIKES", value: fmt(totalLikes) },
    ];
  }

  if (primaryRole === "business_owner") {
    return [
      { label: "POSTS", value: fmt(postCount) },
      { label: "GALLERY", value: fmt(galleryCount) },
      { label: "LIKES", value: fmt(totalLikes) },
    ];
  }

  return [
    { label: "POSTS", value: fmt(postCount) },
    { label: "GALLERY", value: fmt(galleryCount) },
    { label: "LIKES", value: fmt(totalLikes) },
  ];
}

function fmt(n: number): string {
  return (n ?? 0).toLocaleString();
}

// ---------------------------------------------------------------------------
// Social links row
// ---------------------------------------------------------------------------

function SocialLinksRow({
  websiteUrl,
  socialLinks,
}: {
  websiteUrl: string | null;
  socialLinks: Record<string, string> | null;
}) {
  const hasAny =
    !!websiteUrl ||
    (socialLinks && Object.values(socialLinks).some((v) => !!v));

  if (!hasAny) return null;

  const iconTile =
    "w-9 h-9 c-frame flex items-center justify-center press transition-colors";
  const iconStyle: React.CSSProperties = {
    background: "var(--paper)",
    color: "var(--ink-strong)",
  };

  return (
    <div className="mt-[14px] flex items-center gap-2">
      {websiteUrl && (
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={iconTile}
          style={iconStyle}
          aria-label="Website"
        >
          <Icon name="globe" size={14} />
        </a>
      )}
      {socialLinks?.instagram && (
        <a
          href={`https://instagram.com/${stripAt(socialLinks.instagram)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={iconTile}
          style={iconStyle}
          aria-label="Instagram"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
        </a>
      )}
      {(socialLinks?.twitter || socialLinks?.x) && (
        <a
          href={`https://x.com/${stripAt(socialLinks.twitter || socialLinks.x || "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className={iconTile}
          style={iconStyle}
          aria-label="X / Twitter"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
      )}
      {socialLinks?.facebook && (
        <a
          href={`https://facebook.com/${stripAt(socialLinks.facebook)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={iconTile}
          style={iconStyle}
          aria-label="Facebook"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </a>
      )}
      {socialLinks?.tiktok && (
        <a
          href={`https://tiktok.com/@${stripAt(socialLinks.tiktok)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={iconTile}
          style={iconStyle}
          aria-label="TikTok"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.98a8.21 8.21 0 004.76 1.52V7.05a4.84 4.84 0 01-1-.36z" />
          </svg>
        </a>
      )}
      {socialLinks?.youtube && (
        <a
          href={`https://youtube.com/${socialLinks.youtube.startsWith("@") || socialLinks.youtube.startsWith("c/") || socialLinks.youtube.startsWith("channel/") ? socialLinks.youtube : "@" + stripAt(socialLinks.youtube)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={iconTile}
          style={iconStyle}
          aria-label="YouTube"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function stripAt(handle: string): string {
  return handle.replace(/^@/, "");
}

function titleCase(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function humanizeChannelType(type: string): string {
  return titleCase(type);
}

function rolePascalCase(role: string): string {
  const map: Record<string, string> = {
    content_creator: "Tastemaker",
    business_owner: "Business",
    resource_provider: "Provider",
    chamber_admin: "Chamber",
    city_official: "Official",
    school_trustee: "Trustee",
    city_ambassador: "Ambassador",
    school: "School",
    admin: "Admin",
  };
  return map[role] ?? titleCase(role);
}
