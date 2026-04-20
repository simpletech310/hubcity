"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Icon from "@/components/ui/Icon";

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
    video.crossOrigin = "anonymous";
    video.src = url;

    const cleanup = () => URL.revokeObjectURL(url);

    video.onloadedmetadata = () => {
      // Seek ~0.5s in (or 5% of duration, whichever is smaller)
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
        // Scale down poster to max 720px on shortest side
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

interface ReelComposerProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function ReelComposer({ onSuccess, onClose }: ReelComposerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const supabase = createClient();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [caption, setCaption] = useState("");
  const [isStory, setIsStory] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("Use MP4, WebM, or MOV.");
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setError(`Video is too large. Max 100 MB.`);
      return;
    }

    try {
      const m = await readVideoMeta(f);
      if (m.duration > MAX_DURATION + 1) {
        setError(`Reels must be ${MAX_DURATION}s or shorter.`);
        return;
      }
      setFile(f);
      setMeta(m);
      setPreview(URL.createObjectURL(f));
    } catch {
      setError("Could not read that video.");
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setMeta(null);
    setPreview(null);
    setCaption("");
    setIsStory(false);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

      // 1. Upload video directly to Supabase Storage
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

      // 2. Generate + upload poster (best effort)
      let posterUrl: string | null = null;
      let posterPath: string | null = null;
      try {
        const posterBlob = await capturePoster(file);
        if (posterBlob) {
          posterPath = `${user.id}/${stamp}-${rand}-poster.jpg`;
          const { error: posterErr } = await supabase.storage
            .from("reels")
            .upload(posterPath, posterBlob, {
              cacheControl: "3600",
              upsert: false,
              contentType: "image/jpeg",
            });
          if (!posterErr) {
            posterUrl = supabase.storage
              .from("reels")
              .getPublicUrl(posterPath).data.publicUrl;
          } else {
            posterPath = null;
          }
        }
      } catch {
        // non-fatal
      }
      setProgress(80);

      // 3. Create DB row
      const res = await fetch("/api/reels", {
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
          is_story: isStory,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to save reel");
      }
      setProgress(100);
      reset();
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {!file ? (
        <label className="block cursor-pointer">
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.03] py-12 transition-colors hover:border-gold/40 hover:bg-gold/[0.04]"
          >
            <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center">
              <Icon name="video" size={22} className="text-gold" />
            </div>
            <p className="text-sm font-semibold text-white">Pick a video</p>
            <p className="text-[11px] text-white/50">
              Up to 90s · MP4 / WebM / MOV · 100 MB max
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
          {/* Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-[420px] mx-auto">
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
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black disabled:opacity-40"
              aria-label="Remove video"
            >
              <Icon name="close" size={14} />
            </button>
            {meta && (
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-mono text-white">
                {meta.duration.toFixed(1)}s · {meta.width}×{meta.height}
              </div>
            )}
          </div>

          {/* Caption */}
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 280))}
            placeholder="Write a caption... #hashtags work"
            rows={2}
            disabled={uploading}
            className="w-full bg-white/[0.05] border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 resize-none"
          />
          <p className="text-[10px] text-white/40 text-right -mt-2">
            {caption.length} / 280
          </p>

          {/* Story toggle */}
          <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:bg-white/[0.05] transition-colors">
            <input
              type="checkbox"
              checked={isStory}
              onChange={(e) => setIsStory(e.target.checked)}
              disabled={uploading}
              className="accent-gold w-4 h-4"
            />
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-white">
                Post as Story
              </p>
              <p className="text-[11px] text-white/50">
                Disappears in 24 hours. Leave off for a permanent Reel.
              </p>
            </div>
          </label>

          {uploading && (
            <div className="flex flex-col gap-1.5">
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold to-gold-light transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-white/50 text-center">
                Uploading… {progress}%
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-coral text-center">{error}</p>
          )}

          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                disabled={uploading}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] border border-border-subtle text-white font-semibold text-sm press hover:bg-white/[0.08] transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-light text-midnight font-bold text-sm press disabled:opacity-40"
            >
              {uploading ? "Posting…" : isStory ? "Post Story" : "Post Reel"}
            </button>
          </div>
        </>
      )}

      {!file && error && (
        <p className="text-xs text-coral text-center">{error}</p>
      )}
    </div>
  );
}
