"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { uploadPostImage } from "@/lib/upload";
import dynamic from "next/dynamic";

const MuxUploader = dynamic(
  () => import("@mux/mux-uploader-react").then((mod) => mod.default || mod),
  { ssr: false }
);

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export default function ComposeModal({ isOpen, onClose, userId, userName }: ComposeModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [muxUploadId, setMuxUploadId] = useState<string | null>(null);
  const [muxUploadUrl, setMuxUploadUrl] = useState<string | null>(null);
  const [videoAttached, setVideoAttached] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
    setMuxUploadId(null);
    setMuxUploadUrl(null);
    setVideoAttached(false);

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

  const handleVideoAttach = async () => {
    // Clear image if set
    setImageUrl(null);
    setImagePreview(null);
    setError("");

    try {
      const res = await fetch("/api/mux/upload", { method: "POST" });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const data = await res.json();
      setMuxUploadUrl(data.upload_url);
      setMuxUploadId(data.upload_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video setup failed");
    }
  };

  const handleSubmit = async () => {
    if (!body.trim() && !imageUrl && !muxUploadId) {
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
          mux_upload_id: muxUploadId,
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
      setMuxUploadId(null);
      setMuxUploadUrl(null);
      setVideoAttached(false);
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
      setMuxUploadId(null);
      setMuxUploadUrl(null);
      setVideoAttached(false);
      setError("");
      onClose();
    }
  };

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
          <span className="text-sm font-heading font-bold text-gold">New Post</span>
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

        {/* Mux Uploader */}
        {muxUploadUrl && (
          <div className="mx-5 mb-3 rounded-xl overflow-hidden border border-border-subtle bg-white/5 p-4">
            <MuxUploader
              endpoint={muxUploadUrl}
              onSuccess={() => setVideoAttached(true)}
            />
            {videoAttached && (
              <p className="text-xs text-emerald mt-2 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Video uploaded — will process after posting
              </p>
            )}
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
          <button
            onClick={handleVideoAttach}
            disabled={uploading || submitting || !!muxUploadUrl}
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
