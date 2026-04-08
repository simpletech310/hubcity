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
  const charColor = charCount > 480 ? "text-coral" : charCount > 400 ? "text-gold" : "text-white/30";
  const ringColor = charCount > 480 ? "#F87171" : charCount > 400 ? "#F2A900" : "rgba(255,255,255,0.15)";

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
    <div className="glass-card-elevated rounded-2xl p-4 space-y-3">
      <textarea
        ref={textareaRef}
        placeholder="Share something with the group..."
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, maxChars))}
        className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 min-h-[80px] resize-none"
      />

      {/* Media preview */}
      {mediaPreview && (
        <div className="relative rounded-xl overflow-hidden bg-black/20">
          {uploading && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-10">
              <div className="h-full bg-gold transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          {mediaType === "image" ? (
            <img src={mediaPreview} alt="" className="w-full max-h-[300px] object-contain" />
          ) : (
            <video src={mediaPreview} className="w-full max-h-[300px]" controls muted playsInline />
          )}
          <button
            onClick={removeMedia}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80"
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
            className="p-2 rounded-lg text-white/40 hover:text-gold hover:bg-white/5 transition-colors"
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
            className="p-2 rounded-lg text-white/40 hover:text-gold hover:bg-white/5 transition-colors"
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
              <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
              <circle
                cx="14" cy="14" r="11" fill="none"
                stroke={ringColor}
                strokeWidth="2.5"
                strokeDasharray={`${charPct * 69.1} 69.1`}
                strokeLinecap="round"
              />
            </svg>
            {charCount > 380 && (
              <span className={`absolute inset-0 flex items-center justify-center text-[8px] font-bold ${charColor}`}>
                {maxChars - charCount}
              </span>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={(!body.trim() && !mediaFile) || posting || charCount > maxChars}
            className="px-4 py-2 rounded-xl bg-gold text-midnight text-xs font-bold disabled:opacity-40 press transition-opacity"
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
