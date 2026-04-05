import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { ROLE_BADGE_MAP } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import type { Post, Channel } from "@/types/database";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("handle", handle)
    .single();

  return {
    title: profile ? `${profile.display_name} — Hub City` : "Profile — Hub City",
  };
}

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

  // Fetch their posts, channel, and stats in parallel
  const [
    { data: posts },
    { data: channels },
    { count: postCount },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("*, author:profiles(id, display_name, avatar_url, role, verification_status)")
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
  ]);

  const badge = profile.role ? ROLE_BADGE_MAP[profile.role] : null;
  const channel = channels?.[0] as Channel | undefined;
  const userPosts = (posts ?? []) as Post[];

  const roleColors: Record<string, string> = {
    city_official: "#F2A900",
    business_owner: "#3B82F6",
    community_leader: "#22C55E",
    admin: "#8B5CF6",
    content_creator: "#EC4899",
  };
  const accentColor = profile.role ? (roleColors[profile.role] || "#F2A900") : "#F2A900";

  const roleIcons: Record<string, string> = {
    city_official: "🏛️",
    business_owner: "🏪",
    community_leader: "🌿",
    admin: "⚙️",
    content_creator: "🎬",
  };
  const roleIcon = profile.role ? (roleIcons[profile.role] || "💬") : "💬";

  return (
    <div className="animate-fade-in pb-24">
      {/* ─── Cover / Header ─── */}
      <div className="relative">
        {/* Banner gradient */}
        <div
          className="h-[160px] relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${accentColor}30 0%, var(--color-midnight) 50%, ${accentColor}15 100%)`,
          }}
        >
          {channel?.banner_url && (
            <img
              src={channel.banner_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-midnight" />
        </div>

        {/* Avatar + name overlay */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-5">
          <div className="flex items-end gap-4">
            <div
              className="w-[88px] h-[88px] rounded-2xl overflow-hidden border-4 shrink-0"
              style={{ borderColor: `${accentColor}40`, background: "var(--color-royal)" }}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-2xl font-bold"
                  style={{ color: accentColor }}
                >
                  {profile.display_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for avatar overlap */}
      <div className="h-14" />

      {/* ─── Profile Info ─── */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-heading font-bold text-xl">{profile.display_name}</h1>
          {profile.verification_status === "verified" && (
            <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `${accentColor}25` }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill={accentColor}>
                <path d="M6 0L7.5 2.5L10.5 1.5L10 4.5L12 6L10 7.5L10.5 10.5L7.5 9.5L6 12L4.5 9.5L1.5 10.5L2 7.5L0 6L2 4.5L1.5 1.5L4.5 2.5Z" />
              </svg>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-white/40">@{profile.handle}</span>
          {badge && <Badge label={badge.label} variant={badge.variant} />}
          {profile.district && (
            <span className="text-[10px] font-semibold text-white/30 bg-white/[0.06] rounded-full px-2 py-0.5">
              District {profile.district}
            </span>
          )}
        </div>

        {profile.bio && (
          <p className="text-sm text-white/60 leading-relaxed mb-4">{profile.bio}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-5 mb-4">
          <div className="text-center">
            <p className="font-heading font-bold text-lg">{postCount ?? 0}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Posts</p>
          </div>
          {channel && (
            <div className="text-center">
              <p className="font-heading font-bold text-lg">{channel.follower_count?.toLocaleString()}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Followers</p>
            </div>
          )}
          <div className="text-center">
            <p className="font-heading font-bold text-lg">
              {userPosts.reduce((sum, p) => sum + (p.like_count ?? 0), 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Likes</p>
          </div>
        </div>

        {/* Channel link */}
        {channel && (
          <Link
            href={`/live/channel/${channel.slug}`}
            className="flex items-center gap-3 bg-royal border border-border-subtle rounded-xl p-3 press hover:border-white/10 transition-colors mb-4"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
              {channel.avatar_url ? (
                <img src={channel.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/[0.06] flex items-center justify-center text-lg">📺</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate">{channel.name}</p>
              <p className="text-[11px] text-white/40">
                {channel.follower_count?.toLocaleString()} followers · {channel.type}
              </p>
            </div>
            <span
              className="text-[11px] font-bold px-3 py-1.5 rounded-full shrink-0"
              style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}25` }}
            >
              View Channel
            </span>
          </Link>
        )}
      </div>

      {/* ─── Posts Feed ─── */}
      <div className="px-5">
        <h2 className="font-heading font-semibold text-sm text-white/50 uppercase tracking-wider mb-3">
          {roleIcon} Recent Posts
        </h2>

        {userPosts.length === 0 ? (
          <div className="text-center py-12 text-white/30 text-sm">
            No posts yet
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {userPosts.map((post) => {
              const totalReactions = post.reaction_counts
                ? Object.values(post.reaction_counts).reduce((sum, n) => sum + ((n as number) ?? 0), 0)
                : 0;

              return (
                <Card key={post.id} className="relative overflow-hidden">
                  {/* Top accent line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] opacity-40"
                    style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
                  />

                  <p className="text-[13px] leading-relaxed mb-2.5">{post.body}</p>

                  {post.image_url && (
                    <div className="relative h-[180px] rounded-xl overflow-hidden mb-2.5">
                      <Image src={post.image_url} alt="" fill className="object-cover" />
                    </div>
                  )}

                  {/* Hashtags */}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {post.hashtags.map((tag: string) => (
                        <span key={tag} className="text-[11px] font-medium" style={{ color: accentColor }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.04]">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-white/40 flex items-center gap-1">
                        ❤️ {totalReactions}
                      </span>
                      <span className="text-xs text-white/40 flex items-center gap-1">
                        💬 {post.comment_count ?? 0}
                      </span>
                    </div>
                    <span className="text-[11px] text-white/25">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
