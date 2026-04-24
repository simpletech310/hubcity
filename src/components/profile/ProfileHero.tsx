import Icon from "@/components/ui/Icon";
import { HeroBlock, EditorialCard, Tag } from "@/components/ui/editorial";
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
 * Unified profile hero that adapts to the viewed user's role(s).
 *
 * Composition (top → bottom):
 *   1. Cover HeroBlock with verified + district chips
 *   2. Avatar + display name + handle + role chips
 *   3. Bio pull-quote is rendered OUTSIDE this component so the hero stays
 *      a pure header — keeps the editorial numbering intact downstream.
 *   4. Stats triptych (adaptive based on primary role)
 *   5. Action buttons (Follow/Message OR Edit/Inbox, with optional primary CTA
 *      override like "View Business" / "See Resources")
 *   6. ProfileCreatorCTA (Subscribe + Tip) — only when channel exists
 *   7. Social links row
 *
 * The actual inline sections (posts, reels, events, channel, business, deals,
 * resources, gallery) are still rendered by the page below this hero.
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

  // Sub-label overrides for specific roles (district, department).
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

  // Adaptive primary CTA for the action buttons
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

  // Stats tuple — adaptive based on the strongest role
  const stats = resolveStats({
    primaryRole,
    postCount,
    channel,
    resourceCount,
    galleryCount,
    totalLikes,
  });

  return (
    <>
      {/* --- № COVER --- */}
      <HeroBlock
        image={coverImage}
        aspect="3/2"
        alt={profile.display_name}
        className="w-full"
      >
        {/* Top-right status chips */}
        <div className="absolute top-6 right-10 flex items-center gap-2">
          {profile.district && !subLabels.city_official && (
            <Tag tone="gold" size="xs">
              District {profile.district}
            </Tag>
          )}
          {profile.verification_status === "verified" && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[0.12em] bg-cyan/10 border border-cyan/30 text-cyan backdrop-blur-sm"
              title="Verified"
            >
              <Icon name="verified" size={10} strokeWidth={2.4} />
              Verified
            </span>
          )}
        </div>

        {/* Bottom overlay — avatar + name + handle + role chips */}
        <div className="absolute inset-x-0 bottom-0 px-6 pb-7">
          <div className="flex items-end gap-4">
            {/* Avatar thumb */}
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-gold/30 shrink-0 bg-midnight">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gold">
                  {profile.display_name
                    ?.split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .slice(0, 2)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 pb-0.5">
              <h1 className="font-display text-white text-[44px] leading-[0.95] tracking-[-0.01em] truncate">
                {profile.display_name}
              </h1>
              <div className="mt-1.5 flex items-center gap-2 text-ivory/70 flex-wrap">
                <span className="text-[12px] font-semibold tracking-[0.14em] uppercase text-gold">
                  @{profile.handle}
                </span>
              </div>
              {activeRoles.length > 0 && (
                <div className="mt-2">
                  <ProfileRoleChips
                    roles={activeRoles}
                    subLabels={subLabels}
                    size="sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </HeroBlock>

      {/* --- Stats triptych --- */}
      <div className="px-5 pt-5 pb-6">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <EditorialCard
              key={stat.label}
              variant="ink"
              border="subtle"
              className="p-4 text-center"
            >
              <p className="font-display text-[28px] leading-none text-ivory tabular-nums">
                {stat.value}
              </p>
              <p className="mt-2 text-[10px] text-ivory/50 uppercase tracking-editorial">
                {stat.label}
              </p>
            </EditorialCard>
          ))}
        </div>

        {/* Primary action buttons (Follow/Message or Edit/Inbox) */}
        <ProfileActionButtons
          targetUserId={profile.id}
          isSignedIn={!!currentUserId}
          isOwner={isOwner}
          initialFollowing={initialFollowing}
          primaryCta={primaryCta}
        />

        {/* Creator-specific monetization CTAs */}
        {channel && (
          <ProfileCreatorCTA
            channel={channel}
            stripeAccountId={creatorStripeAccountId}
            userId={currentUserId}
            isOwner={isOwner}
          />
        )}

        {/* Social links row */}
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

  // Creators: Followers · Posts · Likes — followers are the social currency
  if (primaryRole === "content_creator" && channel) {
    return [
      { label: "Followers", value: fmt(channel.follower_count ?? 0) },
      { label: "Posts", value: fmt(postCount) },
      { label: "Likes", value: fmt(totalLikes) },
    ];
  }

  // Resource providers: Resources · Posts · Likes
  if (primaryRole === "resource_provider") {
    return [
      { label: "Resources", value: fmt(resourceCount) },
      { label: "Posts", value: fmt(postCount) },
      { label: "Likes", value: fmt(totalLikes) },
    ];
  }

  // Business owners: Posts · Gallery · Likes — rating lives in the business strip
  if (primaryRole === "business_owner") {
    return [
      { label: "Posts", value: fmt(postCount) },
      { label: "Gallery", value: fmt(galleryCount) },
      { label: "Likes", value: fmt(totalLikes) },
    ];
  }

  // Default (member, civic roles): Posts · Gallery · Likes
  return [
    { label: "Posts", value: fmt(postCount) },
    { label: "Gallery", value: fmt(galleryCount) },
    { label: "Likes", value: fmt(totalLikes) },
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

  return (
    <div className="mt-5 flex items-center gap-3">
      {websiteUrl && (
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-ivory/70 hover:text-gold transition-colors"
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
          className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-ivory/70 hover:text-gold transition-colors"
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
          className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-ivory/70 hover:text-gold transition-colors"
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
          className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-ivory/70 hover:text-gold transition-colors"
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
          className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-ivory/70 hover:text-gold transition-colors"
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
          className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-ivory/70 hover:text-gold transition-colors"
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
