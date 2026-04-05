import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CultureHero from "@/components/culture/CultureHero";
import Card from "@/components/ui/Card";
import Link from "next/link";

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
      ? `${artist.display_name} | Compton Artists | Hub City`
      : "Artist | Hub City",
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
    <div className="space-y-8 pb-20">
      {/* Artist Header */}
      <div className="px-5 pt-6">
        <div className="flex items-start gap-5">
          {artist.avatar_url ? (
            <img
              src={artist.avatar_url}
              alt=""
              className="w-20 h-20 md:w-28 md:h-28 rounded-2xl object-cover border-2 border-gold/30"
            />
          ) : (
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-gold/10 border-2 border-gold/30 flex items-center justify-center">
              <span className="text-3xl text-gold font-bold">
                {(artist.display_name || "?")[0]}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl md:text-4xl text-text-primary">
              {artist.display_name}
            </h1>
            {artist.bio && (
              <p className="text-text-secondary text-sm mt-2 line-clamp-4">
                {artist.bio}
              </p>
            )}
            {artist.channel_slug && (
              <Link
                href={`/channels/${artist.channel_slug}`}
                className="inline-block mt-3 text-gold text-sm font-semibold hover:underline"
              >
                View Channel &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content Gallery */}
      {posts.length > 0 && (
        <section className="px-5">
          <h2 className="font-heading font-bold text-lg text-text-primary mb-4">
            Posts
          </h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            {posts.map((post) => (
              <Card key={post.id} hover padding>
                <p className="text-sm text-text-secondary line-clamp-3">
                  {post.body || "..."}
                </p>
                <span className="text-[11px] text-warm-gray mt-2 block">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </Card>
            ))}
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section className="px-5">
          <h2 className="font-heading font-bold text-lg text-text-primary mb-4">
            Videos
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {videos.map((video) => (
              <Card key={video.id} hover padding={false}>
                <div className="aspect-video bg-black/40 flex items-center justify-center">
                  <span className="text-3xl opacity-40">🎬</span>
                </div>
                <div className="p-4">
                  <h3 className="font-heading font-bold text-sm text-text-primary truncate">
                    {video.title}
                  </h3>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {posts.length === 0 && videos.length === 0 && (
        <div className="px-5 text-center py-12">
          <span className="text-4xl mb-3 block">🎤</span>
          <p className="text-text-secondary text-sm">
            No content from this artist yet.
          </p>
        </div>
      )}
    </div>
  );
}
