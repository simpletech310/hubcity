import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import {
  EditorialNumber,
  SectionKicker,
  IssueDivider,
} from "@/components/ui/editorial";
import PullQuote from "@/components/ui/PullQuote";
import ProfileHero from "@/components/profile/ProfileHero";
import ProfileChannelStrip from "@/components/profile/ProfileChannelStrip";
import ProfileBusinessStrip from "@/components/profile/ProfileBusinessStrip";
import ProfileDealsRow from "@/components/profile/ProfileDealsRow";
import ProfileProductsRow from "@/components/profile/ProfileProductsRow";
import ProfileEventsRow from "@/components/profile/ProfileEventsRow";
import ProfileGalleryMasonry from "@/components/profile/ProfileGalleryMasonry";
import ProfileResourcesRow, {
  type ResourceTile,
} from "@/components/profile/ProfileResourcesRow";
import { deriveActiveRoles } from "@/components/profile/ProfileRoleChips";
import UserPostsGrid from "@/components/profile/UserPostsGrid";
import ReelsRail from "@/components/reels/ReelsRail";
import type {
  Post,
  Channel,
  ChannelVideo,
  Event,
  ProfileGalleryImage,
  Reel,
  ReactionEmoji,
} from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
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
  citizen: "Member",
};

const ROLE_ICONS: Record<string, IconName> = {
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
  school_trustee: "graduation",
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

  // Current viewer context
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

  // --- Parallel fetch: posts, channels, counts, events, gallery, reels,
  // ---                  resources (NEW), owned business (un-gated).
  const [
    { data: posts },
    { data: channels },
    { count: postCount },
    { data: upcomingEvents },
    { data: galleryRaw },
    { data: reelsRaw },
    { data: ownedResourcesRaw },
    { data: ownedBusinessesRaw },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "*, author:profiles!posts_author_id_fkey(id, display_name, avatar_url, role, verification_status)"
      )
      .eq("author_id", profile.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("channels").select("*").eq("owner_id", profile.id).eq("is_active", true),
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
    // Resources the profile provides (drives the Resources row for providers)
    supabase
      .from("resources")
      .select(
        "id, name, slug, category, status, organization, image_url, max_spots, filled_spots"
      )
      .eq("created_by", profile.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(10),
    // Owned business — no longer gated on role, so multi-role users surface it
    supabase
      .from("businesses")
      .select(
        "id, slug, name, category, description, image_urls, rating_avg, rating_count, account_type"
      )
      .eq("owner_id", profile.id)
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const channel = (channels?.[0] as Channel | undefined) ?? null;
  const userPosts = (posts ?? []) as Post[];
  const events = (upcomingEvents ?? []) as Event[];
  const gallery = (galleryRaw ?? []) as ProfileGalleryImage[];
  const profileReels = (reelsRaw ?? []) as unknown as Reel[];
  const ownedResources = (ownedResourcesRaw ?? []) as ResourceTile[];

  // Viewer's reactions on this profile's posts (for the grid overlay).
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

  // Business + deals (fetched whenever the user owns a business, regardless of role)
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

  const ownedBusiness =
    (ownedBusinessesRaw?.[0] as BusinessSummary | undefined) ?? null;
  const deals: DealItem[] = [];
  let products: ProductItem[] = [];

  if (ownedBusiness) {
    const bizId = ownedBusiness.id;
    const bizSlug = ownedBusiness.slug;

    const [productsRes, promosRes, couponsRes, specialsRes] = await Promise.all([
      supabase
        .from("menu_items")
        .select("id, name, description, price, image_url, category")
        .eq("business_id", bizId)
        .eq("is_available", true)
        .order("sort_order", { ascending: true })
        .limit(8),
      supabase
        .from("food_promotions")
        .select(
          "id, title, description, discount_percent, discount_amount, promo_code, valid_until"
        )
        .eq("business_id", bizId)
        .eq("is_active", true)
        .or(`valid_until.is.null,valid_until.gt.${nowISO}`)
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("coupons")
        .select(
          "id, title, description, discount_type, discount_value, code, valid_until"
        )
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

    products = (productsRes.data ?? []) as ProductItem[];

    for (const p of (promosRes.data ?? []) as {
      id: string;
      title: string;
      description: string | null;
      discount_percent: number | null;
      discount_amount: number | null;
      promo_code: string | null;
      valid_until: string | null;
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
      id: string;
      title: string;
      description: string | null;
      discount_type: string;
      discount_value: number;
      code: string | null;
      valid_until: string | null;
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
      id: string;
      title: string;
      description: string | null;
      original_price: number;
      special_price: number;
      valid_until: string | null;
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

  // Creator stripe account (drives tip jar visibility)
  let creatorStripeAccountId: string | null = null;
  if (channel) {
    const { data: acct } = await supabase
      .from("creator_stripe_accounts")
      .select("stripe_account_id, charges_enabled")
      .eq("creator_id", profile.id)
      .maybeSingle();
    if (acct?.charges_enabled) {
      creatorStripeAccountId = acct.stripe_account_id ?? null;
    }
  }

  const roleLabel = profile.role
    ? ROLE_LABEL_MAP[profile.role] ?? "Member"
    : "Member";
  const roleIcon: IconName = profile.role
    ? ROLE_ICONS[profile.role] || "chat"
    : "chat";

  // Cover image priority: explicit cover_url → channel banner → first gallery image → avatar
  const coverImage =
    profile.cover_url ||
    channel?.banner_url ||
    gallery[0]?.image_url ||
    profile.avatar_url ||
    null;

  const totalLikes = userPosts.reduce((sum, p) => sum + (p.like_count ?? 0), 0);

  // Resolve which roles this profile is ACTIVELY playing (based on data, not
  // just the enum role). Multi-role users get multiple chips + sections.
  const activeRoles = deriveActiveRoles(
    profile,
    channel,
    !!ownedBusiness,
    ownedResources.length
  );

  // Editorial numbered sections — dynamically built so numerals stay in sync
  // with what we actually render below. Order defines the reading flow.
  const numberedSections: string[] = ["posts"];
  if (profileReels.length > 0 || isOwner) numberedSections.push("reels");
  if (events.length > 0) numberedSections.push("events");
  if (channel) numberedSections.push("channel");
  if (ownedBusiness) numberedSections.push("business");
  if (deals.length > 0) numberedSections.push("deals");
  if (ownedResources.length > 0) numberedSections.push("resources");
  const sectionIndex = (key: string) => numberedSections.indexOf(key) + 1;

  return (
    <div className="culture-surface animate-fade-in pb-24 min-h-dvh">
      {/* --- HERO (cover + avatar + role chips + stats + CTAs + socials) --- */}
      <ProfileHero
        profile={profile}
        activeRoles={activeRoles}
        channel={channel}
        business={
          ownedBusiness
            ? {
                id: ownedBusiness.id,
                slug: ownedBusiness.slug,
                name: ownedBusiness.name,
                category: ownedBusiness.category,
              }
            : null
        }
        resourceCount={ownedResources.length}
        postCount={postCount ?? 0}
        totalLikes={totalLikes}
        galleryCount={gallery.length}
        creatorStripeAccountId={creatorStripeAccountId}
        currentUserId={currentUser?.id ?? null}
        isOwner={isOwner}
        initialFollowing={initialFollowing}
        coverImage={coverImage}
      />

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

      {/* --- № 01 POSTS --- */}
      <section className="pt-4 pb-2">
        <div className="px-5 mb-3 flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <EditorialNumber n={sectionIndex("posts")} size="md" />
            <SectionKicker tone="muted">Posts</SectionKicker>
          </div>
          <span className="text-[10px] font-bold tracking-editorial-tight uppercase tabular-nums" style={{ color: "var(--ink-strong)", opacity: 0.45 }}>
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

      {/* --- REELS --- */}
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

      {/* --- EVENTS --- */}
      {events.length > 0 && (
        <>
          <IssueDivider />
          <section>
            <div className="px-5 mb-3 flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3 min-w-0">
                <EditorialNumber n={sectionIndex("events")} size="md" />
                <SectionKicker tone="muted">Upcoming Events</SectionKicker>
              </div>
              <span className="text-[10px] font-bold tracking-editorial-tight uppercase tabular-nums" style={{ color: "var(--ink-strong)", opacity: 0.45 }}>
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

      {/* --- CHANNEL --- */}
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

      {/* --- BUSINESS --- */}
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

      {/* --- DEALS & COUPONS --- */}
      {deals.length > 0 && (
        <>
          <IssueDivider />
          <section>
            <div className="px-5 mb-3 flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3 min-w-0">
                <EditorialNumber n={sectionIndex("deals")} size="md" />
                <SectionKicker tone="muted">Deals &amp; Coupons</SectionKicker>
              </div>
              <span className="text-[10px] font-bold tracking-editorial-tight uppercase tabular-nums" style={{ color: "var(--ink-strong)", opacity: 0.45 }}>
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

      {/* --- RESOURCES --- */}
      {ownedResources.length > 0 && (
        <>
          <IssueDivider />
          <section id="resources">
            <div className="px-5 mb-3 flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3 min-w-0">
                <EditorialNumber n={sectionIndex("resources")} size="md" />
                <SectionKicker tone="muted">Resources</SectionKicker>
              </div>
              <span className="text-[10px] font-bold tracking-editorial-tight uppercase tabular-nums" style={{ color: "var(--ink-strong)", opacity: 0.45 }}>
                {ownedResources.length}
              </span>
            </div>
            <div className="px-5 mb-4">
              <div className="rule-hairline" />
            </div>
            <ProfileResourcesRow resources={ownedResources} />
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
              <span className="block h-px flex-1" style={{ background: "var(--rule-strong-c)" }} />
              <span className="text-[10px] font-bold tracking-editorial-tight uppercase flex items-center gap-1.5" style={{ color: "var(--ink-strong)", opacity: 0.45 }}>
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
      <div className="px-6 pb-2 flex items-center justify-between text-[10px] font-semibold tracking-editorial uppercase" style={{ color: "var(--ink-strong)", opacity: 0.4 }}>
        <span className="flex items-center gap-2">
          <Icon name={roleIcon} size={12} className="text-gold" />
          {roleLabel}
        </span>
        <span className="tabular-nums">@{profile.handle}</span>
      </div>
    </div>
  );
}
