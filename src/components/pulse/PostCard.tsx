"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Card from "@/components/ui/Card";
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

  const timeAgo = getTimeAgo(post.created_at);
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
    <Card className={`!p-0 overflow-hidden ${post.is_pinned ? "border-gold/20 relative" : ""}`}>
      {/* Role-based accent line */}
      {(() => {
        const role = author?.role;
        const accentGradient =
          role === "city_official" || role === "city_ambassador" || role === "admin"
            ? "from-gold/50 via-gold/25 to-transparent"
            : role === "business_owner"
            ? "from-emerald/50 via-emerald/25 to-transparent"
            : role === "content_creator"
            ? "from-hc-purple/50 via-hc-purple/25 to-transparent"
            : "from-white/[0.04] via-transparent to-transparent";
        return (
          <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accentGradient} z-10`} />
        );
      })()}

      {/* Pinned accent — overrides role line */}
      {post.is_pinned && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold/50 via-gold/25 to-transparent z-10" />
      )}

      <div className="p-4">
        {/* Pinned label */}
        {post.is_pinned && (
          <div className="flex items-center gap-1.5 text-[10px] text-gold font-semibold mb-3">
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
                className={`w-11 h-11 rounded-full object-cover ring-2 ${
                  isVerified ? "ring-cyan/30 shadow-[0_0_8px_rgba(6,182,212,0.15)]" : "ring-white/[0.06]"
                }`}
              />
            ) : (
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br from-royal to-hc-purple flex items-center justify-center text-gold font-heading font-bold text-sm ring-2 ${
                isVerified ? "ring-cyan/30" : "ring-white/[0.06]"
              }`}>
                {initials}
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Link href={author?.handle ? `/user/${author.handle}` : "#"} className="text-[13px] font-bold truncate hover:underline">
                {author?.display_name || "Unknown"}
              </Link>
              {isVerified && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-cyan shrink-0">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
              {roleBadge && (
                <Badge label={roleBadge.label} variant={roleBadge.variant} />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {author?.handle && (
                <span className="text-[11px] text-white/30">@{author.handle}</span>
              )}
              <span className="text-[10px] text-white/20">&middot;</span>
              <span className="text-[10px] text-white/30">{timeAgo}</span>
              {editedAt && (
                <span className="text-[10px] text-white/20 italic">edited</span>
              )}
            </div>
          </div>
          {/* More menu */}
          {showMenuButton && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Post options"
                className="p-1.5 rounded-lg hover:bg-white/5 text-txt-secondary hover:text-white transition-colors"
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
                  <div className="absolute right-0 top-8 z-20 bg-deep border border-border-subtle rounded-xl shadow-xl py-1 w-40 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                    {canEdit && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setEditBody(currentBody);
                          setIsEditing(true);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-white hover:bg-white/5 flex items-center gap-2"
                      >
                        <Icon name="edit" size={16} /> Edit Post
                      </button>
                    )}
                    {canDelete && (
                      <>
                        {canEdit && <div className="border-t border-white/[0.04] my-0.5" />}
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
                        <div className="border-t border-white/[0.04] my-0.5" />
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
              className="w-full bg-white/5 border border-gold/30 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/50 min-h-[80px] resize-none leading-relaxed"
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
                className="px-3 py-1.5 rounded-lg bg-gold text-midnight text-[11px] font-bold disabled:opacity-40"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-txt-secondary text-[11px] font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <p className={`text-[14px] text-white/80 leading-relaxed whitespace-pre-wrap ${isLongBody && !bodyExpanded ? "line-clamp-4" : ""}`}>
              {currentBody}
            </p>
            {isLongBody && (
              <button
                onClick={() => setBodyExpanded(!bodyExpanded)}
                className="text-[12px] text-gold font-semibold mt-1 hover:underline"
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
              <span key={tag} className="text-[11px] font-medium text-gold/60 bg-gold/[0.06] border border-gold/[0.08] rounded-full px-2.5 py-0.5 hover:text-gold hover:bg-gold/10 transition-colors cursor-pointer">
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
          className="relative overflow-hidden w-full block"
        >
          <Image
            src={post.image_url}
            alt="Post image"
            width={430}
            height={430}
            className="w-full h-auto max-h-[420px] object-contain bg-black/20"
          />
        </button>
      )}

      {post.media_type === "video" && post.video_status === "ready" && post.video_url && (
        <div ref={videoContainerRef} className="overflow-hidden bg-black flex items-center justify-center relative group cursor-pointer" onClick={toggleVideoPlay}>
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
              <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              </div>
            </div>
          )}
          {/* Mute toggle — always visible so mobile users can control audio */}
          <button
            onClick={(e) => { e.stopPropagation(); setVideoMuted(!videoMuted); if (videoRef.current) videoRef.current.muted = !videoMuted; }}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-opacity"
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
        <div className="overflow-hidden">
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
        <div className="bg-white/5 border-t border-b border-border-subtle flex flex-col items-center justify-center py-10 gap-2">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-xs text-txt-secondary">Video processing...</p>
        </div>
      )}

      {post.media_type === "video" && post.video_status === "errored" && (
        <div className="bg-coral/5 border-t border-b border-coral/20 flex items-center justify-center py-6">
          <p className="text-xs text-coral">Video failed to process</p>
        </div>
      )}

      {/* Reactions */}
      <div className="px-4 pb-1 pt-1">
        <ReactionBar post={post} userReactions={userReactions} userId={userId} />
      </div>

      {/* Inline comments preview — Instagram style */}
      {(post.preview_comments?.length ?? 0) > 0 && (
        <CommentsPreview
          comments={post.preview_comments ?? []}
          totalCount={post.comment_count || 0}
          onOpen={() => setPreviewCommentsOpen(true)}
        />
      )}

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
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowReport(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-deep border border-border-subtle rounded-2xl p-5 max-w-sm mx-auto">
            {reported ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2"><Icon name="check" size={24} /></p>
                <p className="text-sm font-bold mb-1">Report Submitted</p>
                <p className="text-xs text-txt-secondary">Thank you. Our team will review this content.</p>
                <button
                  onClick={() => { setShowReport(false); setReported(false); }}
                  className="mt-4 px-4 py-2 bg-gold/10 text-gold rounded-lg text-xs font-bold"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-heading font-bold text-sm mb-3">Report This Post</h3>
                <div className="space-y-2 mb-3">
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      onClick={() => setReportReason(reason.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        reportReason === reason.value
                          ? "bg-coral/10 text-coral border border-coral/30"
                          : "bg-white/5 text-txt-secondary hover:text-white border border-transparent"
                      }`}
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Additional details (optional)"
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="w-full bg-white/5 border border-border-subtle rounded-xl px-3 py-2 text-xs text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 min-h-[60px] resize-none mb-3"
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
                    className="flex-1 py-2 rounded-lg bg-coral text-white text-xs font-bold disabled:opacity-40"
                  >
                    {reporting ? "Submitting..." : "Submit Report"}
                  </button>
                  <button
                    onClick={() => { setShowReport(false); setReportReason(""); setReportDesc(""); }}
                    className="px-4 py-2 rounded-lg bg-white/5 text-txt-secondary text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </Card>
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
