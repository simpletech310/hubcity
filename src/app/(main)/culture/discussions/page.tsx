import { createClient } from "@/lib/supabase/server";
import CultureHero from "@/components/culture/CultureHero";
import MuseumNav from "@/components/culture/MuseumNav";
import Card from "@/components/ui/Card";
import Link from "next/link";
import Icon from "@/components/ui/Icon";

export const metadata = {
  title: "Discussions | The Compton Museum | Culture",
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
      <CultureHero title="Discussions" subtitle="Community conversations about Compton's culture and heritage." imageUrl="/images/art/IMG_2790.jpg" />

      <div
        className="sticky top-0 z-30"
        style={{
          background: "var(--paper)",
          borderBottom: "2px solid var(--rule-strong-c)",
        }}
      >
        <div className="px-5">
          <MuseumNav />
        </div>
      </div>

      {/* Discussion Prompts */}
      <section className="px-5">
        <div
          className="p-4 mb-4"
          style={{
            background: "var(--paper-warm)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <p className="c-kicker mb-2" style={{ color: "var(--ink-strong)" }}>
            Join the Conversation
          </p>
          <p className="c-body leading-relaxed" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
            Share your Compton stories, memories, and cultural knowledge with the community. Use <span className="c-serif-it" style={{ color: "var(--ink-strong)", fontWeight: 700 }}>#culture</span> or <span className="c-serif-it" style={{ color: "var(--ink-strong)", fontWeight: 700 }}>#compton-history</span> in your Pulse posts.
          </p>
          <Link href="/pulse" className="c-btn c-btn-primary c-btn-sm inline-block mt-3">
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
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                        style={{
                          background: "var(--paper-soft)",
                          border: "2px solid var(--rule-strong-c)",
                        }}
                      >
                        {author?.avatar_url ? (
                          <img src={author.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="c-card-t" style={{ fontSize: 12, color: "var(--ink-strong)" }}>
                            {author?.display_name?.[0]?.toUpperCase() ?? "?"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="c-card-t truncate" style={{ fontSize: 12, color: "var(--ink-strong)" }}>
                            {author?.display_name ?? "Community Member"}
                          </span>
                          <span className="c-meta" style={{ fontSize: 10 }}>
                            {timeAgo(post.created_at)}
                          </span>
                        </div>
                        {post.museum_topic && (
                          <span className="c-badge-gold inline-block mb-1.5">
                            {post.museum_topic}
                          </span>
                        )}
                        <p className="c-body leading-relaxed line-clamp-3" style={{ fontSize: 12, color: "var(--ink-strong)" }}>
                          {post.body}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {totalReactions > 0 && (
                            <span className="c-meta" style={{ fontSize: 10 }}>
                              {totalReactions} reaction{totalReactions !== 1 ? "s" : ""}
                            </span>
                          )}
                          {post.comment_count > 0 && (
                            <span className="c-meta" style={{ fontSize: 10 }}>
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
          <div
            className="text-center py-16 px-6"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <span className="block mb-3" style={{ color: "var(--ink-strong)" }}><Icon name="chat" size={28} /></span>
            <p className="c-card-t mb-1" style={{ fontSize: 14, color: "var(--ink-strong)" }}>No discussions yet</p>
            <p className="c-body mb-4" style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.7 }}>
              Be the first to share a cultural story or memory.
            </p>
            <Link href="/pulse" className="c-btn c-btn-primary c-btn-sm">
              Start a Discussion
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
