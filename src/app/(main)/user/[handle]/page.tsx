import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { ROLE_BADGE_MAP } from "@/lib/constants";
import {
  HeroBlock,
  EditorialNumber,
  SectionKicker,
  SnapCarousel,
  EditorialCard,
  Tag,
  IssueDivider,
} from "@/components/ui/editorial";
import PullQuote from "@/components/ui/PullQuote";
import ProfileChannelStrip from "@/components/profile/ProfileChannelStrip";
import ProfileBusinessStrip from "@/components/profile/ProfileBusinessStrip";
import ProfileDealsRow from "@/components/profile/ProfileDealsRow";
import ProfileProductsRow from "@/components/profile/ProfileProductsRow";
import ProfileEventsRow from "@/components/profile/ProfileEventsRow";
import ProfileGalleryMasonry from "@/components/profile/ProfileGalleryMasonry";
import UserPostsGrid from "@/components/profile/UserPostsGrid";
import ProfileActionButtons from "@/components/profile/ProfileActionButtons";
import ReelsRail from "@/components/reels/ReelsRail";
import type { Post, Channel, ChannelVideo, Event, ProfileGalleryImage, Reel, ReactionEmoji } from "@/types/database";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("handle", handle)
    .single();

  return {
    title: profile ? `${profile.display_name} -- Culture` : "Profile -- Culture",
  };
}

