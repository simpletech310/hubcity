"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ReactionBar from "./ReactionBar";
import type { Post, ReactionEmoji } from "@/types/database";
import { ROLE_BADGE_MAP } from "@/lib/constants";
import dynamic from "next/dynamic";

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
  const [deleted, setDeleted] = useState(false);
  const [currentBody, setCurrentBody] = useState(post.body);
  const [editedAt, setEditedAt] = useState(post.edited_at);
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

  if (deleted) return null;

  return (
    <Card hover className={post.is_pinned ? "border-gold/20 relative overflow-hidden" : ""}>
      {/* Pinned accent */}
      {post.is_pinned && (
        <>
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold/40 via-gold/20 to-transparent" />
          <div className="flex items-center gap-1.5 text-[10px] text-gold font-semibold mb-2.5">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
            </svg>
            Pinned Post
          </div>
        </>
      )}

      {/* Author row */}
      <div className="flex items-center gap-3 mb-3">
        <Link href={author?.handle ? `/user/${author.handle}` : "#"} className="shrink-0">
          {author?.avatar_url ? (
            <Image
              src={author.avatar_url}
              alt={author.display_name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white/5"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-royal to-hc-purple flex items-center justify-center text-gold font-heading font-bold text-sm ring-2 ring-white/5">
              {initials}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
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
          <p className="text-[10px] text-txt-secondary">{timeAgo}</p>
        </div>
        {/* More menu */}
        {showMenuButton && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
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
                <div className="absolute right-0 top-8 z-20 bg-deep border border-border-subtle rounded-xl shadow-xl py-1 w-40">
                  {canEdit && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setEditBody(currentBody);
                        setIsEditing(true);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-white hover:bg-white/5 flex items-center gap-2"
                    >
                      ✏️ Edit Post
                    </button>
                  )}
                  {canDelete && (
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
                      className="w-full text-left px-3 py-2 text-xs font-medium text-coral hover:bg-white/5 flex items-center gap-2"
                    >
                      🗑️ Delete Post
                    </button>
                  )}
                  {!isAuthor && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowReport(true);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-coral hover:bg-white/5 flex items-center gap-2"
                    >
                      🚩 Report Post
                    </button>
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
            className="w-full bg-white/5 border border-gold/30 rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/50 min-h-[80px] resize-none leading-relaxed"
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
          <p className="text-[13px] text-txt-secondary leading-relaxed">
            {currentBody}
          </p>
          {editedAt && (
            <span className="text-[10px] text-white/25 italic mt-1 inline-block">edited</span>
          )}
        </div>
      )}

      {/* Media */}
      {post.media_type === "image" && post.image_url && (
        <div className="relative rounded-xl overflow-hidden mb-3 -mx-1">
          <Image
            src={post.image_url}
            alt="Post image"
            width={400}
            height={300}
            className="w-full h-auto max-h-[300px] object-cover"
          />
        </div>
      )}

      {post.media_type === "video" && post.video_status === "ready" && post.mux_playback_id && (
        <div className="rounded-xl overflow-hidden mb-3 -mx-1">
          <MuxPlayer
            playbackId={post.mux_playback_id}
            streamType="on-demand"
            accentColor="#D4A017"
            style={{ aspectRatio: "16/9", width: "100%", borderRadius: "0.75rem" }}
            metadata={{ video_title: "Hub City Post" }}
          />
        </div>
      )}

      {post.media_type === "video" && post.video_status === "preparing" && (
        <div className="rounded-xl bg-white/5 border border-border-subtle mb-3 -mx-1 flex flex-col items-center justify-center py-10 gap-2">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-xs text-txt-secondary">Video processing...</p>
        </div>
      )}

      {post.media_type === "video" && post.video_status === "errored" && (
        <div className="rounded-xl bg-coral/5 border border-coral/20 mb-3 -mx-1 flex items-center justify-center py-6">
          <p className="text-xs text-coral">Video failed to process</p>
        </div>
      )}

      {/* Reactions */}
      <ReactionBar post={post} userReactions={userReactions} userId={userId} />

      {/* Report Modal */}
      {showReport && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowReport(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-deep border border-border-subtle rounded-2xl p-5 max-w-sm mx-auto">
            {reported ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2">✅</p>
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
