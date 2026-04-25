"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Icon from "@/components/ui/Icon";

const MAX_IMAGE_SIZE = 12 * 1024 * 1024; // 12 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

interface UploadedItem {
  id: string;
  media_type: "image" | "video";
  media_url: string;
  poster_url: string | null;
  caption: string | null;
  created_at: string;
  author?: { id: string; display_name: string; avatar_url: string | null } | null;
}

interface Props {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (item: UploadedItem) => void;
}

function capturePoster(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.src = url;
    const cleanup = () => URL.revokeObjectURL(url);

    video.onloadedmetadata = () => {
      const seek = Math.min(0.5, video.duration * 0.05);
      try {
        video.currentTime = seek;
      } catch {
        cleanup();
        resolve(null);
      }
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        const max = 720;
        const ratio = Math.min(max / Math.max(video.videoWidth, video.videoHeight), 1);
        canvas.width = Math.round(video.videoWidth * ratio);
        canvas.height = Math.round(video.videoHeight * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          resolve(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => { cleanup(); resolve(blob); }, "image/jpeg", 0.8);
      } catch {
        cleanup();
        resolve(null);
      }
    };
    video.onerror = () => { cleanup(); resolve(null); };
  });
}

/**
 * Admin-only modal: upload a curated image or video to the group gallery.
 * Files go to the public `group-media` bucket, then we POST to the gallery
 * API which writes a row in `group_gallery_items`.
 */
