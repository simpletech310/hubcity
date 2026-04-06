import { createClient } from "@/lib/supabase/server";
import CultureHero from "@/components/culture/CultureHero";
import MuseumNav from "@/components/culture/MuseumNav";
import Card from "@/components/ui/Card";
import Link from "next/link";

export const metadata = {
  title: "Discussions | The Compton Museum | Hub City",
  description: "Community conversations about Compton's culture, history, and heritage.",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function DiscussionsPage() {
  const supabase = await createClient();

  // Fetch posts tagged with museum topics or culture hashtags
  const { data: discussions } = await supabase
    .from("posts")
    .select("id, body, image_url, comment_count, reaction_counts, created_at, museum_topic, hashtags, author:profiles!posts_author_id_fkey(id, display_name, avatar_url, role)")
    .eq("is_published", true)
    .or("museum_topic.not.is.null,hashtags.cs.{culture},hashtags.cs.{compton-history},hashtags.cs.{museum}")
    .order("created_at", { ascending: false })
    .limit(30);

  const posts = discussions ?? [];

  return (
    <div className="space-y-6 pb-20">
      <CultureHero title="Discussions" subtitle="Community conversations about Compton's culture and heritage." />

      <div className="px-5">
        <MuseumNav />
      </div>

      {/* Discussion Prompts */}
      <section className="px-5">
        <div className="rounded-2xl bg-gold/5 border border-gold/15 p-4 mb-4">
          <p className="text-xs font-semibold text-gold uppercase tracking-wider mb-2">
            Join the Conversation
          </p>
          <p className="text-sm text-txt-secondary leading-relaxed">
            Share your Compton stories, memories, and cultural knowledge with the community. Use <span className="text-gold font-semibold">#culture</span> or <span className="text-gold font-semibold">#compton-history</span> in your Pulse posts.
          </p>
          <Link
            href="/pulse"
            className="inline-block mt-3 px-4 py-2 bg-gold text-midnight rounded-xl text-xs font-bold hover:bg-gold/90 transition-colors"
          >
            Post to Pulse
          </Link>
        </div>
      </section>

      {/* Discussion Posts */}
      <section className="px-5">
        {posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((post) => {
              const authorRaw = post.author as unknown;
              const author = (Array.isArray(authorRaw) ? authorRaw[0] : authorRaw) as { id: string; display_name: string; avatar_url: string | null; role: string } | null;
              const reactions = (post.reaction_counts ?? {}) as Record<string, number>;
              const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);

              return (
                <Link key={post.id} href={`/pulse/post/${post.id}`}>
                  <Card hover padding>
                    <div className="flex items-start gap-3">
                      {/* Author avatar */}
                      <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
                        {author?.avatar_url ? (
                          <img src={author.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-txt-secondary">
                            {author?.display_name?.[0]?.toUpperCase() ?? "?"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-semibold text-white truncate">
                            {author?.display_name ?? "Community Member"}
                          </span>
                          <span className="text-[10px] text-txt-secondary">
                            {timeAgo(post.created_at)}
                          </span>
                        </div>
                        {post.museum_topic && (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-gold/10 text-gold text-[10px] font-semibold mb-1.5">
                            {post.museum_topic}
                          </span>
                        )}
                        <p className="text-[12px] text-txt-secondary leading-relaxed line-clamp-3">
                          {post.body}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {totalReactions > 0 && (
                            <span className="text-[10px] text-txt-secondary">
                              {totalReactions} reaction{totalReactions !== 1 ? "s" : ""}
                            </span>
                          )}
                          {post.comment_count > 0 && (
                            <span className="text-[10px] text-txt-secondary">
                              {post.comment_count} comment{post.comment_count !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="text-5xl block mb-3">💬</span>
            <p className="text-sm font-medium mb-1">No discussions yet</p>
            <p className="text-xs text-txt-secondary mb-4">
              Be the first to share a cultural story or memory.
            </p>
            <Link
              href="/pulse"
              className="inline-block px-5 py-2.5 bg-gradient-to-r from-gold to-gold-light text-midnight rounded-xl text-xs font-bold"
            >
              Start a Discussion
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
