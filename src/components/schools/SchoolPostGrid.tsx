"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";

interface SchoolPost {
  id: string;
  body: string;
  image_url: string | null;
  media_type: string | null;
  mux_playback_id: string | null;
  video_status: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  author: Array<{
    id: string;
    display_name: string;
    avatar_url: string | null;
  }> | null;
}

interface SchoolPostGridProps {
  schoolSlug: string;
  schoolName: string;
  schoolColor: string;
  isSchoolAdmin: boolean;
}

export default function SchoolPostGrid({
  schoolSlug,
  schoolName,
  schoolColor,
  isSchoolAdmin,
}: SchoolPostGridProps) {
  const [posts, setPosts] = useState<SchoolPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<SchoolPost | null>(null);

  // Composer state
  const [showComposer, setShowComposer] = useState(false);
  const [composerBody, setComposerBody] = useState("");
  const [composerImage, setComposerImage] = useState("");
  const [posting, setPosting] = useState(false);

  const fetchPosts = useCallback(async (p: number, append = false) => {
    try {
      const res = await fetch(`/api/schools/${schoolSlug}/posts?page=${p}&limit=24`);
      if (!res.ok) return;
      const data = await res.json();
      setPosts((prev) => append ? [...prev, ...data.posts] : data.posts);
      setTotal(data.total);
      setHasMore(data.has_more);
      setPage(p);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [schoolSlug]);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const handlePost = async () => {
    if ((!composerBody.trim() && !composerImage.trim()) || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/schools/${schoolSlug}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: composerBody.trim(),
          image_url: composerImage.trim() || null,
        }),
      });
      if (res.ok) {
        setComposerBody("");
        setComposerImage("");
        setShowComposer(false);
        fetchPosts(1);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to post");
      }
    } catch {
      alert("Failed to post");
    }
    setPosting(false);
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  const handleImageUpload = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Only JPEG, PNG, GIF, and WebP images are allowed");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert("Image must be under 10MB");
      return;
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const ext = file.name.split(".").pop();
    const path = `school-posts/${schoolSlug}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("media")
      .upload(path, file, { upsert: true });

    if (error) {
      alert("Upload failed");
      return;
    }

    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
    setComposerImage(urlData.publicUrl);
  };

  if (loading) {
    return (
      <section className="mb-8">
        <div className="divider-subtle mb-6" />
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ background: schoolColor }} />
          <h2 className="font-heading font-bold text-base">School Posts</h2>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="divider-subtle mb-6" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: schoolColor }} />
          <h2 className="font-heading font-bold text-base">School Posts</h2>
          {total > 0 && (
            <span className="text-[10px] text-white/30 font-medium">{total}</span>
          )}
        </div>
        {isSchoolAdmin && (
          <button
            onClick={() => setShowComposer(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold press transition-colors text-midnight"
            style={{ background: schoolColor }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 2v8M2 6h8" />
            </svg>
            New Post
          </button>
        )}
      </div>

      {/* Composer Modal */}
      {showComposer && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowComposer(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-deep border border-border-subtle rounded-2xl p-5 max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-sm">Post to {schoolName}</h3>
              <button onClick={() => setShowComposer(false)} className="text-white/40 hover:text-white">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>

            <textarea
              value={composerBody}
              onChange={(e) => setComposerBody(e.target.value)}
              placeholder="Share an update with the community..."
              className="w-full bg-white/5 border border-border-subtle rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 min-h-[100px] resize-none leading-relaxed mb-3"
              autoFocus
            />

            {/* Image preview */}
            {composerImage && (
              <div className="relative rounded-xl overflow-hidden mb-3">
                <Image
                  src={composerImage}
                  alt="Upload preview"
                  width={400}
                  height={300}
                  className="w-full h-auto max-h-[200px] object-cover"
                />
                <button
                  onClick={() => setComposerImage("")}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 3l6 6M9 3l-6 6" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-[11px] text-white/50 font-medium cursor-pointer hover:bg-white/10 transition-colors">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="10" height="10" rx="2" />
                  <circle cx="5" cy="5" r="1" />
                  <path d="M12 9l-3-3-7 7" />
                </svg>
                Add Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
              </label>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowComposer(false)}
                  className="px-3 py-2 rounded-lg bg-white/5 text-txt-secondary text-[11px] font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePost}
                  disabled={posting || (!composerBody.trim() && !composerImage)}
                  className="px-4 py-2 rounded-lg text-[11px] font-bold text-midnight disabled:opacity-40"
                  style={{ background: schoolColor }}
                >
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Post Grid — Instagram style */}
      {posts.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-[2px] rounded-xl overflow-hidden">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="relative aspect-square bg-card overflow-hidden group"
              >
                {post.image_url ? (
                  <Image
                    src={post.image_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 33vw, 200px"
                  />
                ) : (
                  /* Text-only post — show snippet */
                  <div className="w-full h-full flex items-center justify-center p-2" style={{ background: `${schoolColor}08` }}>
                    <p className="text-[10px] text-white/50 leading-snug line-clamp-5 text-center">
                      {post.body}
                    </p>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <span className="flex items-center gap-1 text-white text-[11px] font-bold">
                    <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    {post.like_count}
                  </span>
                  <span className="flex items-center gap-1 text-white text-[11px] font-bold">
                    <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    {post.comment_count}
                  </span>
                </div>

                {/* Video indicator */}
                {post.media_type === "video" && post.video_status === "ready" && (
                  <div className="absolute top-1.5 right-1.5">
                    <svg width="14" height="14" fill="white" viewBox="0 0 24 24" className="drop-shadow-md">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <button
              onClick={() => fetchPosts(page + 1, true)}
              className="w-full mt-3 py-2.5 rounded-xl bg-white/5 text-[11px] font-semibold text-white/40 hover:text-white/60 transition-colors"
            >
              Load More Posts
            </button>
          )}
        </>
      ) : (
        <div className="bg-card rounded-2xl border border-border-subtle p-8 text-center">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
            style={{ background: `${schoolColor}10` }}
          >
            <svg width="24" height="24" fill="none" stroke={schoolColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <p className="text-[13px] text-white/40 font-medium">No posts yet</p>
          <p className="text-[11px] text-white/25 mt-1">
            {isSchoolAdmin
              ? "Share updates, photos, and news with the community"
              : `${schoolName} hasn't posted yet. Check back soon!`}
          </p>
          {isSchoolAdmin && (
            <button
              onClick={() => setShowComposer(true)}
              className="mt-4 px-4 py-2 rounded-full text-[11px] font-bold text-midnight"
              style={{ background: schoolColor }}
            >
              Create First Post
            </button>
          )}
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setSelectedPost(null)} />
          <div className="fixed inset-x-3 top-1/2 -translate-y-1/2 z-50 bg-deep border border-border-subtle rounded-2xl overflow-hidden max-w-lg mx-auto max-h-[85vh] flex flex-col">
            {/* Image */}
            {selectedPost.image_url && (
              <div className="relative w-full aspect-square bg-black shrink-0">
                <Image
                  src={selectedPost.image_url}
                  alt=""
                  fill
                  className="object-contain"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-4 overflow-y-auto">
              {/* Author */}
              <div className="flex items-center gap-2.5 mb-3">
                {(() => {
                  const author = Array.isArray(selectedPost.author)
                    ? selectedPost.author[0]
                    : null;
                  const initials = author?.display_name
                    ?.split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "?";
                  return (
                    <>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-midnight shrink-0 overflow-hidden"
                        style={{ background: schoolColor }}
                      >
                        {author?.avatar_url ? (
                          <Image
                            src={author.avatar_url}
                            alt={author.display_name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold truncate">
                          {author?.display_name ?? schoolName}
                        </p>
                        <p className="text-[10px] text-white/30">
                          {new Date(selectedPost.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </>
                  );
                })()}

                <button
                  onClick={() => setSelectedPost(null)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 4l6 6M10 4l-6 6" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              {selectedPost.body && (
                <p className="text-[13px] text-white/70 leading-relaxed whitespace-pre-wrap">
                  {selectedPost.body}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
                <span className="flex items-center gap-1.5 text-[11px] text-white/30">
                  <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  {selectedPost.like_count} likes
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-white/30">
                  <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  {selectedPost.comment_count} comments
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
