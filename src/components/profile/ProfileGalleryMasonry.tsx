"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Lightbox, { type LightboxImage } from "@/components/ui/Lightbox";
import Icon from "@/components/ui/Icon";
import type { ProfileGalleryImage } from "@/types/database";

interface ProfileGalleryMasonryProps {
  images: ProfileGalleryImage[];
  ownerName: string;
  isOwner: boolean;
  accentColor: string;
}

export default function ProfileGalleryMasonry({
  images: initial,
  ownerName,
  isOwner,
  accentColor,
}: ProfileGalleryMasonryProps) {
  const router = useRouter();
  const [images, setImages] = useState(initial);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const lightboxImages: LightboxImage[] = useMemo(
    () =>
      images.map((img, i) => ({
        url: img.image_url,
        alt: `${ownerName} gallery ${i + 1}`,
        caption: img.caption,
      })),
    [images, ownerName]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    for (const file of files) formData.append("files", file);

    try {
      const res = await fetch("/api/profile/gallery", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Upload failed");
      }
      // Refresh server data so we get canonical rows (display_order, created_at)
      router.refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this photo from your gallery?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/profile/gallery/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setImages((curr) => curr.filter((img) => img.id !== id));
    } catch {
      // swallow — keep list; server toast can be added later
    } finally {
      setDeletingId(null);
    }
  };

  const emptyState = !isOwner && images.length === 0;
  if (emptyState) return null;

  return (
    <div>
      {/* Masonry (CSS columns) */}
      <div className="columns-2 gap-2 [column-fill:_balance]">
        {isOwner && (
          <label className="mb-2 break-inside-avoid block cursor-pointer group">
            <div
              className="relative rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 py-10 transition-colors"
              style={{
                borderColor: `${accentColor}40`,
                background: `${accentColor}08`,
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: `${accentColor}20` }}
              >
                <Icon name="plus" size={18} style={{ color: accentColor }} />
              </div>
              <p className="text-[11px] font-semibold" style={{ color: accentColor }}>
                {uploading ? "Uploading…" : "Add photos"}
              </p>
              <p className="text-[9px] text-white/40">JPEG / PNG / WebP · up to 10MB</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
            </div>
          </label>
        )}

        {images.map((img, i) => (
          <div
            key={img.id}
            className="mb-2 break-inside-avoid rounded-xl overflow-hidden bg-white/5 relative group"
          >
            <button
              onClick={() => setLightboxIdx(i)}
              className="block w-full cursor-zoom-in"
              aria-label="Open image"
            >
              <img
                src={img.image_url}
                alt={img.caption ?? `${ownerName} gallery ${i + 1}`}
                loading="lazy"
                className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
                style={
                  img.width && img.height
                    ? { aspectRatio: `${img.width} / ${img.height}` }
                    : undefined
                }
              />
              {/* Subtle abstract tint on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  background: `linear-gradient(180deg, transparent 60%, ${accentColor}30 100%)`,
                }}
              />
            </button>

            {isOwner && (
              <button
                onClick={() => handleDelete(img.id)}
                disabled={deletingId === img.id}
                aria-label="Remove photo"
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/80 disabled:opacity-30"
              >
                <Icon name="trash" size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {uploadError && (
        <p className="text-xs text-coral mt-2">{uploadError}</p>
      )}

      <Lightbox
        images={lightboxImages}
        index={lightboxIdx}
        onClose={() => setLightboxIdx(null)}
        onChange={setLightboxIdx}
      />
    </div>
  );
}
