"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { uploadPostImage, uploadPostVideo } from "@/lib/upload";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export default function ComposeModal({ isOpen, onClose, userId, userName }: ComposeModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);

  // Fetch trending hashtags once
  useEffect(() => {
    if (isOpen && trendingTags.length === 0) {
      fetch("/api/hashtags/trending")
        .then((res) => res.json())
        .then((data) => {
          if (data.trending) {
            setTrendingTags(data.trending.map((t: { hashtag: string }) => t.hashtag));
          }
        })
        .catch(() => {});
    }
  }, [isOpen, trendingTags.length]);

  if (!isOpen) return null;

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Character counter
  const charPercent = Math.min(body.length / 500, 1);
  const counterColor =
    body.length > 480 ? "#FF6B6B" : body.length > 400 ? "#F2A900" : "rgba(26,21,18,0.4)";
  const counterRadius = 8;
  const counterCircumference = 2 * Math.PI * counterRadius;
  const counterOffset = counterCircumference * (1 - charPercent);

  // Hashtag detection
  const handleBodyChange = (value: string) => {
    setBody(value);

    // Check if user is typing a hashtag
    const match = value.match(/#(\w*)$/);
    if (match && match[1].length > 0) {
      const partial = match[1].toLowerCase();
      const suggestions = trendingTags.filter((t) =>
        t.toLowerCase().startsWith(partial)
      );
      setHashtagSuggestions(suggestions.slice(0, 5));
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const insertHashtag = (tag: string) => {
    const match = body.match(/#(\w*)$/);
    if (match) {
      setBody(body.slice(0, body.length - match[0].length) + `#${tag} `);
    }
    setShowSuggestions(false);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    setVideoUrl(null);
    setVideoPreview(null);

    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setError("");
    try {
      const url = await uploadPostImage(file, userId);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError("Video must be under 50MB");
      return;
    }

    setImageUrl(null);
    setImagePreview(null);

    const url = URL.createObjectURL(file);
    setVideoPreview(url);

    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadPostVideo(file, userId);
      setVideoUrl(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video upload failed");
      setVideoPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!body.trim() && !imageUrl && !videoUrl) {
      setError("Write something or attach media");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim() || (imageUrl ? "Shared a photo" : "Shared a video"),
          image_url: imageUrl,
          video_url: videoUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create post");
      }

      setBody("");
      setImageUrl(null);
      setImagePreview(null);
      setVideoUrl(null);
      setVideoPreview(null);
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Post failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setBody("");
      setImageUrl(null);
      setImagePreview(null);
      setVideoUrl(null);
      setVideoPreview(null);
      setError("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop (stays dark — scrim) */}
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      {/* Panel */}
      <div
        className="relative w-full max-w-[430px] animate-slide-up"
        style={{
          background: "var(--paper)",
          borderTop: "2px solid var(--rule-strong-c)",
          color: "var(--ink-strong)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="w-10 h-1"
            style={{ background: "var(--rule-strong-c)", opacity: 0.3, borderRadius: 999 }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pb-3"
          style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
        >
          <button
            onClick={handleClose}
            className="c-meta press"
            style={{ color: "var(--ink-strong)" }}
          >
            CANCEL
          </button>
          <span className="c-kicker" style={{ fontSize: 11, color: "var(--ink-strong)" }}>
            § NEW POST
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            loading={submitting}
            disabled={uploading || (!body.trim() && !imageUrl && !videoUrl)}
          >
            Post
          </Button>
        </div>

        {error && (
          <div
            className="mx-5 mt-3 px-4 py-2.5"
            style={{
              background: "rgba(232, 72, 85, 0.1)",
              border: "2px solid #E84855",
              color: "#E84855",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        {/* Author + Textarea */}
        <div className="flex gap-3 px-5 pt-4 relative">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 c-card-t"
            style={{
              background: "var(--gold-c)",
              color: "var(--ink-strong)",
              fontSize: 11,
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            {initials}
          </div>
          <div className="flex-1">
            <p className="c-kicker mb-1" style={{ fontSize: 10 }}>{userName}</p>
            <textarea
              value={body}
              onChange={(e) => handleBodyChange(e.target.value)}
              placeholder="What's happening in Compton?"
              className="w-full bg-transparent text-sm resize-none focus:outline-none min-h-[80px]"
              style={{ color: "var(--ink-strong)" }}
              maxLength={500}
              autoFocus
            />

            {/* Hashtag suggestions */}
            {showSuggestions && (
              <div
                className="absolute left-12 right-5 py-1 z-30"
                style={{
                  background: "var(--paper)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                {hashtagSuggestions.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => insertHashtag(tag)}
                    className="w-full text-left px-3 py-2 c-meta press"
                    style={{ color: "var(--ink-strong)" }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Image preview — media canvas stays dark for the image itself */}
        {imagePreview && (
          <div
            className="relative mx-5 mb-3 overflow-hidden"
            style={{
              background: "#000",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <Image
              src={imagePreview}
              alt="Preview"
              width={390}
              height={300}
              className="w-full h-auto max-h-[300px] object-contain"
            />
            {/* Upload progress bar */}
            {uploading && (
              <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div className="h-full animate-pulse" style={{ width: "70%", background: "var(--gold-c)" }} />
              </div>
            )}
            {imageUrl && !uploading && (
              <div
                className="absolute top-2 left-2 px-2.5 py-1 flex items-center gap-1 c-badge-ok"
                style={{ fontSize: 9 }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span style={{ fontSize: 9 }}>READY</span>
              </div>
            )}
            <button
              onClick={() => {
                setImagePreview(null);
                setImageUrl(null);
              }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white press"
              style={{ background: "rgba(0,0,0,0.7)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Video preview — canvas stays dark for the video itself */}
        {videoPreview && (
          <div
            className="relative mx-5 mb-3 overflow-hidden"
            style={{
              background: "#000",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <video
              src={videoPreview}
              playsInline
              autoPlay
              muted
              loop
              className="w-full max-h-[300px]"
              style={{ width: "auto", height: "auto", maxWidth: "100%", maxHeight: "300px", margin: "0 auto", display: "block" }}
            />
            {uploading && (
              <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div className="h-full animate-pulse" style={{ width: "60%", background: "var(--gold-c)" }} />
              </div>
            )}
            {videoUrl && !uploading && (
              <div
                className="absolute top-2 left-2 px-2.5 py-1 flex items-center gap-1 c-badge-ok"
                style={{ fontSize: 9 }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span style={{ fontSize: 9 }}>READY</span>
              </div>
            )}
            <button
              onClick={() => {
                setVideoPreview(null);
                setVideoUrl(null);
              }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white press"
              style={{ background: "rgba(0,0,0,0.7)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Media bar + character counter */}
        <div
          className="flex items-center gap-2 px-5 py-3"
          style={{ borderTop: "2px solid var(--rule-strong-c)" }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || submitting}
            className="flex items-center gap-1.5 px-3 py-2 c-meta press transition-all disabled:opacity-40"
            style={{ color: "var(--ink-strong)", border: "2px solid var(--rule-strong-c)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Photo
          </button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/mov"
            className="hidden"
            onChange={handleVideoSelect}
          />
          <button
            onClick={() => videoInputRef.current?.click()}
            disabled={uploading || submitting || !!videoPreview}
            className="flex items-center gap-1.5 px-3 py-2 c-meta press transition-all disabled:opacity-40"
            style={{ color: "var(--ink-strong)", border: "2px solid var(--rule-strong-c)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            Video
          </button>

          {/* Circular character counter */}
          <div className="ml-auto flex items-center gap-1.5">
            <svg width="22" height="22" viewBox="0 0 22 22" className="rotate-[-90deg]">
              <circle
                cx="11" cy="11" r={counterRadius}
                fill="none"
                stroke="rgba(26,21,18,0.12)"
                strokeWidth="2"
              />
              <circle
                cx="11" cy="11" r={counterRadius}
                fill="none"
                stroke={counterColor}
                strokeWidth="2"
                strokeDasharray={counterCircumference}
                strokeDashoffset={counterOffset}
                strokeLinecap="round"
                className="transition-all duration-200"
              />
            </svg>
            {body.length > 400 && (
              <span className="text-[10px] tabular-nums" style={{ color: counterColor }}>
                {500 - body.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
