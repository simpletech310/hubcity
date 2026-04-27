import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import {
  EditorialNumber,
  SectionKicker,
  IssueDivider,
} from "@/components/ui/editorial";
import ProfileHero from "@/components/profile/ProfileHero";
import ProfileMusicShelf from "@/components/profile/ProfileMusicShelf";
import ProfilePodcastShelf, {
  type PodcastShelfShow,
} from "@/components/profile/ProfilePodcastShelf";
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
import CreatorFeaturedTile from "@/components/creators/CreatorFeaturedTile";
import { resolveFeaturedMedia } from "@/lib/featured-media";
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
    .select("display_name, bio, avatar_url, handle")
    .eq("handle", handle)
    .single();

  if (!profile) return { title: "Profile not found" };

  const { buildOg } = await import("@/lib/og");
  return buildOg({
    title: profile.display_name || `@${profile.handle}`,
    description:
      profile.bio ?? `${profile.display_name || `@${profile.handle}`} on Culture.`,
    image: profile.avatar_url ?? null,
    type: "profile",
    path: `/user/${profile.handle}`,
    kicker: "CREATOR",
  });
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

  // Resolve pinned featured media (if any)
  const featuredMedia = await resolveFeaturedMedia(supabase, {
    id: profile.id,
    featured_kind: profile.featured_kind ?? null,
    featured_id: profile.featured_id ?? null,
    featured_caption: profile.featured_caption ?? null,
  });

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
    { data: albumsRaw },
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
    // Albums (music releases) — singles, EPs, albums, mixtapes
    supabase
      .from("albums")
      .select("id, slug, title, cover_art_url, release_type, release_date")
      .eq("creator_id", profile.id)
      .eq("is_published", true)
      .order("release_date", { ascending: false, nullsFirst: false })
      .limit(12),
  ]);

  const channel = (channels?.[0] as Channel | undefined) ?? null;
  const userPosts = (posts ?? []) as Post[];
  const events = (upcomingEvents ?? []) as Event[];
  const gallery = (galleryRaw ?? []) as ProfileGalleryImage[];
  const profileReels = (reelsRaw ?? []) as unknown as Reel[];
  const ownedResources = (ownedResourcesRaw ?? []) as ResourceTile[];
  const profileAlbums = (albumsRaw ?? []) as Array<{
    id: string;
    slug: string;
    title: string;
    cover_art_url: string | null;
    release_type: string | null;
    release_date: string | null;
  }>;

  // Artwork — combined creative-works count across exhibits + gallery
  // items. Surfaces as the ARTWORK stat in the hero AND drives a new
  // "ARTWORK" section below the music shelf for visual artists.
  const [{ data: artistGalleryItems }, { data: artistExhibits }] =
    await Promise.all([
      supabase
        .from("gallery_items")
        .select("id, slug, title, image_urls, item_type, year_created, medium")
        .eq("artist_id", profile.id)
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .limit(24),
      supabase
        .from("museum_exhibits")
        .select("id, slug, title, subtitle, cover_image_url, era")
        .eq("created_by", profile.id)
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .limit(12),
    ]);
  const profileArtworks = (artistGalleryItems ?? []) as Array<{
    id: string;
    slug: string;
    title: string;
    image_urls: string[] | null;
    item_type: string | null;
    year_created: string | null;
    medium: string | null;
  }>;
  const profileExhibits = (artistExhibits ?? []) as Array<{
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    cover_image_url: string | null;
    era: string | null;
  }>;
  const artworkCount = profileArtworks.length + profileExhibits.length;

  // Podcast shows hosted by this creator. We aggregate by `show_slug`
  // because the `podcasts` table stores one row per episode — the
  // shelf wants one tile per show. Ordered by most-recent episode.
  const { data: podcastEpisodes } = await supabase
    .from("podcasts")
    .select(
      "show_slug, show_title, show_description, thumbnail_url, published_at, is_published",
    )
    .eq("creator_id", profile.id)
    .eq("is_published", true)
    .not("show_slug", "is", null);
  const profilePodcasts: PodcastShelfShow[] = (() => {
    const byShow = new Map<string, PodcastShelfShow>();
    for (const ep of (podcastEpisodes ?? []) as Array<{
      show_slug: string;
      show_title: string | null;
      show_description: string | null;
      thumbnail_url: string | null;
      published_at: string | null;
    }>) {
      const cur = byShow.get(ep.show_slug);
      if (cur) {
        cur.episode_count += 1;
        if (
          ep.published_at &&
          (!cur.latest_episode_at || ep.published_at > cur.latest_episode_at)
        ) {
          cur.latest_episode_at = ep.published_at;
          cur.cover_url = ep.thumbnail_url ?? cur.cover_url;
        }
      } else {
        byShow.set(ep.show_slug, {
          show_slug: ep.show_slug,
          show_title: ep.show_title ?? ep.show_slug,
          show_description: ep.show_description,
          cover_url: ep.thumbnail_url,
          episode_count: 1,
          latest_episode_at: ep.published_at,
        });
      }
    }
    return Array.from(byShow.values()).sort((a, b) =>
      (b.latest_episode_at ?? "").localeCompare(a.latest_episode_at ?? ""),
    );
  })();

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
  // "moments" merges what used to be the legacy "posts" + "reels" sections —
  // both render as a single grid now so creators don't have to think about
  // which surface to drop content into.
  const numberedSections: string[] = ["moments"];
  if (artworkCount > 0) numberedSections.push("artwork");
  if (profileAlbums.length > 0) numberedSections.push("music");
  if (profilePodcasts.length > 0) numberedSections.push("podcasts");
  if (events.length > 0) numberedSections.push("events");
  if (channel) numberedSections.push("channel");
  if (ownedBusiness) numberedSections.push("business");
  if (deals.length > 0) numberedSections.push("deals");
  if (ownedResources.length > 0) numberedSections.push("resources");
  // Legacy alias — older render paths still call sectionIndex("posts")
  // and sectionIndex("reels"); both resolve to the merged moments index.
  const sectionIndex = (key: string) => {
    const legacy = key === "posts" || key === "reels" ? "moments" : key;
    return numberedSections.indexOf(legacy) + 1;
  };

  return (
    <div className="culture-surface animate-fade-in pb-24 min-h-dvh">
      {/* --- HERO (editorial masthead + avatar + role chips + stats + CTAs + socials) --- */}
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
        artworkCount={artworkCount}
        creatorStripeAccountId={creatorStripeAccountId}
        currentUserId={currentUser?.id ?? null}
        isOwner={isOwner}
        initialFollowing={initialFollowing}
        coverImage={coverImage}
      />

      {/* --- FEATURED MEDIA (creator pinned) --- */}
      {featuredMedia && (
        <section className="px-5 pt-5">
          <p
            className="c-kicker mb-2"
            style={{ fontSize: 10, opacity: 0.7, letterSpacing: "0.16em", color: "var(--ink-strong)" }}
          >
            § FEATURED
          </p>
          <CreatorFeaturedTile media={featuredMedia} aspect="16/10" />
        </section>
      )}


      {/* --- № 01 MOMENTS — merges posts + reels into one tab so creators
                              don't have to pick which surface to publish to.
                              Reels rail surfaces above the posts grid; both
                              count toward the same "ENTRIES" tally. */}
      <section className="pt-5 pb-2">
        <div className="px-5 mb-2.5 flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <EditorialNumber n={sectionIndex("moments")} size="lg" />
            <SectionKicker tone="muted">Moments</SectionKicker>
          </div>
          <span
            className="text-[10px] font-bold tracking-editorial-tight uppercase tabular-nums"
            style={{ color: "var(--ink-strong)", opacity: 0.5 }}
          >
            {(postCount ?? userPosts.length) + profileReels.length}{" "}
            {(postCount ?? userPosts.length) + profileReels.length === 1
              ? "ENTRY"
              : "ENTRIES"}
          </span>
        </div>
        <div className="px-5 mb-5">
          <div style={{ height: 2, background: "var(--rule-strong-c)" }} />
        </div>

        {(profileReels.length > 0 || isOwner) && (
          <div className="mb-5">
            <ReelsRail
              reels={profileReels}
              label=""
              showSeeAll={false}
              canPost={isOwner}
            />
          </div>
        )}

        <div className="px-5">
          <UserPostsGrid
            posts={userPosts}
            userId={currentUser?.id ?? null}
            userReactions={userReactions}
          />
        </div>
      </section>

      {/* --- ARTWORK (exhibits + gallery items / artworks / murals) ---
              Surfaces a creative-works portfolio for visual artists.
              Each tile links back to the museum surfaces (/culture/exhibits,
              /culture/gallery) where the full record lives. */}
      {artworkCount > 0 && (
        <>
          <IssueDivider />
          <section>
            <div className="px-5 mb-2.5 flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3 min-w-0">
                <EditorialNumber n={sectionIndex("artwork")} size="lg" />
                <SectionKicker tone="muted">Artwork</SectionKicker>
              </div>
              <span
                className="text-[10px] font-bold tracking-editorial-tight uppercase tabular-nums"
                style={{ color: "var(--ink-strong)", opacity: 0.5 }}
              >
                {artworkCount} {artworkCount === 1 ? "PIECE" : "PIECES"}
              </span>
            </div>
            <div className="px-5 mb-5">
              <div style={{ height: 2, background: "var(--rule-strong-c)" }} />
            </div>

            {profileExhibits.length > 0 && (
              <div className="px-5 mb-4">
                <p
                  className="c-kicker mb-2"
                  style={{ fontSize: 10, color: "var(--ink-mute)" }}
                >
                  § EXHIBITS
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {profileExhibits.map((ex) => (
                    <a
                      key={ex.id}
                      href={`/culture/exhibits/${ex.slug}`}
                      className="block press"
                    >
                      <div
                        className="relative overflow-hidden"
                        style={{
                          aspectRatio: "1/1",
                          background: "var(--ink-strong)",
                          border: "2px solid var(--rule-strong-c)",
                        }}
                      >
                        {ex.cover_image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={ex.cover_image_url}
                            alt={ex.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <span
                          className="absolute top-1.5 left-1.5 c-kicker"
                          style={{
                            fontSize: 8,
                            letterSpacing: "0.14em",
                            background: "rgba(0,0,0,0.55)",
                            color: "#fff",
                            padding: "2px 5px",
                            border: "1px solid rgba(255,255,255,0.18)",
                          }}
                        >
                          EXHIBIT
                        </span>
                      </div>
                      <p
                        className="c-card-t mt-2 line-clamp-1"
                        style={{ fontSize: 13, color: "var(--ink-strong)" }}
                      >
                        {ex.title}
                      </p>
                      {(ex.subtitle || ex.era) && (
                        <p
                          className="c-meta mt-0.5 line-clamp-1"
                          style={{
                            fontSize: 11,
                            color: "var(--ink-strong)",
                            opacity: 0.65,
                          }}
                        >
                          {[ex.subtitle, ex.era].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {profileArtworks.length > 0 && (
              <div className="px-5">
                <p
                  className="c-kicker mb-2"
                  style={{ fontSize: 10, color: "var(--ink-mute)" }}
                >
                  § PIECES
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {profileArtworks.map((art) => {
                    const cover = art.image_urls?.[0] ?? null;
                    return (
                      <a
                        key={art.id}
                        href={`/culture/gallery/${art.slug}`}
                        className="block press"
                      >
                        <div
                          className="relative overflow-hidden"
                          style={{
                            aspectRatio: "1/1",
                            background: "var(--ink-strong)",
                            border: "2px solid var(--rule-strong-c)",
                          }}
                        >
                          {cover && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={cover}
                              alt={art.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {art.item_type && (
                            <span
                              className="absolute bottom-1 right-1 c-kicker"
                              style={{
                                fontSize: 8,
                                background: "rgba(0,0,0,0.55)",
                                color: "#fff",
                                padding: "1px 4px",
                              }}
                            >
                              {art.item_type.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p
                          className="c-meta mt-1 line-clamp-1"
                          style={{
                            fontSize: 10,
                            color: "var(--ink-strong)",
                          }}
                        >
                          {art.title}
                          {art.year_created ? ` · ${art.year_created}` : ""}
                        </p>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {/* --- MUSIC (albums / EPs / singles) --- */}
      {profileAlbums.length > 0 && (
        <>
          <IssueDivider />
          <section>
            <div className="px-5 mb-2.5 flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3 min-w-0">
                <EditorialNumber n={sectionIndex("music")} size="lg" />
                <SectionKicker tone="muted">Music</SectionKicker>
              </div>
              <span
                className="text-[10px] font-bold tracking-editorial-tight uppercase tabular-nums"
                style={{ color: "var(--ink-strong)", opacity: 0.5 }}
              >
                {profileAlbums.length} {profileAlbums.length === 1 ? "RELEASE" : "RELEASES"}
              </span>
            </div>
            <div className="px-5 mb-5">
              <div style={{ height: 2, background: "var(--rule-strong-c)" }} />
            </div>
            <div className="px-5">
              <ProfileMusicShelf albums={profileAlbums} />
            </div>
          </section>
        </>
      )}

      {/* --- PODCASTS --- */}
      {profilePodcasts.length > 0 && (
        <>
          <IssueDivider />
          <section>
            <div className="px-5 mb-2.5 flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3 min-w-0">
                <EditorialNumber n={sectionIndex("podcasts")} size="lg" />
                <SectionKicker tone="muted">Podcasts</SectionKicker>
              </div>
              <span
                className="text-[10px] font-bold tracking-editorial-tight uppercase tabular-nums"
                style={{ color: "var(--ink-strong)", opacity: 0.5 }}
              >
                {profilePodcasts.length}{" "}
                {profilePodcasts.length === 1 ? "SHOW" : "SHOWS"}
              </span>
            </div>
            <div className="px-5 mb-5">
              <div style={{ height: 2, background: "var(--rule-strong-c)" }} />
            </div>
            <div className="px-5">
              <ProfilePodcastShelf shows={profilePodcasts} />
            </div>
          </section>
        </>
      )}

      {/* --- EVENTS --- */}
      {events.length > 0 && (
        <>
          <IssueDivider />
          <section>
            <div className="px-5 mb-2.5 flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3 min-w-0">
                <EditorialNumber n={sectionIndex("events")} size="lg" />
                <SectionKicker tone="muted">Upcoming Events</SectionKicker>
              </div>
              <span className="text-[10px] font-bold tracking-editorial-tight uppercase tabular-nums" style={{ color: "var(--ink-strong)", opacity: 0.5 }}>
                {events.length}
              </span>
            </div>
            <div className="px-5 mb-5">
              <div style={{ height: 2, background: "var(--rule-strong-c)" }} />
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
            <div className="px-5 mb-2.5 flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <EditorialNumber n={sectionIndex("channel")} size="lg" />
                <SectionKicker tone="muted">Channel</SectionKicker>
              </div>
              {channelVideos.length > 0 && (
                <span className="text-[10px] font-bold tracking-editorial-tight uppercase tabular-nums" style={{ color: "var(--ink-strong)", opacity: 0.5 }}>
                  {channelVideos.length} {channelVideos.length === 1 ? "VIDEO" : "VIDEOS"}
                </span>
              )}
            </div>
            <div className="px-5 mb-5">
              <div style={{ height: 2, background: "var(--rule-strong-c)" }} />
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
            <div className="px-5 mb-2.5 flex items-baseline gap-3">
              <EditorialNumber n={sectionIndex("business")} size="lg" />
              <SectionKicker tone="muted">Business</SectionKicker>
            </div>
            <div className="px-5 mb-5">
              <div style={{ height: 2, background: "var(--rule-strong-c)" }} />
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
            <div className="px-5 mb-2.5 flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3 min-w-0">
                <EditorialNumber n={sectionIndex("deals")} size="lg" />
                <SectionKicker tone="muted">Deals &amp; Coupons</SectionKicker>
              </div>
              <span className="text-[10px] font-bold tracking-editorial-tight uppercase tabular-nums" style={{ color: "var(--ink-strong)", opacity: 0.5 }}>
                {deals.length}
              </span>
            </div>
            <div className="px-5 mb-5">
              <div style={{ height: 2, background: "var(--rule-strong-c)" }} />
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
            <div className="px-5 mb-2.5 flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3 min-w-0">
                <EditorialNumber n={sectionIndex("resources")} size="lg" />
                <SectionKicker tone="muted">Resources</SectionKicker>
              </div>
              <span className="text-[10px] font-bold tracking-editorial-tight uppercase tabular-nums" style={{ color: "var(--ink-strong)", opacity: 0.5 }}>
                {ownedResources.length}
              </span>
            </div>
            <div className="px-5 mb-5">
              <div style={{ height: 2, background: "var(--rule-strong-c)" }} />
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
            <div className="mb-2.5 flex items-baseline gap-3">
              <SectionKicker tone="gold">Plates</SectionKicker>
              <span className="block h-px flex-1" style={{ background: "var(--rule-strong-c)" }} />
              <span className="text-[10px] font-bold tracking-editorial-tight uppercase flex items-center gap-1.5 tabular-nums" style={{ color: "var(--ink-strong)", opacity: 0.5 }}>
                <Icon name="photo" size={12} className="text-gold" />
                {gallery.length} {gallery.length === 1 ? "PLATE" : "PLATES"}
              </span>
            </div>
            <div className="mb-5">
              <div style={{ height: 2, background: "var(--rule-strong-c)" }} />
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
      <div className="px-6 pb-4 pt-1">
        <div
          className="flex items-center justify-between"
          style={{
            padding: "10px 14px",
            background: "var(--paper-warm)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <span className="text-[10px] font-bold tracking-editorial uppercase flex items-center gap-2" style={{ color: "var(--ink-strong)" }}>
            <Icon name={roleIcon} size={12} className="text-gold" />
            {roleLabel}
          </span>
          <span className="text-[10px] font-bold tracking-editorial uppercase tabular-nums" style={{ color: "var(--gold-c)" }}>
            @{profile.handle}
          </span>
        </div>
      </div>
    </div>
  );
}
