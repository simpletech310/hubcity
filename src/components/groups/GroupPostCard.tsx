"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Badge from "@/components/ui/Badge";
import MediaLightbox from "@/components/pulse/MediaLightbox";
import CommentsPreview from "@/components/pulse/CommentsPreview";
import { REACTION_EMOJI_MAP, REACTION_COLORS, ROLE_BADGE_MAP } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { ReactionEmoji } from "@/types/database";

interface GroupPostAuthor {
  id: string;
  display_name: string;
  avatar_url: string | null;
  handle: string | null;
  role: string;
}

interface GroupPostData {
  id: string;
  body: string;
  image_url: string | null;
  video_url: string | null;
  media_type: string | null;
  is_pinned: boolean;
  comment_count: number;
  reaction_counts: Record<string, number>;
  created_at: string;
  author: GroupPostAuthor | null;
  /** Optional: up to 2 top-level comments for the inline Instagram-style preview. */
  preview_comments?: Array<{
    id: string;
    body: string;
    created_at: string;
    author_display_name: string;
    author_handle: string | null;
  }>;
}

interface GroupPostCardProps {
  post: GroupPostData;
  groupId: string;
  userId: string | null;
  isMember: boolean;
  isAdminOrMod: boolean;
  userReactions: string[];
  onDelete: (postId: string) => void;
  onPin: (postId: string, pin: boolean) => void;
  onReact: (postId: string, emoji: string) => void;
  onCommentOpen: (postId: string) => void;
  /**
   * Called when realtime detects reaction changes from another user so the
   * parent can merge fresh denormalized counts into its posts state.
   * Optional — callers that don't care can leave it off.
   */
  onReactionCountsChange?: (postId: string, counts: Record<string, number>) => void;
  /**
   * Called when realtime detects this user's own reactions changed on another
   * device. Lets the parent re-sync the userReactions map.
   */
  onUserReactionsChange?: (postId: string, userReactions: string[]) => void;
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function GroupPostCard({
  post, groupId, userId, isMember, isAdminOrMod, userReactions,
  onDelete, onPin, onReact, onCommentOpen,
  onReactionCountsChange, onUserReactionsChange,
}: GroupPostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [bodyExpanded, setBodyExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState("");
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoDims, setVideoDims] = useState<{ w: number; h: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [shareToast, setShareToast] = useState(false);

  const author = post.author;
  const isMyPost = author?.id === userId;
  const canModerate = isAdminOrMod || isMyPost;
  const isLong = post.body.length > 280;
  const roleBadge = author?.role ? ROLE_BADGE_MAP[author.role] : null;

  const initials = author?.display_name
    ?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const reactionEmojis = Object.keys(REACTION_EMOJI_MAP) as ReactionEmoji[];
  const totalReactions = Object.values(post.reaction_counts || {}).reduce((a, b) => a + (b || 0), 0);

  const handleVideoMeta = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    const containerWidth = videoContainerRef.current?.clientWidth || 398;
    const maxH = 560;
    const scale = Math.min(containerWidth / vid.videoWidth, maxH / vid.videoHeight);
    setVideoDims({ w: Math.round(vid.videoWidth * scale), h: Math.round(vid.videoHeight * scale) });
  }, []);

