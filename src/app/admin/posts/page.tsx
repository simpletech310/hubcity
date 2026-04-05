import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/types/database";
import AdminPostActions from "./AdminPostActions";

export default async function AdminPostsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*, author:profiles!posts_author_id_fkey(id, display_name, role)")
    .order("created_at", { ascending: false });

  const posts = (data as Post[]) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-1">Posts</h1>
          <p className="text-sm text-txt-secondary">{posts.length} total posts</p>
        </div>
      </div>

      <div className="space-y-2">
        {posts.map((post) => (
          <Card key={post.id} hover>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold truncate">
                    {post.author?.display_name || "Unknown"}
                  </h3>
                  {post.is_pinned && <Badge label="Pinned" variant="gold" />}
                  {post.media_type === "image" && <Badge label="Photo" variant="cyan" />}
                  {post.media_type === "video" && (
                    <Badge
                      label={post.video_status === "ready" ? "Video" : "Processing"}
                      variant={post.video_status === "ready" ? "coral" : "purple"}
                    />
                  )}
                </div>
                <p className="text-xs text-txt-secondary line-clamp-2 mb-1">
                  {post.body}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-txt-secondary">
                    {new Date(post.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  {post.reaction_counts && Object.keys(post.reaction_counts).length > 0 && (
                    <span className="text-[10px] text-txt-secondary">
                      {Object.values(post.reaction_counts).reduce((a, b) => a + (b || 0), 0)} reactions
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  label={post.is_published ? "Published" : "Hidden"}
                  variant={post.is_published ? "emerald" : "gold"}
                />
                <AdminPostActions post={post} />
              </div>
            </div>
          </Card>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-sm text-txt-secondary">No posts yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
