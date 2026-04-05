import Link from "next/link";

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type Post = {
  id: string;
  body: string | null;
  created_at: string;
  story_title?: string;
  story_image_url?: string;
  read_time_minutes?: number;
};

interface StoryCardProps {
  post: Post;
  author?: Profile;
}

export default function StoryCard({ post, author }: StoryCardProps) {
  const headline =
    post.story_title || (post.body ? post.body.slice(0, 80) + "..." : "Untitled");

  return (
    <Link
      href={`/culture/stories/${post.id}`}
      className="group flex flex-col md:flex-row min-w-[300px] bg-card rounded-2xl border border-border-subtle overflow-hidden card-glow transition-all duration-300 hover:border-gold/20"
    >
      {/* Hero image */}
      <div className="md:w-48 lg:w-56 shrink-0 aspect-[16/9] md:aspect-auto relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-gold/20">
        {post.story_image_url ? (
          <img
            src={post.story_image_url}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl opacity-40">📖</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 md:p-5 flex flex-col justify-between flex-1 min-w-0">
        <div>
          <h3 className="font-display text-lg text-text-primary leading-snug line-clamp-2">
            {headline}
          </h3>
        </div>

        <div className="flex items-center gap-3 mt-3">
          {author && (
            <div className="flex items-center gap-2 min-w-0">
              {author.avatar_url ? (
                <img
                  src={author.avatar_url}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover border border-border-subtle"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-[10px] text-gold font-bold">
                  {(author.display_name || "?")[0]}
                </div>
              )}
              <span className="text-xs text-text-secondary truncate">
                {author.display_name}
              </span>
            </div>
          )}
          {post.read_time_minutes && (
            <span className="shrink-0 text-[11px] text-warm-gray px-2 py-0.5 rounded-full bg-white/5 border border-border-subtle">
              {post.read_time_minutes} min read
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export type { Post, Profile };