  const toggleVideoPlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) { vid.play(); setVideoPlaying(true); }
    else { vid.pause(); setVideoPlaying(false); }
  }, []);

  // ── Realtime subscription ─────────────────────────────
  // When any user's reaction changes on this group post, pull the fresh
  // denormalized counts from group_posts and the user's own reactions from
  // group_post_reactions. Debounced 200ms so our own optimistic click's echo
  // collapses with the live update.
  const postId = post.id;
  useEffect(() => {
    const supabase = createClient();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const refetch = async () => {
      if (cancelled) return;
      const { data: postRow } = await supabase
        .from("group_posts")
        .select("reaction_counts")
        .eq("id", postId)
        .single();
      if (cancelled) return;
      if (postRow?.reaction_counts) {
        onReactionCountsChange?.(postId, postRow.reaction_counts as Record<string, number>);
      }
      if (userId) {
        const { data: mine } = await supabase
          .from("group_post_reactions")
          .select("emoji")
          .eq("group_post_id", postId)
          .eq("user_id", userId);
        if (cancelled) return;
        if (mine) {
          onUserReactionsChange?.(postId, mine.map((r) => r.emoji as string));
        }
      }
    };

    const scheduleRefetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(refetch, 200);
    };

    const channel = supabase
      .channel(`group-post-reactions-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_post_reactions",
          filter: `group_post_id=eq.${postId}`,
        },
        scheduleRefetch,
      )
      .subscribe();

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [postId, userId, onReactionCountsChange, onUserReactionsChange]);

  // Auto-play when scrolled into view, pause when out of view — matches PostCard.
  useEffect(() => {
    const container = videoContainerRef.current;
    const vid = videoRef.current;
    if (!container || !vid) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            vid.muted = true;
            setVideoMuted(true);
            vid.play().then(() => setVideoPlaying(true)).catch(() => {});
          } else if (!vid.paused) {
            vid.pause();
            setVideoPlaying(false);
          }
        }
      },
      { threshold: [0, 0.5, 1] }
    );
    obs.observe(container);
    return () => obs.disconnect();
  }, []);

  const handleShare = async () => {
    const url = `${window.location.origin}/groups/${groupId}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Group Post", url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  };

  return (
    <div
      className="!p-0 overflow-hidden relative"
      style={{
        background: "var(--paper)",
        border: "2px solid var(--rule-strong-c)",
      }}
    >
      {/* Pinned accent — gold foil bar across top */}
      {post.is_pinned && (
        <div style={{ height: 4, background: "var(--gold-c)" }} />
      )}

      {/* Author header */}
      <div className="p-4 pb-0">
        {post.is_pinned && (
          <div
            className="inline-flex items-center gap-1 c-kicker mb-2"
            style={{ fontSize: 10, color: "var(--ink-strong)" }}
          >
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
            </svg>
            PINNED
          </div>
        )}

        <div className="flex items-center gap-3">
          <Link
            href={author?.handle ? `/user/${author.handle}` : "#"}
            className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden shrink-0"
            style={{
              background: "var(--gold-c)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            {author?.avatar_url ? (
              <Image src={author.avatar_url} alt="" width={44} height={44} className="w-full h-full object-cover" />
            ) : (
              <span
                className="c-card-t"
                style={{ fontSize: 13, color: "var(--ink-strong)" }}
              >
                {initials}
              </span>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p
                className="c-card-t truncate"
                style={{ fontSize: 13, color: "var(--ink-strong)" }}
              >
                {author?.display_name || "Unknown"}
              </p>
              {roleBadge && <Badge label={roleBadge.label} variant={roleBadge.variant} />}
            </div>
            <p className="c-kicker" style={{ fontSize: 9, opacity: 0.6 }}>
              {author?.handle ? `@${author.handle.toUpperCase()} · ` : ""}{timeAgo(post.created_at).toUpperCase()}
            </p>
          </div>

          {/* Menu */}
          {canModerate && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 press"
                style={{ color: "var(--ink-strong)" }}
                aria-label="Post menu"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div
                    className="absolute right-0 top-8 z-20 py-1 min-w-[140px] animate-in fade-in zoom-in-95 duration-150 origin-top-right"
                    style={{
                      background: "var(--paper)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    {isAdminOrMod && (
                      <button
                        onClick={() => { setShowMenu(false); onPin(post.id, !post.is_pinned); }}
                        className="w-full text-left px-3 py-2 c-kicker"
                        style={{ fontSize: 10, color: "var(--ink-strong)" }}
                      >
                        {post.is_pinned ? "UNPIN POST" : "PIN POST"}
                      </button>
                    )}
                    {isAdminOrMod && (
                      <div style={{ borderTop: "1.5px solid var(--rule-strong-c)", opacity: 0.3 }} />
                    )}
                    <button
                      onClick={() => { setShowMenu(false); onDelete(post.id); }}
                      className="w-full text-left px-3 py-2 c-kicker"
                      style={{ fontSize: 10, color: "var(--ink-strong)" }}
                    >
                      DELETE POST
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="mt-3">
          <p
            className={`c-body whitespace-pre-wrap ${isLong && !bodyExpanded ? "line-clamp-4" : ""}`}
            style={{ fontSize: 14, color: "var(--ink-strong)", lineHeight: 1.5 }}
          >
            {post.body}
          </p>
          {isLong && (
            <button
              onClick={() => setBodyExpanded(!bodyExpanded)}
              className="c-kicker mt-1"
              style={{ fontSize: 10, color: "var(--ink-strong)" }}
            >
              {bodyExpanded ? "SHOW LESS" : "READ MORE"}
            </button>
          )}
        </div>
      </div>

      {/* Image */}
      {post.image_url && post.media_type !== "video" && (
        <button
          onClick={() => { setLightboxSrc(post.image_url!); setLightboxOpen(true); }}
          className="mt-3 w-full block overflow-hidden"
          style={{ borderTop: "2px solid var(--rule-strong-c)" }}
        >
          <Image
            src={post.image_url}
            alt=""
            width={430}
            height={430}
            className="w-full h-auto max-h-[420px] object-contain"
            style={{ background: "var(--paper-soft)" }}
          />
        </button>
      )}

      {/* Video — inline playback */}
      {post.video_url && (
        <div
          ref={videoContainerRef}
          className="mt-3 overflow-hidden flex items-center justify-center relative group cursor-pointer"
          onClick={toggleVideoPlay}
          style={{
            background: "var(--ink-strong)",
            borderTop: "2px solid var(--rule-strong-c)",
          }}
        >
          <video
            ref={videoRef}
            src={post.video_url.includes("#") ? post.video_url : `${post.video_url}#t=0.1`}
            poster={post.image_url ?? undefined}
            playsInline
            muted={videoMuted}
            preload="metadata"
            onLoadedMetadata={handleVideoMeta}
            onEnded={() => setVideoPlaying(false)}
            style={videoDims ? { width: `${videoDims.w}px`, height: `${videoDims.h}px` } : { maxWidth: "100%", maxHeight: "560px", width: "auto", height: "auto" }}
          />
          {!videoPlaying && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "color-mix(in srgb, var(--ink-strong) 35%, transparent)" }}
            >
              <div
                className="w-12 h-12 flex items-center justify-center"
                style={{
                  background: "var(--gold-c)",
                  border: "2px solid var(--paper)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--ink-strong)"><polygon points="6,3 20,12 6,21" /></svg>
              </div>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setVideoMuted(!videoMuted); if (videoRef.current) videoRef.current.muted = !videoMuted; }}
            className="absolute bottom-3 right-3 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: "var(--gold-c)",
              border: "2px solid var(--paper)",
              color: "var(--ink-strong)",
            }}
            aria-label={videoMuted ? "Unmute" : "Mute"}
          >
            {videoMuted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Legacy image_url without media_type */}
      {post.image_url && !post.media_type && !post.video_url && (
        <button
          onClick={() => { setLightboxSrc(post.image_url!); setLightboxOpen(true); }}
          className="mt-3 w-full block overflow-hidden"
          style={{ borderTop: "2px solid var(--rule-strong-c)" }}
        >
          <img src={post.image_url} alt="" className="w-full max-h-[400px] object-cover" />
        </button>
      )}

      {/* Reactions + actions */}
      <div className="px-4 pb-3 pt-2.5">
        {/* Reaction summary */}
        {totalReactions > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex -space-x-1">
              {reactionEmojis.filter((e) => (post.reaction_counts?.[e] || 0) > 0).slice(0, 3).map((e) => (
                <span key={e} className="text-xs">{REACTION_EMOJI_MAP[e]}</span>
              ))}
            </div>
            <span
              className="c-kicker tabular-nums"
              style={{ fontSize: 10, opacity: 0.6 }}
            >
              {totalReactions}
            </span>
            {(post.comment_count || 0) > 0 && (
              <>
                <span style={{ opacity: 0.3 }} className="mx-1">·</span>
                <span
                  className="c-kicker tabular-nums"
                  style={{ fontSize: 10, opacity: 0.6 }}
                >
                  {post.comment_count} COMMENT{post.comment_count !== 1 ? "S" : ""}
                </span>
              </>
            )}
          </div>
        )}

        {/* Action row */}
        <div
          className="flex items-center gap-0.5 pt-2"
          style={{ borderTop: "2px solid var(--rule-strong-c)" }}
        >
          {reactionEmojis.map((emoji) => {
            const isActive = userReactions.includes(emoji);
            const count = post.reaction_counts?.[emoji] || 0;
            const colors = REACTION_COLORS[emoji];

            return (
              <button
                key={emoji}
                onClick={() => isMember && onReact(post.id, emoji)}
                disabled={!isMember}
                className={`flex items-center gap-1 px-2 py-1.5 text-xs transition-all ${
                  isActive ? `${colors.bg} ${colors.text} font-semibold` : ""
                } ${!isMember ? "opacity-40 cursor-default" : "press"}`}
                style={!isActive ? { color: "var(--ink-strong)", opacity: 0.55 } : undefined}
              >
                <span className={`text-sm ${isActive ? "" : "grayscale opacity-70"}`}>{REACTION_EMOJI_MAP[emoji]}</span>
                {count > 0 && <span className="tabular-nums text-[11px]">{count}</span>}
              </button>
            );
          })}

          {/* Right side actions */}
          <div className="flex items-center gap-0.5 ml-auto">
            {/* Share */}
            <button
              onClick={handleShare}
              className="relative flex items-center gap-1 px-2 py-1.5 text-xs transition-all press"
              style={{ color: "var(--ink-strong)", opacity: 0.6 }}
              aria-label="Share"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
              {shareToast && (
                <span
                  className="absolute -top-8 left-1/2 -translate-x-1/2 c-kicker whitespace-nowrap px-2 py-1"
                  style={{
                    background: "var(--gold-c)",
                    color: "var(--ink-strong)",
                    border: "2px solid var(--rule-strong-c)",
                    fontSize: 9,
                  }}
                >
                  LINK COPIED
                </span>
              )}
            </button>

            {/* Comment */}
            <button
              onClick={() => onCommentOpen(post.id)}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs transition-all press"
              style={{ color: "var(--ink-strong)", opacity: 0.6 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="tabular-nums">{post.comment_count || 0}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inline comments preview — Instagram style, same component as pulse */}
      {(post.preview_comments?.length ?? 0) > 0 && (
        <CommentsPreview
          comments={(post.preview_comments ?? []).map((c) => ({
            id: c.id,
            body: c.body,
            created_at: c.created_at,
            author_display_name: c.author_display_name,
            author_handle: c.author_handle,
          }))}
          totalCount={post.comment_count || 0}
          onOpen={() => onCommentOpen(post.id)}
        />
      )}

      {/* Image Lightbox */}
      {lightboxOpen && (
        <MediaLightbox type="image" src={lightboxSrc} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}
