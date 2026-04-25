"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import ReactionBar from "./ReactionBar";
import CommentsPreview from "./CommentsPreview";
import CommentsSheet from "./CommentsSheet";
import MediaLightbox from "./MediaLightbox";
import type { Post, ReactionEmoji } from "@/types/database";
import { ROLE_BADGE_MAP } from "@/lib/constants";
import dynamic from "next/dynamic";
import Icon from "@/components/ui/Icon";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), { ssr: false });

const REPORT_REASONS = [
  { value: "spam", label: "Spam or misleading" },
  { value: "harassment", label: "Harassment or hate speech" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Other" },
];

interface PostCardProps {
  post: Post;
  userReactions: ReactionEmoji[];
  userId: string | null;
}

export default function PostCard({ post, userReactions, userId }: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  const [saving, setSaving] = useState(false);
  const [previewCommentsOpen, setPreviewCommentsOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [currentBody, setCurrentBody] = useState(post.body);
  const [editedAt, setEditedAt] = useState(post.edited_at);
  const [bodyExpanded, setBodyExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState("");
  const [videoDims, setVideoDims] = useState<{ w: number; h: number } | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const author = post.author;
  const initials = author?.display_name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const roleBadge = author?.role ? ROLE_BADGE_MAP[author.role] : null;
  const isVerified = author?.verification_status === "verified" ||
    author?.role === "city_official" ||
    author?.role === "city_ambassador" ||
    author?.role === "admin";

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const timeAgo = mounted ? getTimeAgo(post.created_at) : "";
  const isAuthor = userId === post.author_id;
  const isWithinEditWindow = Date.now() - new Date(post.created_at).getTime() < 15 * 60 * 1000;
  const canEdit = isAuthor && isWithinEditWindow;
  const canDelete = isAuthor;
  const showMenuButton = userId && (isAuthor || userId !== post.author_id);

  const isLongBody = currentBody.length > 280;

  const openImageLightbox = useCallback((src: string) => {
    setLightboxSrc(src);
    setLightboxOpen(true);
  }, []);

  const toggleVideoPlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play();
      setVideoPlaying(true);
    } else {
      vid.pause();
      setVideoPlaying(false);
    }
  }, []);

  /**
   * Auto-play when the video scrolls into view; pause when it leaves.
   * Starts muted so mobile browsers don't block autoplay. User can tap
   * the speaker icon to unmute.
   */
  useEffect(() => {
    const container = videoContainerRef.current;
    const vid = videoRef.current;
    if (!container || !vid) return;

    // iOS Safari needs inline + muted for programmatic autoplay.
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            vid.muted = true;
            setVideoMuted(true);
            vid.play().then(() => setVideoPlaying(true)).catch(() => {});
          } else {
            if (!vid.paused) {
              vid.pause();
              setVideoPlaying(false);
            }
          }
        }
      },
      { threshold: [0, 0.5, 1] }
    );
    obs.observe(container);
    return () => obs.disconnect();
  }, []);

  /** Calculate video dimensions to fit in card without object-fit */
  const handleVideoMeta = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    const containerWidth = videoContainerRef.current?.clientWidth || 398;
    const maxH = 560;
    const scale = Math.min(containerWidth / vid.videoWidth, maxH / vid.videoHeight);
    setVideoDims({
      w: Math.round(vid.videoWidth * scale),
      h: Math.round(vid.videoHeight * scale),
    });
  }, []);

  if (deleted) return null;

  return (
    <div
      className={`overflow-hidden ${post.is_pinned ? "relative" : ""}`}
      style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
    >
      {/* Role-based accent line */}
      {(() => {
        const role = author?.role;
        const color =
          role === "city_official" || role === "city_ambassador" || role === "admin"
            ? "#F2A900"
            : role === "business_owner"
            ? "#22C55E"
            : role === "content_creator"
            ? "#8B5CF6"
            : null;
        return color ? (
          <div
            className="absolute top-0 left-0 right-0 h-[3px] z-10"
            style={{ background: `linear-gradient(90deg, ${color}99, transparent)` }}
          />
        ) : null;
      })()}

      {/* Pinned accent — overrides role line */}
      {post.is_pinned && (
        <div
          className="absolute top-0 left-0 right-0 h-[3px] z-10"
          style={{ background: "linear-gradient(90deg, #F2A90099, transparent)" }}
        />
      )}

      <div className="p-4">
        {/* Pinned label */}
        {post.is_pinned && (
          <div className="c-kicker flex items-center gap-1.5 mb-3">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
            </svg>
            Pinned Post
          </div>
        )}

        {/* Author row */}
        <div className="flex items-center gap-3 mb-3">
          <Link href={author?.handle ? `/user/${author.handle}` : "#"} className="shrink-0">
            {author?.avatar_url ? (
              <Image
                src={author.avatar_url}
                alt={author.display_name}
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover"
                style={{ border: "2px solid var(--rule-strong-c)" }}
              />
            ) : (
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center font-heading font-bold text-sm"
                style={{ background: "var(--ink-strong)", color: "var(--gold-c)", border: "2px solid var(--ink-strong)" }}
              >
                {initials}
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Link href={author?.handle ? `/user/${author.handle}` : "#"} className="c-card-t text-[13px] font-bold truncate hover:underline" style={{ color: "var(--ink-strong)" }}>
                {author?.display_name || "Unknown"}
              </Link>
              {isVerified && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0" style={{ color: "var(--gold-c)" }}>
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
              {roleBadge && (
                <Badge label={roleBadge.label} variant={roleBadge.variant} />
              )}
            </div>
            <div className="c-meta flex items-center gap-2 mt-0.5">
              {author?.handle && (
                <span className="text-[11px]" style={{ color: "var(--ink-strong)", opacity: 0.55 }}>@{author.handle}</span>
              )}
              <span className="text-[10px]" style={{ color: "var(--ink-strong)", opacity: 0.4 }}>&middot;</span>
              <span className="text-[10px]" style={{ color: "var(--ink-strong)", opacity: 0.55 }}>{timeAgo}</span>
              {editedAt && (
                <span className="text-[10px] c-serif-it" style={{ color: "var(--ink-strong)", opacity: 0.45 }}>edited</span>
              )}
            </div>
          </div>
          {/* More menu */}
          {showMenuButton && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Post options"
                className="p-1.5 transition-colors"
                style={{ color: "var(--ink-strong)", opacity: 0.65 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-8 z-20 py-1 w-40 animate-in fade-in zoom-in-95 duration-150 origin-top-right" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
                    {canEdit && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setEditBody(currentBody);
                          setIsEditing(true);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2"
                        style={{ color: "var(--ink-strong)" }}
                      >
                        <Icon name="edit" size={16} /> Edit Post
                      </button>
                    )}
                    {canDelete && (
                      <>
                        {canEdit && <div className="c-rule-hair my-0.5" />}
                        <button
                          onClick={async () => {
                            setShowMenu(false);
                            if (!confirm("Delete this post? This cannot be undone.")) return;
                            try {
                              const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
                              if (res.ok) setDeleted(true);
                            } catch {
                              // silent fail
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-coral hover:bg-coral/5 flex items-center gap-2"
                        >
                          <Icon name="trash" size={16} /> Delete Post
                        </button>
                      </>
                    )}
                    {!isAuthor && (
                      <>
                        <div className="c-rule-hair my-0.5" />
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            setShowReport(true);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-coral hover:bg-coral/5 flex items-center gap-2"
                        >
                          <Icon name="flag" size={16} /> Report Post
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="mb-3">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full px-3 py-2.5 text-sm focus:outline-none min-h-[80px] resize-none leading-relaxed"
              style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)", color: "var(--ink-strong)" }}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={async () => {
                  if (!editBody.trim() || saving) return;
                  setSaving(true);
                  try {
                    const res = await fetch(`/api/posts/${post.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ body: editBody }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setCurrentBody(data.post.body);
                      setEditedAt(data.post.edited_at);
                      setIsEditing(false);
                    } else {
                      const data = await res.json();
                      alert(data.error || "Failed to save edit");
                    }
                  } catch {
                    alert("Failed to save edit");
                  }
                  setSaving(false);
                }}
                disabled={saving || !editBody.trim()}
                className="c-btn c-btn-accent c-btn-sm disabled:opacity-40"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="c-btn c-btn-outline c-btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <p
              className={`c-body text-[14px] leading-relaxed whitespace-pre-wrap ${isLongBody && !bodyExpanded ? "line-clamp-4" : ""}`}
              style={{ color: "var(--ink-strong)" }}
            >
              {currentBody}
            </p>
            {isLongBody && (
              <button
                onClick={() => setBodyExpanded(!bodyExpanded)}
                className="c-kicker text-[12px] text-gold font-semibold mt-1 hover:underline"
              >
                {bodyExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.hashtags.map((tag: string) => (
              <span key={tag} className="c-chip gold cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Media — full bleed, tappable for lightbox */}
      {post.media_type === "image" && post.image_url && (
        <button
          onClick={() => openImageLightbox(post.image_url!)}
          className="c-frame relative overflow-hidden w-full block"
        >
          <Image
            src={post.image_url}
            alt="Post image"
            width={430}
            height={430}
            className="w-full h-auto max-h-[420px] object-contain"
            style={{ background: "var(--paper-soft)" }}
          />
        </button>
      )}

      {post.media_type === "video" && post.video_status === "ready" && post.video_url && (
        <div ref={videoContainerRef} className="c-frame overflow-hidden bg-black flex items-center justify-center relative group cursor-pointer" onClick={toggleVideoPlay}>
          <video
            ref={videoRef}
            src={post.video_url.includes("#") ? post.video_url : `${post.video_url}#t=0.1`}
            poster={post.image_url ?? undefined}
            playsInline
            muted={videoMuted}
            preload="metadata"
            onLoadedMetadata={handleVideoMeta}
            onEnded={() => setVideoPlaying(false)}
            style={
              videoDims
                ? { width: `${videoDims.w}px`, height: `${videoDims.h}px` }
                : { maxWidth: "100%", maxHeight: "560px", width: "auto", height: "auto" }
            }
          />
          {/* Play/pause overlay */}
          {!videoPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              </div>
            </div>
          )}
          {/* Mute toggle — always visible so mobile users can control audio */}
          <button
            onClick={(e) => { e.stopPropagation(); setVideoMuted(!videoMuted); if (videoRef.current) videoRef.current.muted = !videoMuted; }}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center transition-opacity"
            style={{ color: "#fff" }}
            aria-label={videoMuted ? "Unmute video" : "Mute video"}
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

      {post.media_type === "video" && post.video_status === "ready" && !post.video_url && post.mux_playback_id && (
        <div className="c-frame overflow-hidden">
          <MuxPlayer
            playbackId={post.mux_playback_id}
            streamType="on-demand"
            accentColor="#D4A017"
            style={{ aspectRatio: "16/9", width: "100%" }}
            metadata={{ video_title: "Culture Post" }}
          />
        </div>
      )}

      {post.media_type === "video" && post.video_status === "preparing" && (
        <div
          className="flex flex-col items-center justify-center py-10 gap-2"
          style={{ background: "var(--paper-warm)", borderTop: "2px solid var(--rule-strong-c)", borderBottom: "2px solid var(--rule-strong-c)" }}
        >
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-xs" style={{ color: "var(--ink-strong)", opacity: 0.65 }}>Video processing...</p>
        </div>
      )}

      {post.media_type === "video" && post.video_status === "errored" && (
        <div
          className="bg-coral/5 flex items-center justify-center py-6"
          style={{ borderTop: "2px solid var(--rule-strong-c)", borderBottom: "2px solid var(--rule-strong-c)" }}
        >
          <p className="text-xs text-coral">Video failed to process</p>
        </div>
      )}

      {/* Reactions */}
      <div className="px-4 pb-1 pt-1">
        <ReactionBar post={post} userReactions={userReactions} userId={userId} />
      </div>

      {/* Inline comments preview — always visible */}
      <CommentsPreview
        comments={post.preview_comments ?? []}
        totalCount={post.comment_count || 0}
        onOpen={() => setPreviewCommentsOpen(true)}
      />

      {/* Separate sheet driver (ReactionBar owns its own sheet internally, but
          the "View all N" link on the preview opens this mirror instance so
          taps flow through without requiring a click through the emoji row). */}
      {previewCommentsOpen && (
        <CommentsSheet
          postId={post.id}
          isOpen={previewCommentsOpen}
          onClose={() => setPreviewCommentsOpen(false)}
          userId={userId}
          commentCount={post.comment_count || 0}
          onCountChange={() => {
            /* ReactionBar owns the count; noop here. */
          }}
        />
      )}

      {/* Image Lightbox */}
      {lightboxOpen && (
        <MediaLightbox
          type="image"
          src={lightboxSrc}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Report Modal */}
      {showReport && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowReport(false)} />
          <div
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 p-5 max-w-sm mx-auto"
            style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
          >
            {reported ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2"><Icon name="check" size={24} /></p>
                <p className="c-card-t text-sm font-bold mb-1" style={{ color: "var(--ink-strong)" }}>Report Submitted</p>
                <p className="text-xs" style={{ color: "var(--ink-strong)", opacity: 0.65 }}>Thank you. Our team will review this content.</p>
                <button
                  onClick={() => { setShowReport(false); setReported(false); }}
                  className="c-btn c-btn-accent c-btn-sm mt-4"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="c-card-t font-bold text-sm mb-3" style={{ color: "var(--ink-strong)" }}>Report This Post</h3>
                <div className="space-y-2 mb-3">
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      onClick={() => setReportReason(reason.value)}
                      className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                        reportReason === reason.value
                          ? "bg-coral/10 text-coral"
                          : ""
                      }`}
                      style={{
                        border: reportReason === reason.value ? "2px solid var(--coral, #EF4444)" : "2px solid var(--rule-strong-c)",
                        color: reportReason === reason.value ? undefined : "var(--ink-strong)",
                        background: reportReason === reason.value ? undefined : "var(--paper-warm)",
                      }}
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Additional details (optional)"
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs focus:outline-none min-h-[60px] resize-none mb-3"
                  style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)", color: "var(--ink-strong)" }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!reportReason) return;
                      setReporting(true);
                      try {
                        await fetch("/api/reports", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            content_type: "post",
                            content_id: post.id,
                            reason: reportReason,
                            details: reportDesc || null,
                          }),
                        });
                        setReported(true);
                      } catch {
                        // silent fail
                      }
                      setReporting(false);
                    }}
                    disabled={!reportReason || reporting}
                    className="flex-1 py-2 bg-coral text-xs font-bold disabled:opacity-40"
                    style={{ color: "#fff", border: "2px solid var(--rule-strong-c)" }}
                  >
                    {reporting ? "Submitting..." : "Submit Report"}
                  </button>
                  <button
                    onClick={() => { setShowReport(false); setReportReason(""); setReportDesc(""); }}
                    className="c-btn c-btn-outline c-btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
