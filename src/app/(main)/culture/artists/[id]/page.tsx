import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CultureHero from "@/components/culture/CultureHero";
import Card from "@/components/ui/Card";
import Link from "next/link";
import Icon from "@/components/ui/Icon";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: artist } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", id)
    .eq("is_creator", true)
    .single();

  return {
    title: artist
      ? `${artist.display_name} | Compton Artists | Culture`
      : "Artist | Culture",
  };
}

export default async function ArtistProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: artist } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("is_creator", true)
    .single();

  if (!artist) notFound();

  const [postsRes, videosRes] = await Promise.all([
    supabase
      .from("posts")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("channel_videos")
      .select("*")
      .eq("creator_id", id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const posts = postsRes.data ?? [];
  const videos = videosRes.data ?? [];

  return (
    <div className="culture-surface min-h-dvh space-y-8 pb-20">
      {/* Artist Header */}
      <div className="px-5 pt-6">
        <span className="c-kicker block mb-2">Artist</span>
        <div className="flex items-start gap-5">
          {artist.avatar_url ? (
            <img
              src={artist.avatar_url}
              alt=""
              className="w-20 h-20 md:w-28 md:h-28 object-cover c-frame-strong"
            />
          ) : (
            <div className="w-20 h-20 md:w-28 md:h-28 c-frame-strong flex items-center justify-center" style={{ background: "var(--paper-soft)" }}>
              <span className="text-3xl font-bold" style={{ color: "var(--gold-c)" }}>
                {(artist.display_name || "?")[0]}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="c-hero" style={{ color: "var(--ink-strong)" }}>
              {artist.display_name}
            </h1>
            {artist.bio && (
              <p className="c-serif-it text-[14px] mt-2 line-clamp-4">
                {artist.bio}
              </p>
            )}
            {artist.channel_slug && (
              <Link
                href={`/channels/${artist.channel_slug}`}
                className="inline-block mt-3 text-sm font-semibold hover:underline"
                style={{ color: "var(--gold-c)" }}
              >
                View Channel &rarr;
              </Link>
            )}
          </div>
        </div>
        <div style={{ height: 3, background: "var(--rule-strong-c, var(--ink-strong))", marginTop: 20 }} />
      </div>

      {/* Content Gallery */}
      {posts.length > 0 && (
        <section className="px-5">
          <h2 className="c-card-t mb-4" style={{ color: "var(--ink-strong)" }}>
            Posts
          </h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            {posts.map((post) => (
              <Card key={post.id} hover padding>
                <p className="c-body line-clamp-3" style={{ fontSize: 13, color: "var(--ink-strong)" }}>
                  {post.body || "..."}
                </p>
                <span className="c-meta mt-2 block" style={{ fontSize: 11 }}>
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </Card>
            ))}
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section className="px-5">
          <h2 className="c-card-t mb-4" style={{ color: "var(--ink-strong)" }}>
            Videos
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {videos.map((video) => (
              <Card key={video.id} hover padding={false}>
                <div
                  className="aspect-video flex items-center justify-center"
                  style={{ background: "var(--paper-soft)", borderBottom: "2px solid var(--rule-strong-c)" }}
                >
                  <span style={{ color: "var(--ink-strong)", opacity: 0.4 }}><Icon name="film" size={28} /></span>
                </div>
                <div className="p-4">
                  <h3 className="c-card-t truncate" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
                    {video.title}
                  </h3>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {posts.length === 0 && videos.length === 0 && (
        <div
          className="mx-5 text-center py-12 px-6"
          style={{
            background: "var(--paper)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <span className="mb-3 block" style={{ color: "var(--ink-strong)" }}><Icon name="music" size={28} /></span>
          <p className="c-body" style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.7 }}>
            No content from this artist yet.
          </p>
        </div>
      )}
    </div>
  );
}
