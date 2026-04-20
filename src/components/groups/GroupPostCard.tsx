"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Badge from "@/components/ui/Badge";
import MediaLightbox from "@/components/pulse/MediaLightbox";
import { REACTION_EMOJI_MAP, REACTION_COLORS, ROLE_BADGE_MAP } from "@/lib/constants";
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
    <div className={`glass-card-elevated rounded-2xl !p-0 overflow-hidden relative ${post.is_pinned ? "border-gold/15" : ""}`}>
      {/* Pinned accent */}
      {post.is_pinned && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-gold to-gold/20 rounded-full z-10" />
      )}

      {/* Author header */}
      <div className="p-4 pb-0">
        {post.is_pinned && (
          <div className="flex items-center gap-1 text-gold text-[10px] font-semibold mb-2">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
            </svg>
            PINNED
          </div>
        )}

        <div className="flex items-center gap-3">
          <Link
            href={author?.handle ? `/user/${author.handle}` : "#"}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-royal to-hc-purple ring-2 ring-white/[0.06] flex items-center justify-center overflow-hidden shrink-0"
          >
            {author?.avatar_url ? (
              <Image src={author.avatar_url} alt="" width={44} height={44} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-gold font-heading">{initials}</span>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-bold truncate">{author?.display_name || "Unknown"}</p>
              {roleBadge && <Badge label={roleBadge.label} variant={roleBadge.variant} />}
            </div>
            <p className="text-[11px] text-white/30">
              {author?.handle ? `@${author.handle} · ` : ""}{timeAgo(post.created_at)}
            </p>
          </div>

          {/* Menu */}
          {canModerate && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-txt-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-8 z-20 bg-deep border border-border-subtle rounded-xl shadow-xl py-1 min-w-[140px] animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                    {isAdminOrMod && (
                      <button
                        onClick={() => { setShowMenu(false); onPin(post.id, !post.is_pinned); }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors"
                      >
                        {post.is_pinned ? "Unpin Post" : "Pin Post"}
                      </button>
                    )}
                    {isAdminOrMod && <div className="border-t border-white/[0.04] my-0.5" />}
                    <button
                      onClick={() => { setShowMenu(false); onDelete(post.id); }}
                      className="w-full text-left px-3 py-2 text-xs text-coral hover:bg-coral/5 transition-colors"
                    >
                      Delete Post
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="mt-3">
          <p className={`text-[14px] text-white/80 leading-relaxed whitespace-pre-wrap ${isLong && !bodyExpanded ? "line-clamp-4" : ""}`}>
            {post.body}
          </p>
          {isLong && (
            <button onClick={() => setBodyExpanded(!bodyExpanded)} className="text-[12px] text-gold font-semibold mt-1">
              {bodyExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      </div>

      {/* Image */}
      {post.image_url && post.media_type !== "video" && (
        <button onClick={() => { setLightboxSrc(post.image_url!); setLightboxOpen(true); }} className="mt-3 w-full block overflow-hidden">
          <Image src={post.image_url} alt="" width={430} height={430} className="w-full h-auto max-h-[420px] object-contain bg-black/20" />
        </button>
      )}

      {/* Video — inline playback */}
      {post.video_url && (
        <div ref={videoContainerRef} className="mt-3 overflow-hidden bg-black flex items-center justify-center relative group cursor-pointer" onClick={toggleVideoPlay}>
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
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="6,3 20,12 6,21" /></svg>
              </div>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setVideoMuted(!videoMuted); if (videoRef.current) videoRef.current.muted = !videoMuted; }}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
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
        <button onClick={() => { setLightboxSrc(post.image_url!); setLightboxOpen(true); }} className="mt-3 w-full block overflow-hidden">
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
            <span className="text-[11px] text-white/30 tabular-nums">{totalReactions}</span>
            {(post.comment_count || 0) > 0 && (
              <>
                <span className="text-white/10 mx-1">&middot;</span>
                <span className="text-[11px] text-white/30 tabular-nums">{post.comment_count} comment{post.comment_count !== 1 ? "s" : ""}</span>
              </>
            )}
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center gap-0.5 pt-2 border-t border-white/[0.04]">
          {reactionEmojis.map((emoji) => {
            const isActive = userReactions.includes(emoji);
            const count = post.reaction_counts?.[emoji] || 0;
            const colors = REACTION_COLORS[emoji];

            return (
              <button
                key={emoji}
                onClick={() => isMember && onReact(post.id, emoji)}
                disabled={!isMember}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-xs transition-all ${
                  isActive ? `${colors.bg} ${colors.text} font-semibold scale-105` : "text-white/40 hover:bg-white/[0.04] hover:text-white/60"
                } ${!isMember ? "opacity-40 cursor-default" : "press"}`}
              >
                <span className={`text-sm ${isActive ? "" : "grayscale opacity-60"}`}>{REACTION_EMOJI_MAP[emoji]}</span>
                {count > 0 && <span className="tabular-nums text-[11px]">{count}</span>}
              </button>
            );
          })}

          {/* Right side actions */}
          <div className="flex items-center gap-0.5 ml-auto">
            {/* Share */}
            <button onClick={handleShare} className="relative flex items-center gap-1 px-2 py-1.5 text-xs text-white/40 hover:bg-white/[0.04] hover:text-white/60 rounded-full transition-all press">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
              {shareToast && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald/20 text-emerald text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap backdrop-blur-sm">
                  Link copied!
                </span>
              )}
            </button>

            {/* Comment */}
            <button
              onClick={() => onCommentOpen(post.id)}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-white/40 hover:bg-white/[0.04] hover:text-white/60 rounded-full transition-all press"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="tabular-nums">{post.comment_count || 0}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxOpen && (
        <MediaLightbox type="image" src={lightboxSrc} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}
