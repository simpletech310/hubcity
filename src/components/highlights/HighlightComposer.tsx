"use client";

import { useState, useRef } from "react";
import Button from "@/components/ui/Button";
import { uploadPostImage, uploadPostVideo } from "@/lib/upload";

interface HighlightComposerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onCreated: () => void;
}

const EXPIRY_OPTIONS = [
  { label: "24h", hours: 24 },
  { label: "7 days", hours: 168 },
  { label: "30 days", hours: 720 },
  { label: "Permanent", hours: 0 },
];

export default function HighlightComposer({
  isOpen,
  onClose,
  userId,
  onCreated,
}: HighlightComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaWidth, setMediaWidth] = useState<number | null>(null);
  const [mediaHeight, setMediaHeight] = useState<number | null>(null);
  const [caption, setCaption] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [expiryHours, setExpiryHours] = useState(168); // Default 7 days
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const hasMedia = !!mediaPreview;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setMediaPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setMediaType("image");

    // Upload
    setUploading(true);
    setError("");
    try {
      const url = await uploadPostImage(file, userId);
      setMediaUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
      setMediaPreview(null);
      setMediaType(null);
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

    const url = URL.createObjectURL(file);
    setMediaPreview(url);
    setMediaType("video");

    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadPostVideo(file, userId);
      setMediaUrl(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video upload failed");
      setMediaPreview(null);
      setMediaType(null);
    } finally {
      setUploading(false);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setMediaWidth(img.naturalWidth);
    setMediaHeight(img.naturalHeight);
  };

  const handleVideoMeta = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    setMediaWidth(vid.videoWidth);
    setMediaHeight(vid.videoHeight);
  };

  const handleSubmit = async () => {
    if (!mediaUrl || !mediaType) {
      setError("Add a photo or video");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/city-highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_url: mediaUrl,
          media_type: mediaType,
          caption: caption.trim() || null,
          link_url: linkUrl.trim() || null,
          link_label: linkLabel.trim() || null,
          media_width: mediaWidth,
          media_height: mediaHeight,
          expires_in_hours: expiryHours,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create highlight");
      }

      // Success — reset and close
      resetState();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create highlight");
    } finally {
      setSubmitting(false);
    }
  };

  const resetState = () => {
    setMediaUrl(null);
    setMediaType(null);
    setMediaPreview(null);
    setMediaWidth(null);
    setMediaHeight(null);
    setCaption("");
    setLinkUrl("");
    setLinkLabel("");
    setExpiryHours(168);
    setError("");
  };

  const handleClose = () => {
    if (!submitting) {
      resetState();
      onClose();
    }
  };

  const clearMedia = () => {
    setMediaUrl(null);
    setMediaType(null);
    setMediaPreview(null);
    setMediaWidth(null);
    setMediaHeight(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
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
          {hasMedia ? (
            <Button
              size="sm"
              onClick={handleSubmit}
              loading={submitting}
              disabled={uploading || !mediaUrl}
            >
              Share
            </Button>
          ) : (
            <div className="w-16" /> /* spacer */
          )}
        </div>

        {error && (
          <div className="mx-4 mb-3 bg-coral/15 border border-coral/25 rounded-xl px-4 py-2.5 text-xs text-coral relative z-20">
            {error}
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {hasMedia ? (
            <>
              {/* Media preview */}
              {mediaType === "image" && mediaPreview && (
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaPreview}
                    alt="Highlight preview"
                    onLoad={handleImageLoad}
                    className="max-w-full max-h-full"
                    style={{ width: "auto", height: "auto" }}
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-3 border-gold/30 border-t-gold rounded-full animate-spin" />
                        <span className="text-xs text-white/60 font-medium">Uploading...</span>
                      </div>
                    </div>
                  )}
                  {mediaUrl && !uploading && (
                    <div className="absolute top-3 left-3 bg-emerald/20 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 z-10">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <span className="text-[10px] text-emerald font-semibold">Ready</span>
                    </div>
                  )}
                </div>
              )}

              {mediaType === "video" && mediaPreview && (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <video
                    src={mediaPreview}
                    playsInline
                    autoPlay
                    muted
                    loop
                    onLoadedMetadata={handleVideoMeta}
                    className="max-w-full max-h-full"
                    style={{ width: "auto", height: "auto" }}
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-3 border-gold/30 border-t-gold rounded-full animate-spin" />
                        <span className="text-xs text-white/60 font-medium">Processing video...</span>
                      </div>
                    </div>
                  )}
                  {mediaUrl && !uploading && (
                    <div className="absolute top-3 left-3 bg-emerald/20 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 z-10">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <span className="text-[10px] text-emerald font-semibold">Ready</span>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom overlay: caption, link, expiry */}
              <div className="absolute bottom-0 left-0 right-0 z-20">
                <div className="bg-gradient-to-t from-black via-black/80 to-transparent pt-10 pb-4 px-4 space-y-3">
                  {/* Caption */}
                  <input
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    className="w-full bg-white/10 backdrop-blur-sm text-sm text-white placeholder:text-white/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-gold/40 border border-white/10"
                    maxLength={200}
                  />

                  {/* Link URL */}
                  <input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="Add a link (optional)..."
                    className="w-full bg-white/10 backdrop-blur-sm text-sm text-white placeholder:text-white/40 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-gold/40 border border-white/10"
                    type="url"
                  />

                  {/* Link label (show when URL is filled) */}
                  {linkUrl.trim() && (
                    <input
                      value={linkLabel}
                      onChange={(e) => setLinkLabel(e.target.value)}
                      placeholder="Link label (e.g. Learn More)"
                      className="w-full bg-white/10 backdrop-blur-sm text-sm text-white placeholder:text-white/40 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-gold/40 border border-white/10"
                      maxLength={50}
                    />
                  )}

                  {/* Expiry picker + meta */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {EXPIRY_OPTIONS.map((opt) => (
                        <button
                          key={opt.hours}
                          onClick={() => setExpiryHours(opt.hours)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all press ${
                            expiryHours === opt.hours
                              ? "bg-gold/20 text-gold border border-gold/30"
                              : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-white/30">{caption.length}/200</span>
                  </div>

                  {/* Change media */}
                  <button
                    onClick={clearMedia}
                    className="text-[11px] text-white/40 press hover:text-white/60 transition-colors"
                  >
                    Change media
                  </button>
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
                  Share a photo or video moment with the Compton community.
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
