"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import MediaLightbox from "@/components/pulse/MediaLightbox";
import DistrictPostCard from "./DistrictPostCard";
import DistrictCommentsSheet from "./DistrictCommentsSheet";
import DistrictProgramCard from "./DistrictProgramCard";
import type { ReactionEmoji } from "@/types/database";

// ─── Types ──────────────────────────────────────────

interface DistrictPost {
  id: string;
  district: number;
  author_id: string;
  post_type: "update" | "alert" | "photo";
  title: string | null;
  body: string;
  image_url: string | null;
  video_url: string | null;
  media_type: string | null;
  is_pinned: boolean;
  reaction_counts: Record<string, number>;
  comment_count: number;
  created_at: string;
  author: {
    id: string;
    display_name: string;
    handle: string | null;
    avatar_url: string | null;
    role: string;
  } | null;
}

interface GalleryItem {
  id: string;
  image_url: string | null;
  video_url: string | null;
  media_type: string | null;
  created_at: string;
  author: { id: string; display_name: string; avatar_url: string | null } | null;
}

interface DistrictProgram {
  id: string;
  title: string;
  description: string | null;
  category: string;
  location_name: string | null;
  schedule: string | null;
  start_date: string | null;
  end_date: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

// ─── Props ──────────────────────────────────────────

interface DistrictFeedProps {
  district: number;
  districtColor: string;
  userId: string | null;
  isCouncilMember: boolean;
}

const tabs = ["Updates", "Photos", "Programs"] as const;
type Tab = (typeof tabs)[number];

// ─── Skeleton Helpers ───────────────────────────────

function SkeletonCard() {
  return (
    <div className="glass-card-elevated rounded-2xl p-4 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
      <div className="h-3 bg-white/10 rounded w-full mb-2" />
      <div className="h-3 bg-white/10 rounded w-5/6" />
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 gap-1">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="aspect-square bg-white/10 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

// ─── Component ──────────────────────────────────────

export default function DistrictFeed({
  district,
  districtColor,
  userId,
  isCouncilMember,
}: DistrictFeedProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Updates");

  // ── Updates state ──
  const [posts, setPosts] = useState<DistrictPost[]>([]);
  const [userReactions, setUserReactions] = useState<Record<string, ReactionEmoji[]>>({});
  const [postsLoading, setPostsLoading] = useState(true);
  const [commentSheet, setCommentSheet] = useState<{ postId: string; count: number } | null>(null);

  // ── Photos state ──
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryFetched, setGalleryFetched] = useState(false);
  const [lightbox, setLightbox] = useState<{ type: "image" | "video"; src: string } | null>(null);

  // ── Programs state ──
  const [programs, setPrograms] = useState<DistrictProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [programsFetched, setProgramsFetched] = useState(false);

  // ── Fetch Updates ──
  useEffect(() => {
    setPostsLoading(true);
    fetch(`/api/districts/${district}/posts`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || []);
        setUserReactions(data.userReactions || {});
      })
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, [district]);

  // ── Fetch Photos (lazy) ──
  useEffect(() => {
    if (activeTab !== "Photos" || galleryFetched) return;
    setGalleryLoading(true);
    fetch(`/api/districts/${district}/gallery`)
      .then((res) => res.json())
      .then((data) => {
        setGallery(data.media || []);
        setGalleryFetched(true);
      })
      .catch(() => {})
      .finally(() => setGalleryLoading(false));
  }, [activeTab, district, galleryFetched]);

  // ── Fetch Programs (lazy) ──
  useEffect(() => {
    if (activeTab !== "Programs" || programsFetched) return;
    setProgramsLoading(true);
    fetch(`/api/districts/${district}/programs`)
      .then((res) => res.json())
      .then((data) => {
        setPrograms(data.programs || []);
        setProgramsFetched(true);
      })
      .catch(() => {})
      .finally(() => setProgramsLoading(false));
  }, [activeTab, district, programsFetched]);

  // ── Reaction handler ──
  const handleReaction = useCallback(
    async (postId: string, emoji: ReactionEmoji) => {
      if (!userId) return;

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const current = userReactions[postId] || [];
          const hasReaction = current.includes(emoji);
          const counts = { ...p.reaction_counts };
          counts[emoji] = (counts[emoji] || 0) + (hasReaction ? -1 : 1);
          if ((counts[emoji] || 0) <= 0) delete counts[emoji];
          return { ...p, reaction_counts: counts };
        })
      );

      setUserReactions((prev) => {
        const current = prev[postId] || [];
        const hasReaction = current.includes(emoji);
        return {
          ...prev,
          [postId]: hasReaction ? current.filter((e) => e !== emoji) : [...current, emoji],
        };
      });

