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

/**
 * Culture blockprint masonry: CSS columns with 2px gaps. Every tile is a
 * `c-frame` (2px ink border). Uploader is a dashed ink frame tile.
 */
export default function ProfileGalleryMasonry({
  images: initial,
  ownerName,
  isOwner,
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
      // swallow
    } finally {
      setDeletingId(null);
    }
  };

  const emptyState = !isOwner && images.length === 0;
  if (emptyState) return null;

  return (
    <div>
      <div
        className="columns-2 [column-fill:_balance]"
        style={{ columnGap: 8 }}
      >
        {isOwner && (
          <label
            className="mb-2 break-inside-avoid block cursor-pointer group"
          >
            <div
              className="relative flex flex-col items-center justify-center gap-2 py-10"
              style={{
                border: "2px dashed var(--rule-strong-c)",
                background: "var(--paper)",
              }}
            >
              <div
                className="flex items-center justify-center c-frame"
                style={{
                  width: 40,
                  height: 40,
                  background: "var(--ink-strong)",
                  color: "var(--gold-c)",
                }}
              >
                <Icon name="plus" size={18} />
              </div>
              <p
                className="c-kicker"
                style={{ color: "var(--ink-strong)" }}
              >
                {uploading ? "UPLOADING…" : "ADD PHOTOS"}
              </p>
              <p
                className="c-meta"
                style={{ color: "var(--ink-mute)" }}
              >
                JPEG / PNG / WEBP · UP TO 10MB
              </p>
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
            className="mb-2 break-inside-avoid c-frame overflow-hidden relative group"
            style={{ background: "var(--paper)" }}
          >
            <button
              onClick={() => setLightboxIdx(i)}
              className="block w-full cursor-zoom-in"
              aria-label="Open image"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url}
                alt={img.caption ?? `${ownerName} gallery ${i + 1}`}
                loading="lazy"
                className="w-full h-auto block"
                style={
                  img.width && img.height
                    ? { aspectRatio: `${img.width} / ${img.height}` }
                    : undefined
                }
              />
            </button>

            {isOwner && (
              <button
                onClick={() => handleDelete(img.id)}
                disabled={deletingId === img.id}
                aria-label="Remove photo"
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center disabled:opacity-30"
                style={{
                  width: 26,
                  height: 26,
                  background: "var(--ink-strong)",
                  color: "var(--gold-c)",
                }}
              >
                <Icon name="trash" size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {uploadError && (
        <p
          className="c-kicker mt-2"
          style={{ color: "var(--red-c)" }}
        >
          {uploadError}
        </p>
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
