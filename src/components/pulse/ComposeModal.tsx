"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { uploadPostImage, uploadPostVideo } from "@/lib/upload";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  initialHighlight?: boolean;
}

export default function ComposeModal({ isOpen, onClose, userId, userName, initialHighlight = false }: ComposeModalProps) {
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
  const [isHighlight] = useState(initialHighlight);

  if (!isOpen) return null;

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    // Clear video if set
    setVideoUrl(null);
    setVideoPreview(null);

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
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

    // Clear image if set
    setImageUrl(null);
    setImagePreview(null);

    // Show preview
    const url = URL.createObjectURL(file);
    setVideoPreview(url);

    // Upload
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
    if (isHighlight) {
      // Highlights require media
      if (!imageUrl && !videoUrl) {
        setError("Add a photo or video for your highlight");
        return;
      }
    } else {
      if (!body.trim() && !imageUrl && !videoUrl) {
        setError("Write something or attach media");
        return;
      }
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim() || (isHighlight ? "City Highlight" : imageUrl ? "Shared a photo" : "Shared a video"),
          image_url: imageUrl,
          video_url: videoUrl,
          is_highlight: isHighlight,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create post");
      }

      // Reset and close
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

  const hasMedia = !!imagePreview || !!videoPreview;

  // ── HIGHLIGHT MODE — Story/Reel Creator ──────────────────
  if (isHighlight) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Full-screen dark backdrop */}
        <div className="absolute inset-0 bg-black" onClick={handleClose} />

        <div className="relative w-full max-w-[430px] h-full flex flex-col bg-black">
          {/* Top bar */}
          <div className="relative z-20 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,12px)] pb-3">
            <button onClick={handleClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center press">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="text-sm font-heading font-bold text-gold">City Highlight</span>
            </div>
            <Button
              size="sm"
              onClick={handleSubmit}
              loading={submitting}
              disabled={uploading || !hasMedia}
            >
              Share
            </Button>
          </div>

          {error && (
            <div className="mx-4 mb-3 bg-coral/15 border border-coral/25 rounded-xl px-4 py-2.5 text-xs text-coral relative z-20">
              {error}
            </div>
          )}

          {/* Media preview area — the main stage */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {hasMedia ? (
              <>
                {/* Image highlight preview */}
                {imagePreview && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src={imagePreview}
                      alt="Highlight"
                      fill
                      className="object-contain"
                    />
                    {uploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 border-3 border-gold/30 border-t-gold rounded-full animate-spin" />
                          <span className="text-xs text-white/60 font-medium">Uploading...</span>
                        </div>
                      </div>
                    )}
                    {imageUrl && !uploading && (
                      <div className="absolute top-3 left-3 bg-emerald/20 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 z-10">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <span className="text-[10px] text-emerald font-semibold">Ready</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Video highlight preview */}
                {videoPreview && (
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    <video
                      src={videoPreview}
                      controls
                      playsInline
                      autoPlay
                      muted
                      className="w-full h-full object-contain"
                    />
                    {uploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 border-3 border-gold/30 border-t-gold rounded-full animate-spin" />
                          <span className="text-xs text-white/60 font-medium">Processing video...</span>
                        </div>
                      </div>
                    )}
                    {videoUrl && !uploading && (
                      <div className="absolute top-3 left-3 bg-emerald/20 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 z-10">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <span className="text-[10px] text-emerald font-semibold">Ready</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Caption overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 z-20">
                  <div className="bg-gradient-to-t from-black via-black/80 to-transparent pt-10 pb-4 px-4">
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <input
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          placeholder="Add a caption..."
                          className="w-full bg-white/10 backdrop-blur-sm text-sm text-white placeholder:text-white/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-gold/40 border border-white/10"
                          maxLength={200}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 px-1">
                      <span className="text-[10px] text-white/30">{body.length}/200</span>
                      {/* Swap media button */}
                      <button
                        onClick={() => {
                          setImagePreview(null);
                          setImageUrl(null);
                          setVideoPreview(null);
                          setVideoUrl(null);
                        }}
                        className="text-[11px] text-white/40 press hover:text-white/60 transition-colors"
                      >
                        Change media
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* No media yet — upload prompt */
              <div className="flex flex-col items-center gap-6 px-8">
                <div className="w-24 h-24 rounded-full bg-gold/10 border-2 border-dashed border-gold/25 flex items-center justify-center">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold/60">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="font-heading font-bold text-[20px] text-white mb-2">Create a Highlight</h3>
                  <p className="text-sm text-white/40 leading-relaxed max-w-[260px]">
                    Share a photo or video moment with the Compton community. It appears in the highlights strip on the Pulse.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2.5 bg-white/[0.08] border border-white/[0.12] px-6 py-3.5 rounded-2xl text-[14px] font-semibold press hover:bg-white/[0.12] transition-all disabled:opacity-40"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span className="text-white">Photo</span>
                  </button>
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2.5 bg-white/[0.08] border border-white/[0.12] px-6 py-3.5 rounded-2xl text-[14px] font-semibold press hover:bg-white/[0.12] transition-all disabled:opacity-40"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-coral">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                    <span className="text-white">Video</span>
                  </button>
                </div>
                <p className="text-[11px] text-white/20 mt-2">Photo (5MB) or Video (50MB max)</p>
              </div>
            )}
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleImageSelect}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/mov"
            className="hidden"
            onChange={handleVideoSelect}
          />
        </div>
      </div>
    );
  }

  // ── REGULAR POST MODE ────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Panel */}
      <div className="relative w-full max-w-[430px] bg-card border-t border-border-subtle rounded-t-2xl animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-border-subtle">
          <button onClick={handleClose} className="text-sm text-txt-secondary press">
            Cancel
          </button>
          <span className="text-sm font-heading font-bold text-gold">
            New Post
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            loading={submitting}
            disabled={uploading}
          >
            Post
          </Button>
        </div>

        {error && (
          <div className="mx-5 mt-3 bg-coral/10 border border-coral/20 rounded-xl px-4 py-2.5 text-xs text-coral">
            {error}
          </div>
        )}

        {/* Author + Textarea */}
        <div className="flex gap-3 px-5 pt-4">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-royal to-hc-purple flex items-center justify-center text-gold font-heading font-bold text-xs ring-2 ring-white/5 shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold mb-1">{userName}</p>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What's happening in Compton?"
              className="w-full bg-transparent text-sm text-white placeholder:text-txt-secondary resize-none focus:outline-none min-h-[80px]"
              maxLength={500}
              autoFocus
            />
          </div>
        </div>

        {/* Image preview */}
        {imagePreview && (
          <div className="relative mx-5 mb-3 rounded-xl overflow-hidden">
            <Image
              src={imagePreview}
              alt="Preview"
              width={380}
              height={200}
              className="w-full h-auto max-h-[200px] object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              </div>
            )}
            <button
              onClick={() => {
                setImagePreview(null);
                setImageUrl(null);
              }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white text-sm press"
            >
              x
            </button>
          </div>
        )}

        {/* Video preview */}
        {videoPreview && (
          <div className="relative mx-5 mb-3 rounded-xl overflow-hidden border border-border-subtle bg-white/5">
            <video
              src={videoPreview}
              controls
              playsInline
              className="w-full max-h-[200px] object-contain bg-black"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              </div>
            )}
            {videoUrl && !uploading && (
              <p className="text-xs text-emerald px-3 py-2 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Video ready
              </p>
            )}
            <button
              onClick={() => {
                setVideoPreview(null);
                setVideoUrl(null);
              }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white text-sm press"
            >
              x
            </button>
          </div>
        )}

        {/* Media bar */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-border-subtle">
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-cyan hover:bg-cyan/10 press transition-all disabled:opacity-40"
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-coral hover:bg-coral/10 press transition-all disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            Video
          </button>
          <span className="text-[10px] text-txt-secondary ml-auto">
            {body.length}/500
          </span>
        </div>
      </div>
    </div>
  );
}