      try {
        await fetch(`/api/districts/${district}/posts/${postId}/react`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        });
      } catch {
        // Revert on error by refetching
        const res = await fetch(`/api/districts/${district}/posts`);
        const data = await res.json();
        setPosts(data.posts || []);
        setUserReactions(data.userReactions || {});
      }
    },
    [userId, district, userReactions]
  );

  // ── Delete handler ──
  const handleDelete = useCallback(
    async (postId: string) => {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      try {
        await fetch(`/api/districts/${district}/posts/${postId}`, { method: "DELETE" });
      } catch {
        // Refetch on error
        const res = await fetch(`/api/districts/${district}/posts`);
        const data = await res.json();
        setPosts(data.posts || []);
      }
    },
    [district]
  );

  // ── Pin toggle handler ──
  const handlePinToggle = useCallback(
    async (postId: string) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, is_pinned: !p.is_pinned } : p))
      );
      try {
        await fetch(`/api/districts/${district}/posts/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_pinned: !posts.find((p) => p.id === postId)?.is_pinned }),
        });
      } catch {
        const res = await fetch(`/api/districts/${district}/posts`);
        const data = await res.json();
        setPosts(data.posts || []);
      }
    },
    [district, posts]
  );

  // ── Sorted posts (pinned first) ──
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div>
      {/* ─── Tab Bar ─── */}
      <div className="flex border-b border-white/[0.06]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 text-center py-3 relative press"
          >
            <span
              className={`text-xs font-semibold transition-colors ${
                activeTab === tab ? "text-white" : "text-white/40"
              }`}
            >
              {tab}
            </span>
            {activeTab === tab && (
              <div
                className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full"
                style={{ backgroundColor: districtColor }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ─── Updates Tab ─── */}
      {activeTab === "Updates" && (
        <div className="px-4 pt-4 space-y-3">
          {postsLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : sortedPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                <Icon name="chat" size={24} className="text-white/20" />
              </div>
              <p className="text-sm font-semibold text-white/40">No updates yet</p>
              <p className="text-xs text-white/20 mt-1">District updates will appear here.</p>
            </div>
          ) : (
            sortedPosts.map((post) => (
              <DistrictPostCard
                key={post.id}
                post={post}
                district={district}
                districtColor={districtColor}
                userId={userId}
                isCouncilMember={isCouncilMember}
                userReactions={(userReactions[post.id] || []) as string[]}
                onDelete={(postId) => handleDelete(postId)}
                onPin={(postId, _pin) => handlePinToggle(postId)}
                onReact={(postId, emoji) => handleReaction(postId, emoji as ReactionEmoji)}
                onCommentOpen={(postId) =>
                  setCommentSheet({ postId, count: post.comment_count })
                }
                onReactionCountsChange={(postId, counts) =>
                  setPosts((prev) =>
                    prev.map((p) => (p.id === postId ? { ...p, reaction_counts: counts } : p))
                  )
                }
                onUserReactionsChange={(postId, emojis) =>
                  setUserReactions((prev) => ({
                    ...prev,
                    [postId]: emojis as ReactionEmoji[],
                  }))
                }
              />
            ))
          )}
        </div>
      )}

      {/* ─── Photos Tab ─── */}
      {activeTab === "Photos" && (
        <div className="px-4 pt-4">
          {galleryLoading ? (
            <SkeletonGrid />
          ) : gallery.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                <Icon name="photo" size={24} className="text-white/20" />
              </div>
              <p className="text-sm font-semibold text-white/40">No photos yet</p>
              <p className="text-xs text-white/20 mt-1">District photos will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {gallery.map((item) => {
                const isVideo = !!item.video_url;
                const src = isVideo ? item.video_url! : item.image_url!;
                return (
                  <button
                    key={item.id}
                    onClick={() => setLightbox({ type: isVideo ? "video" : "image", src })}
                    className="relative aspect-square rounded-lg overflow-hidden press bg-black/20"
                  >
                    {isVideo ? (
                      <div className="relative w-full h-full bg-black">
                        <video src={src} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="6,3 20,12 6,21" /></svg>
                        </div>
                      </div>
                    ) : (
                      <Image src={src} alt="" fill className="object-cover" sizes="(max-width: 430px) 33vw, 140px" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Programs Tab ─── */}
      {activeTab === "Programs" && (
        <div className="px-4 pt-4 space-y-3">
          {programsLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : programs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                <Icon name="calendar" size={24} className="text-white/20" />
              </div>
              <p className="text-sm font-semibold text-white/40">No programs yet</p>
              <p className="text-xs text-white/20 mt-1">District programs will appear here.</p>
            </div>
          ) : (
            programs.map((program) => (
              <DistrictProgramCard key={program.id} program={program} />
            ))
          )}
        </div>
      )}

      {/* ─── Comments Sheet ─── */}
      {commentSheet && (
        <DistrictCommentsSheet
          postId={commentSheet.postId}
          district={district}
          isOpen={!!commentSheet}
          onClose={() => setCommentSheet(null)}
          userId={userId}
          isCouncilMember={isCouncilMember}
          commentCount={commentSheet.count}
          onCountChange={(count) =>
            setPosts((prev) =>
              prev.map((p) =>
                p.id === commentSheet.postId ? { ...p, comment_count: count } : p
              )
            )
          }
        />
      )}

      {/* ─── Media Lightbox ─── */}
      {lightbox && (
        <MediaLightbox
          type={lightbox.type}
          src={lightbox.src}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
