"use client";

import { useState, useRef } from "react";
import { uploadPostImage, uploadPostVideo } from "@/lib/upload";

interface GroupPostComposerProps {
  groupId: string;
  userId: string;
  onPost: (post: Record<string, unknown>) => void;
}

export default function GroupPostComposer({ groupId, userId, onPost }: GroupPostComposerProps) {
  const [body, setBody] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [posting, setPosting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const maxChars = 500;
  const charCount = body.length;
  const charPct = Math.min(charCount / maxChars, 1);
  const ringColor =
    charCount > 480 ? "var(--red-c, #B8322C)" :
    charCount > 400 ? "var(--gold-c)" :
    "var(--rule-strong-c)";

  const handleMedia = (file: File, type: "image" | "video") => {
    setMediaFile(file);
    setMediaType(type);
    const reader = new FileReader();
    reader.onload = (e) => setMediaPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setUploadProgress(0);
  };

  const handleSubmit = async () => {
    if ((!body.trim() && !mediaFile) || posting) return;
    setPosting(true);

    let image_url: string | null = null;
    let video_url: string | null = null;

    if (mediaFile) {
      setUploading(true);
      try {
        if (mediaType === "image") {
          image_url = await uploadPostImage(mediaFile, userId);
        } else if (mediaType === "video") {
          video_url = await uploadPostVideo(mediaFile, userId);
        }
      } catch {
        setUploading(false);
        setPosting(false);
        return;
      }
      setUploading(false);
    }

    try {
      const res = await fetch(`/api/groups/${groupId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          image_url,
          video_url,
          media_type: image_url ? "image" : video_url ? "video" : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onPost(data.post);
        setBody("");
        removeMedia();
      }
    } catch {
      // silent fail
    }
    setPosting(false);
  };

  return (
    <div
      className="p-4 space-y-3"
      style={{
        background: "var(--paper)",
        border: "2px solid var(--rule-strong-c)",
      }}
    >
      <textarea
        ref={textareaRef}
        placeholder="Share something with the group…"
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, maxChars))}
        className="w-full px-4 py-3 focus:outline-none min-h-[80px] resize-none"
        style={{
          background: "var(--paper-warm)",
          border: "2px solid var(--rule-strong-c)",
          color: "var(--ink-strong)",
          fontFamily: "var(--font-body), Inter, sans-serif",
          fontSize: 14,
        }}
      />

      {/* Media preview */}
      {mediaPreview && (
        <div
          className="relative overflow-hidden"
          style={{
            background: "var(--paper-soft)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          {uploading && (
            <div
              className="absolute top-0 left-0 right-0 h-1 z-10"
              style={{ background: "var(--paper-soft)" }}
            >
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%`, background: "var(--gold-c)" }}
              />
            </div>
          )}
          {mediaType === "image" ? (
            <img src={mediaPreview} alt="" className="w-full max-h-[300px] object-contain" />
          ) : (
            <video src={mediaPreview} className="w-full max-h-[300px]" controls muted playsInline />
          )}
          <button
            onClick={removeMedia}
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center press"
            style={{
              background: "var(--ink-strong)",
              color: "var(--paper)",
              border: "2px solid var(--paper)",
            }}
            aria-label="Remove media"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Photo button */}
          <button
            onClick={() => imageInputRef.current?.click()}
            className="p-2 press"
            style={{ color: "var(--ink-strong)" }}
            aria-label="Add photo"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
            </svg>
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f && f.size <= 5 * 1024 * 1024) handleMedia(f, "image");
              e.target.value = "";
            }}
          />

          {/* Video button */}
          <button
            onClick={() => videoInputRef.current?.click()}
            className="p-2 press"
            style={{ color: "var(--ink-strong)" }}
            aria-label="Add video"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
          </button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f && f.size <= 50 * 1024 * 1024) handleMedia(f, "video");
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Character counter ring */}
          <div className="relative w-7 h-7">
            <svg viewBox="0 0 28 28" className="w-7 h-7 -rotate-90">
              <circle cx="14" cy="14" r="11" fill="none" stroke="var(--rule-strong-c)" strokeOpacity="0.18" strokeWidth="2.5" />
              <circle
                cx="14" cy="14" r="11" fill="none"
                stroke={ringColor}
                strokeWidth="2.5"
                strokeDasharray={`${charPct * 69.1} 69.1`}
                strokeLinecap="round"
              />
            </svg>
            {charCount > 380 && (
              <span
                className="absolute inset-0 flex items-center justify-center c-kicker"
                style={{ fontSize: 8, color: "var(--ink-strong)" }}
              >
                {maxChars - charCount}
              </span>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={(!body.trim() && !mediaFile) || posting || charCount > maxChars}
            className="c-btn c-btn-primary c-btn-sm press disabled:opacity-40"
          >
            {posting ? "POSTING…" : "POST"}
          </button>
        </div>
      </div>
    </div>
  );
}
