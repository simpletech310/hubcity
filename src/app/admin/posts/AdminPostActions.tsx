"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { Post } from "@/types/database";

interface AdminPostActionsProps {
  post: Post;
}

export default function AdminPostActions({ post }: AdminPostActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const togglePublished = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("posts")
      .update({ is_published: !post.is_published })
      .eq("id", post.id);
    router.refresh();
    setLoading(false);
  };

  const togglePinned = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("posts")
      .update({ is_pinned: !post.is_pinned })
      .eq("id", post.id);
    router.refresh();
    setLoading(false);
  };

  const deletePost = async () => {
    if (!confirm("Delete this post permanently?")) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("posts").delete().eq("id", post.id);
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePinned}
        loading={loading}
        title={post.is_pinned ? "Unpin" : "Pin"}
      >
        {post.is_pinned ? "📌" : "📍"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePublished}
        loading={loading}
      >
        {post.is_published ? "Hide" : "Show"}
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={deletePost}
        loading={loading}
      >
        Delete
      </Button>
    </div>
  );
}