export default function GroupGalleryUploader({ groupId, isOpen, onClose, onUploaded }: Props) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [kind, setKind] = useState<"image" | "video" | null>(null);
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setKind(null);
    setCaption("");
    setProgress(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);

    let mediaType: "image" | "video" | null = null;
    if (IMAGE_TYPES.includes(f.type)) mediaType = "image";
    else if (VIDEO_TYPES.includes(f.type)) mediaType = "video";

    if (!mediaType) {
      setError("Use JPG / PNG / WEBP for images, or MP4 / WEBM / MOV for video.");
      return;
    }

    const limit = mediaType === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (f.size > limit) {
      setError(
        mediaType === "image"
          ? "Image is too large. Max 12 MB."
          : "Video is too large. Max 100 MB."
      );
      return;
    }
    setFile(f);
    setKind(mediaType);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file || !kind) return;
    setUploading(true);
    setProgress(5);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in.");

      const stamp = Date.now();
      const rand = Math.random().toString(36).slice(2, 8);
      const ext = file.name.split(".").pop()?.toLowerCase() || (kind === "image" ? "jpg" : "mp4");
      const mediaPath = `${user.id}/${stamp}-${rand}.${ext}`;

      setProgress(20);
      const { error: upErr } = await supabase.storage
        .from("group-media")
        .upload(mediaPath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
      if (upErr) throw upErr;
      setProgress(60);

      const { data: pub } = supabase.storage.from("group-media").getPublicUrl(mediaPath);
      const mediaUrl = pub.publicUrl;

      let posterUrl: string | null = null;
      let posterPath: string | null = null;
      if (kind === "video") {
        try {
          const blob = await capturePoster(file);
          if (blob) {
            posterPath = `${user.id}/${stamp}-${rand}-poster.jpg`;
            const { error: pErr } = await supabase.storage
              .from("group-media")
              .upload(posterPath, blob, {
                cacheControl: "3600",
                upsert: false,
                contentType: "image/jpeg",
              });
            if (!pErr) {
              posterUrl = supabase.storage.from("group-media").getPublicUrl(posterPath).data.publicUrl;
            } else {
              posterPath = null;
            }
          }
        } catch {}
      }
      setProgress(85);

      const res = await fetch(`/api/groups/${groupId}/gallery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: kind,
          media_url: mediaUrl,
          media_path: mediaPath,
          poster_url: posterUrl,
          poster_path: posterPath,
          caption: caption.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to add to gallery");
      }
      const data = await res.json();
      setProgress(100);
      onUploaded(data.item as UploadedItem);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ background: "color-mix(in srgb, var(--ink-strong) 70%, transparent)" }}
      onClick={() => !uploading && onClose()}
    >
      <div
        className="w-full sm:max-w-md mx-auto"
        style={{
          background: "var(--paper)",
          border: "2px solid var(--rule-strong-c)",
          maxHeight: "92dvh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "2px solid var(--rule-strong-c)", background: "var(--paper-warm)" }}
        >
          <div className="flex items-center gap-2">
            <Icon name="photo" size={14} style={{ color: "var(--gold-c)" }} />
            <h3 className="c-kicker" style={{ fontSize: 11, color: "var(--ink-strong)" }}>
              ADD TO GROUP GALLERY
            </h3>
          </div>
          <button
            onClick={() => !uploading && onClose()}
            disabled={uploading}
            className="press"
            aria-label="Close"
            style={{ color: "var(--ink-strong)" }}
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {!file ? (
            <label className="block cursor-pointer">
              <div
                className="flex flex-col items-center justify-center gap-2 py-10"
                style={{
                  border: "2px dashed var(--rule-strong-c)",
                  background: "var(--paper-warm)",
                }}
              >
                <div
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ background: "var(--gold-c)", border: "2px solid var(--ink-strong)" }}
                >
                  <Icon name="upload" size={18} style={{ color: "var(--ink-strong)" }} />
                </div>
                <p className="c-card-t" style={{ fontSize: 13, color: "var(--ink-strong)" }}>
                  Pick an image or video
                </p>
                <p className="c-kicker" style={{ fontSize: 9, opacity: 0.6 }}>
                  IMAGES UP TO 12MB · VIDEO UP TO 100MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </label>
          ) : (
            <>
              <div
                className="relative mx-auto w-full overflow-hidden"
                style={{
                  background: "#000",
                  border: "2px solid var(--rule-strong-c)",
                  maxHeight: 360,
                  aspectRatio: kind === "video" ? "9 / 16" : "1 / 1",
                  width: kind === "video" ? "auto" : "100%",
                }}
              >
                {kind === "image" && preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="" className="w-full h-full object-contain" />
                )}
                {kind === "video" && preview && (
                  <video
                    src={preview}
                    className="w-full h-full object-contain"
                    controls
                    playsInline
                    muted
                  />
                )}
                <button
                  onClick={reset}
                  disabled={uploading}
                  className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center press disabled:opacity-40"
                  style={{
                    background: "var(--paper)",
                    border: "2px solid var(--rule-strong-c)",
                    color: "var(--ink-strong)",
                  }}
                  aria-label="Remove file"
                >
                  <Icon name="close" size={12} />
                </button>
              </div>

              <div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 240))}
                  placeholder="Caption (optional)"
                  rows={2}
                  disabled={uploading}
                  className="w-full px-3 py-2.5 resize-none"
                  style={{
                    fontSize: 14,
                    color: "var(--ink-strong)",
                    background: "var(--paper-warm)",
                    border: "2px solid var(--rule-strong-c)",
                    fontFamily: "var(--font-body, inherit)",
                  }}
                />
                <p className="c-kicker text-right mt-1" style={{ fontSize: 9, opacity: 0.55 }}>
                  {caption.length} / 240
                </p>
              </div>

              {uploading && (
                <div className="flex flex-col gap-1.5">
                  <div
                    className="h-1.5 overflow-hidden"
                    style={{ background: "var(--paper-soft)", border: "1.5px solid var(--rule-strong-c)" }}
                  >
                    <div
                      className="h-full"
                      style={{ width: `${progress}%`, background: "var(--gold-c)", transition: "width 0.3s" }}
                    />
                  </div>
                  <p className="c-kicker text-center" style={{ fontSize: 9, opacity: 0.7 }}>
                    UPLOADING… {progress}%
                  </p>
                </div>
              )}

              {error && (
                <p
                  className="c-kicker text-center"
                  style={{ fontSize: 10, color: "var(--ink-strong)", background: "var(--paper-warm)", padding: 8, border: "1.5px solid var(--rule-strong-c)" }}
                >
                  {error}
                </p>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  disabled={uploading}
                  className="flex-1 c-btn c-btn-outline c-btn-sm press disabled:opacity-40"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 c-btn c-btn-primary c-btn-sm press disabled:opacity-40"
                >
                  {uploading ? "UPLOADING…" : "ADD TO GALLERY"}
                </button>
              </div>
            </>
          )}

          {!file && error && (
            <p
              className="c-kicker text-center"
              style={{ fontSize: 10, color: "var(--ink-strong)", background: "var(--paper-warm)", padding: 8, border: "1.5px solid var(--rule-strong-c)" }}
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
