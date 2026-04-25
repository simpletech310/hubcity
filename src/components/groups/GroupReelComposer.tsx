"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Icon from "@/components/ui/Icon";
import type { Reel } from "@/types/database";

const MAX_DURATION = 90; // seconds
const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

interface VideoMeta {
  duration: number;
  width: number;
  height: number;
}

function readVideoMeta(file: File): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = url;
    video.onloadedmetadata = () => {
      const meta = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      };
      URL.revokeObjectURL(url);
      resolve(meta);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video metadata"));
    };
  });
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
        const maxDim = 720;
        const ratio = Math.min(
          maxDim / Math.max(video.videoWidth, video.videoHeight),
          1
        );
        canvas.width = Math.round(video.videoWidth * ratio);
        canvas.height = Math.round(video.videoHeight * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          resolve(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            cleanup();
            resolve(blob);
          },
          "image/jpeg",
          0.82
        );
      } catch {
        cleanup();
        resolve(null);
      }
    };
    video.onerror = () => {
      cleanup();
      resolve(null);
    };
  });
}

interface Props {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (reel: Reel) => void;
}

/**
 * Newsprint-styled reel composer scoped to a community group. Uploads the
 * video + poster to the existing `reels` storage bucket then POSTs to
 * /api/groups/[id]/reels which writes the row with group_id.
 */
export default function GroupReelComposer({ groupId, isOpen, onClose, onCreated }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const supabase = createClient();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setMeta(null);
    setPreview(null);
    setCaption("");
    setProgress(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("Use MP4, WebM, or MOV.");
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setError("Video is too large. Max 100 MB.");
      return;
    }
    try {
      const m = await readVideoMeta(f);
      if (m.duration > MAX_DURATION + 1) {
        setError(`Moments must be ${MAX_DURATION}s or shorter.`);
        return;
      }
      setFile(f);
      setMeta(m);
      setPreview(URL.createObjectURL(f));
    } catch {
      setError("Could not read that video.");
    }
  };

  const handleUpload = async () => {
    if (!file || !meta) return;
    setUploading(true);
    setProgress(5);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to post a reel.");

      const stamp = Date.now();
      const rand = Math.random().toString(36).slice(2, 8);
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const videoPath = `${user.id}/${stamp}-${rand}.${ext}`;

      setProgress(15);
      const { error: videoErr } = await supabase.storage
        .from("reels")
        .upload(videoPath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
      if (videoErr) throw videoErr;
      setProgress(55);

      const { data: videoPublic } = supabase.storage
        .from("reels")
        .getPublicUrl(videoPath);

      let posterUrl: string | null = null;
      let posterPath: string | null = null;
      try {
        const blob = await capturePoster(file);
        if (blob) {
          posterPath = `${user.id}/${stamp}-${rand}-poster.jpg`;
          const { error: pErr } = await supabase.storage
            .from("reels")
            .upload(posterPath, blob, {
              cacheControl: "3600",
              upsert: false,
              contentType: "image/jpeg",
            });
          if (!pErr) {
            posterUrl = supabase.storage.from("reels").getPublicUrl(posterPath).data.publicUrl;
          } else {
            posterPath = null;
          }
        }
      } catch {
        // poster is best-effort
      }
      setProgress(85);

      const res = await fetch(`/api/groups/${groupId}/reels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_url: videoPublic.publicUrl,
          video_path: videoPath,
          poster_url: posterUrl,
          poster_path: posterPath,
          caption,
          duration_seconds: Number(meta.duration.toFixed(2)),
          width: meta.width,
          height: meta.height,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to post reel");
      }
      const data = await res.json();
      setProgress(100);
      onCreated(data.reel as Reel);
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
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "2px solid var(--rule-strong-c)", background: "var(--paper-warm)" }}
        >
          <div className="flex items-center gap-2">
            <Icon name="video" size={14} style={{ color: "var(--gold-c)" }} />
            <h3 className="c-kicker" style={{ fontSize: 11, color: "var(--ink-strong)" }}>
              POST A GROUP REEL
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

        {/* Body */}
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
                  <Icon name="video" size={18} style={{ color: "var(--ink-strong)" }} />
                </div>
                <p className="c-card-t" style={{ fontSize: 13, color: "var(--ink-strong)" }}>
                  Pick a video
                </p>
                <p className="c-kicker" style={{ fontSize: 9, opacity: 0.6 }}>
                  UP TO 90s · MP4 / WEBM / MOV · 100MB MAX
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </label>
          ) : (
            <>
              <div
                className="relative mx-auto"
                style={{
                  background: "#000",
                  border: "2px solid var(--rule-strong-c)",
                  aspectRatio: "9 / 16",
                  maxHeight: 380,
                  width: "auto",
                }}
              >
                {preview && (
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
                  aria-label="Remove video"
                >
                  <Icon name="close" size={12} />
                </button>
                {meta && (
                  <div
                    className="absolute bottom-2 left-2 px-2 py-0.5 c-kicker"
                    style={{
                      fontSize: 9,
                      background: "var(--paper)",
                      color: "var(--ink-strong)",
                      border: "1.5px solid var(--rule-strong-c)",
                    }}
                  >
                    {meta.duration.toFixed(1)}s · {meta.width}×{meta.height}
                  </div>
                )}
              </div>

              <div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 280))}
                  placeholder="Write a caption… #hashtags work"
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
                <p
                  className="c-kicker text-right mt-1"
                  style={{ fontSize: 9, opacity: 0.55 }}
                >
                  {caption.length} / 280
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
                      style={{
                        width: `${progress}%`,
                        background: "var(--gold-c)",
                        transition: "width 0.3s",
                      }}
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
                  {uploading ? "POSTING…" : "POST REEL"}
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