const ROLE_LABEL_MAP: Record<string, string> = {
  city_official: "City Official",
  school_trustee: "School Trustee",
  city_ambassador: "City Ambassador",
  admin: "Admin",
  business_owner: "Business Owner",
  creator: "Creator",
  content_creator: "Creator",
  community_leader: "Community Leader",
  resource_provider: "Resource Provider",
  chamber_admin: "Chamber",
  school: "School",
  resident: "Resident",
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const supabase = await createClient();

  // Fetch profile by handle
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .single();

  if (!profile) return notFound();

  // Current user (to decide if gallery uploader should show)
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  const isOwner = currentUser?.id === profile.id;

  // Am I already following this profile? Drives the Follow/Following toggle.
  let initialFollowing = false;
  if (currentUser && !isOwner) {
    const { data: rel } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("followed_id", profile.id)
      .maybeSingle();
    initialFollowing = !!rel;
  }

  const todayISO = new Date().toISOString().slice(0, 10);
  const nowISO = new Date().toISOString();

  // Fetch posts, channel, stats, upcoming events, gallery, reels in parallel
  const [
    { data: posts },
    { data: channels },
    { count: postCount },
    { data: upcomingEvents },
    { data: galleryRaw },
    { data: reelsRaw },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(id, display_name, avatar_url, role, verification_status)")
      .eq("author_id", profile.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("channels")
      .select("*")
      .eq("owner_id", profile.id)
      .eq("is_active", true),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", profile.id)
      .eq("is_published", true),
    supabase
      .from("events")
      .select("*")
      .eq("created_by", profile.id)
      .eq("is_published", true)
      .gte("start_date", todayISO)
      .order("start_date", { ascending: true })
      .limit(8),
    supabase
      .from("profile_gallery_images")
      .select("*")
      .eq("owner_id", profile.id)
      .order("display_order", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("reels")
      .select(
        "*, author:profiles!reels_author_id_fkey(id, display_name, handle, avatar_url, role, verification_status)"
      )
      .eq("author_id", profile.id)
      .eq("is_published", true)
      .or(`expires_at.is.null,expires_at.gt.${nowISO}`)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const badge = profile.role ? ROLE_BADGE_MAP[profile.role] : null;
  const channel = channels?.[0] as Channel | undefined;
  const userPosts = (posts ?? []) as Post[];
  const events = (upcomingEvents ?? []) as Event[];
  const gallery = (galleryRaw ?? []) as ProfileGalleryImage[];
  const profileReels = (reelsRaw ?? []) as unknown as Reel[];

  // Collect the viewer's reactions to these posts so the PostCard render
  // inside the grid overlay can show their existing reactions.
  const userReactions: Record<string, ReactionEmoji[]> = {};
  if (currentUser && userPosts.length > 0) {
    const { data: rx } = await supabase
      .from("post_reactions")
      .select("post_id, emoji")
      .eq("user_id", currentUser.id)
      .in(
        "post_id",
        userPosts.map((p) => p.id)
      );
    for (const r of (rx ?? []) as { post_id: string; emoji: ReactionEmoji }[]) {
      (userReactions[r.post_id] ||= []).push(r.emoji);
    }
  }

  // Top 3 latest videos if channel exists
  let channelVideos: ChannelVideo[] = [];
  if (channel) {
    const { data: videoRows } = await supabase
      .from("channel_videos")
      .select("*")
      .eq("channel_id", channel.id)
      .eq("is_published", true)
      .eq("status", "ready")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(3);
    channelVideos = (videoRows ?? []) as ChannelVideo[];
  }

  // Business strip + deals: fetched when this profile owns a business.
  type BusinessSummary = {
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
  };
  type DealItem = {
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
  };
  type ProductItem = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    category: string | null;
  };
  let ownedBusiness: BusinessSummary | null = null;
  const deals: DealItem[] = [];
  let products: ProductItem[] = [];
  if (profile.role === "business_owner") {
    const { data: bizRows } = await supabase
      .from("businesses")
      .select(
        "id, slug, name, category, description, image_urls, rating_avg, rating_count, account_type"
      )
      .eq("owner_id", profile.id)
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1);
    ownedBusiness = (bizRows?.[0] as BusinessSummary | undefined) ?? null;

    if (ownedBusiness) {
      const bizId = ownedBusiness.id;
      const bizSlug = ownedBusiness.slug;
      const nowISO = new Date().toISOString();
      const { data: productRows } = await supabase
        .from("menu_items")
        .select("id, name, description, price, image_url, category")
        .eq("business_id", bizId)
        .eq("is_available", true)
        .order("sort_order", { ascending: true })
        .limit(8);
      products = (productRows ?? []) as ProductItem[];

      const [promosRes, couponsRes, specialsRes] = await Promise.all([
        supabase
          .from("food_promotions")
          .select("id, title, description, discount_percent, discount_amount, promo_code, valid_until")
          .eq("business_id", bizId)
          .eq("is_active", true)
          .or(`valid_until.is.null,valid_until.gt.${nowISO}`)
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("coupons")
          .select("id, title, description, discount_type, discount_value, code, valid_until")
          .eq("business_id", bizId)
          .eq("is_active", true)
          .or(`valid_until.is.null,valid_until.gt.${nowISO}`)
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("food_specials")
          .select("id, title, description, original_price, special_price, valid_until")
          .eq("business_id", bizId)
          .eq("is_active", true)
          .or(`valid_until.is.null,valid_until.gt.${nowISO}`)
          .order("created_at", { ascending: false })
          .limit(4),
      ]);
      for (const p of (promosRes.data ?? []) as {
        id: string; title: string; description: string | null;
        discount_percent: number | null; discount_amount: number | null;
        promo_code: string | null; valid_until: string | null;
      }[]) {
        deals.push({
          id: p.id,
          kind: "promotion",
          title: p.title,
          description: p.description,
          discount_percent: p.discount_percent,
          discount_amount_cents: p.discount_amount,
          code: p.promo_code,
          valid_until: p.valid_until,
          business_slug: bizSlug,
          business_id: bizId,
        });
      }
      for (const c of (couponsRes.data ?? []) as {
        id: string; title: string; description: string | null;
        discount_type: string; discount_value: number;
        code: string | null; valid_until: string | null;
      }[]) {
        deals.push({
          id: c.id,
          kind: "coupon",
          title: c.title,
          description: c.description,
          discount_percent: c.discount_type === "percent" ? c.discount_value : null,
          discount_amount_cents: c.discount_type === "fixed" ? c.discount_value : null,
          code: c.code,
          valid_until: c.valid_until,
          business_slug: bizSlug,
          business_id: bizId,
        });
      }
      for (const s of (specialsRes.data ?? []) as {
        id: string; title: string; description: string | null;
        original_price: number; special_price: number; valid_until: string | null;
      }[]) {
        const savings = s.original_price - s.special_price;
        deals.push({
          id: s.id,
          kind: "special",
          title: s.title,
          description: s.description,
          discount_percent: null,
          discount_amount_cents: savings > 0 ? savings : null,
          code: null,
          valid_until: s.valid_until,
          business_slug: bizSlug,
          business_id: bizId,
        });
      }
    }
  }

  const roleIcons: Record<string, IconName> = {
    city_official: "landmark",
    city_ambassador: "flag",
    business_owner: "store",
    community_leader: "tree",
    admin: "settings",
    content_creator: "film",
    creator: "film",
    chamber_admin: "landmark",
    resource_provider: "briefcase",
    school: "graduation",
  };
  const roleIcon: IconName = profile.role ? (roleIcons[profile.role] || "chat") : "chat";
  const roleLabel = profile.role ? (ROLE_LABEL_MAP[profile.role] ?? badge?.label ?? "Member") : "Member";

  // Parse social links
  const socialLinks = profile.social_links as Record<string, string> | null;

  // Cover image: prefer channel banner, then first gallery image, then avatar
  const coverImage =
    channel?.banner_url ||
    gallery[0]?.image_url ||
    profile.avatar_url ||
    null;

  // Build the numbered section list dynamically so the numerals stay correct
  // regardless of which sections the profile surfaces.
  const numberedSections: string[] = ["posts"];
  if (profileReels.length > 0 || isOwner) numberedSections.push("reels");
  if (events.length > 0) numberedSections.push("events");
  if (channel) numberedSections.push("channel");
  if (ownedBusiness) numberedSections.push("business");
  if (deals.length > 0) numberedSections.push("deals");
  const sectionIndex = (key: string) => numberedSections.indexOf(key) + 1;

  const totalLikes = userPosts.reduce((sum, p) => sum + (p.like_count ?? 0), 0);

  return (
    <div className="animate-fade-in pb-24 bg-ink text-ivory">
      {/* --- № COVER --- */}
      <HeroBlock
        image={coverImage}
        aspect="3/2"
        alt={profile.display_name}
        className="w-full"
      >
        {/* Top-right status chips */}
        <div className="absolute top-6 right-10 flex items-center gap-2">
          {profile.district && (
            <Tag tone="gold" size="xs">District {profile.district}</Tag>
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

        {/* Bottom overlay — name + handle */}
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
                  {profile.display_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 pb-0.5">
              <h1 className="font-display text-white text-[44px] leading-[0.95] tracking-[-0.01em] truncate">
                {profile.display_name}
              </h1>
              <div className="mt-1.5 flex items-center gap-2 text-ivory/70">
                <span className="text-[12px] font-semibold tracking-[0.14em] uppercase text-gold">
                  @{profile.handle}
                </span>
              </div>
            </div>
          </div>
        </div>
      </HeroBlock>

      {/* --- BYLINE STRIP --- */}
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <EditorialNumber n={1} size="md" />
            <SectionKicker tone="gold">PROFILE</SectionKicker>
            <span className="block h-px w-10 bg-gold/60" />
            <SectionKicker tone="muted">{roleLabel}</SectionKicker>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {badge && <Tag tone="gold" size="xs">{badge.label}</Tag>}
            {profile.district && (
              <Tag tone="default" size="xs">District {profile.district}</Tag>
            )}
          </div>
        </div>

        {/* Small-screen meta chips */}
        <div className="sm:hidden mt-3 flex flex-wrap items-center gap-2">
          {badge && <Tag tone="gold" size="xs">{badge.label}</Tag>}
          {profile.district && (
            <Tag tone="default" size="xs">District {profile.district}</Tag>
          )}
        </div>
      </div>

      {/* --- PULL QUOTE (bio) --- */}
      {profile.bio && (
        <div className="px-6 py-8">
          <PullQuote
            quote={profile.bio}
            attribution={profile.display_name}
            size="lg"
          />
        </div>
      )}

      {/* --- Stats triptych --- */}
      <div className="px-5 pb-6">
        <div className="grid grid-cols-3 gap-3">
          <EditorialCard variant="ink" border="subtle" className="p-4 text-center">
            <p className="font-display text-[28px] leading-none text-ivory tabular-nums">
              {postCount ?? 0}
            </p>
            <p className="mt-2 text-[10px] text-ivory/50 uppercase tracking-editorial">
              Posts
            </p>
          </EditorialCard>
          {channel ? (
            <EditorialCard variant="ink" border="subtle" className="p-4 text-center">
              <p className="font-display text-[28px] leading-none text-ivory tabular-nums">
                {channel.follower_count?.toLocaleString() ?? 0}
              </p>
              <p className="mt-2 text-[10px] text-ivory/50 uppercase tracking-editorial">
                Followers
              </p>
            </EditorialCard>
          ) : (
            <EditorialCard variant="ink" border="subtle" className="p-4 text-center">
              <p className="font-display text-[28px] leading-none text-ivory tabular-nums">
                {gallery.length}
              </p>
              <p className="mt-2 text-[10px] text-ivory/50 uppercase tracking-editorial">
                Gallery
              </p>
            </EditorialCard>
          )}
          <EditorialCard variant="ink" border="subtle" className="p-4 text-center">
            <p className="font-display text-[28px] leading-none text-ivory tabular-nums">
              {totalLikes.toLocaleString()}
            </p>
            <p className="mt-2 text-[10px] text-ivory/50 uppercase tracking-editorial">
              Likes
            </p>
          </EditorialCard>
        </div>

        {/* Action buttons — Follow / Message wired to /api/follows + /api/conversations */}
        <ProfileActionButtons
          targetUserId={profile.id}
          isSignedIn={!!currentUser}
          isOwner={isOwner}
          initialFollowing={initialFollowing}
        />

        {/* Social links */}
        {(socialLinks && Object.keys(socialLinks).length > 0 || profile.website_url) && (
          <div className="mt-5 flex items-center gap-3">
            {profile.website_url && (
              <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-ivory/70 hover:text-gold transition-colors">
                <Icon name="globe" size={14} />
              </a>
            )}
            {socialLinks?.instagram && (
              <a href={`https://instagram.com/${socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-ivory/70 hover:text-gold transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
            )}
            {(socialLinks?.twitter || socialLinks?.x) && (
              <a href={`https://x.com/${socialLinks.twitter || socialLinks.x}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-ivory/70 hover:text-gold transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            )}
            {socialLinks?.facebook && (
              <a href={`https://facebook.com/${socialLinks.facebook}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-ivory/70 hover:text-gold transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            )}
            {socialLinks?.tiktok && (
              <a href={`https://tiktok.com/@${socialLinks.tiktok}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-ivory/70 hover:text-gold transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.98a8.21 8.21 0 004.76 1.52V7.05a4.84 4.84 0 01-1-.36z"/></svg>
              </a>
            )}
            {socialLinks?.youtube && (
              <a href={`https://youtube.com/${socialLinks.youtube}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-ivory/70 hover:text-gold transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            )}
          </div>
        )}
      </div>

      {/* --- № 01 POSTS --- */}
      <section className="pt-4 pb-2">
        <div className="px-5 mb-3 flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <EditorialNumber n={sectionIndex("posts")} size="md" />
            <SectionKicker tone="muted">Posts</SectionKicker>
          </div>
          <span className="text-[10px] font-bold tracking-editorial-tight uppercase text-ivory/40 tabular-nums">
            {postCount ?? userPosts.length}
          </span>
        </div>
        <div className="px-5 mb-4">
          <div className="rule-hairline" />
        </div>
        <div className="px-5">
          <UserPostsGrid
            posts={userPosts}
            userId={currentUser?.id ?? null}
            userReactions={userReactions}
          />
        </div>
      </section>

      {/* --- № XX REELS --- */}
      {(profileReels.length > 0 || isOwner) && (
        <>
          <IssueDivider />
          <section>
            <div className="px-5 mb-3 flex items-baseline gap-3">
              <EditorialNumber n={sectionIndex("reels")} size="md" />
              <SectionKicker tone="muted">Reels</SectionKicker>
            </div>
            <div className="px-5 mb-4">
              <div className="rule-hairline" />
            </div>
            <ReelsRail
              reels={profileReels}
              label=""
              showSeeAll={false}
              canPost={isOwner}
            />
          </section>
        </>
      )}

      {/* --- № XX EVENTS --- */}
      {events.length > 0 && (
        <>
          <IssueDivider />
          <section>
            <div className="px-5 mb-3 flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3 min-w-0">
                <EditorialNumber n={sectionIndex("events")} size="md" />
                <SectionKicker tone="muted">Upcoming Events</SectionKicker>
              </div>
              <span className="text-[10px] font-bold tracking-editorial-tight uppercase text-ivory/40 tabular-nums">
                {events.length}
              </span>
            </div>
            <div className="px-5 mb-4">
              <div className="rule-hairline" />
            </div>
            <ProfileEventsRow events={events} accentColor="#F2A900" />
          </section>
        </>
      )}

      {/* --- № XX CHANNEL --- */}
      {channel && (
        <>
          <IssueDivider />
          <section>
            <div className="px-5 mb-3 flex items-baseline gap-3">
              <EditorialNumber n={sectionIndex("channel")} size="md" />
              <SectionKicker tone="muted">Channel</SectionKicker>
            </div>
            <div className="px-5 mb-4">
              <div className="rule-hairline" />
            </div>
            <div className="px-5">
              <ProfileChannelStrip channel={channel} videos={channelVideos} />
            </div>
          </section>
        </>
      )}

      {/* --- № XX BUSINESS --- */}
      {ownedBusiness && (
        <>
          <IssueDivider />
          <section>
            <div className="px-5 mb-3 flex items-baseline gap-3">
              <EditorialNumber n={sectionIndex("business")} size="md" />
              <SectionKicker tone="muted">Business</SectionKicker>
            </div>
            <div className="px-5 mb-4">
              <div className="rule-hairline" />
            </div>
            <div className="px-5">
              <ProfileBusinessStrip business={ownedBusiness} />
            </div>

            {products.length > 0 && (
              <div className="mt-5">
                <ProfileProductsRow
                  products={products}
                  businessSlug={ownedBusiness.slug}
                  businessId={ownedBusiness.id}
                  title={ownedBusiness.category === "retail" ? "Shop" : "Menu"}
                />
              </div>
            )}
          </section>
        </>
      )}

      {/* --- № XX DEALS --- */}
      {deals.length > 0 && (
        <>
          <IssueDivider />
          <section>
            <div className="px-5 mb-3 flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3 min-w-0">
                <EditorialNumber n={sectionIndex("deals")} size="md" />
                <SectionKicker tone="muted">Deals &amp; Coupons</SectionKicker>
              </div>
              <span className="text-[10px] font-bold tracking-editorial-tight uppercase text-ivory/40 tabular-nums">
                {deals.length}
              </span>
            </div>
            <div className="px-5 mb-4">
              <div className="rule-hairline" />
            </div>
            <ProfileDealsRow deals={deals} />
          </section>
        </>
      )}

      {/* --- Gallery (unnumbered supplement) --- */}
      {(isOwner || gallery.length > 0) && (
        <>
          <IssueDivider />
          <section className="px-5">
            <div className="mb-3 flex items-baseline gap-3">
              <SectionKicker tone="gold">Plates</SectionKicker>
              <span className="block h-px flex-1 bg-white/[0.06]" />
              <span className="text-[10px] font-bold tracking-editorial-tight uppercase text-ivory/40 flex items-center gap-1.5">
                <Icon name="photo" size={12} className="text-gold" />
                Gallery
              </span>
            </div>
            <ProfileGalleryMasonry
              images={gallery}
              ownerName={profile.display_name}
              isOwner={isOwner}
              accentColor="#F2A900"
            />
          </section>
        </>
      )}

      {/* --- Colophon / close --- */}
      <IssueDivider label="END" />
      <div className="px-6 pb-2 flex items-center justify-between text-[10px] font-semibold tracking-editorial uppercase text-ivory/40">
        <span className="flex items-center gap-2">
          <Icon name={roleIcon} size={12} className="text-gold" />
          {roleLabel}
        </span>
        <span className="tabular-nums text-ivory/30">@{profile.handle}</span>
      </div>
    </div>
  );
}
