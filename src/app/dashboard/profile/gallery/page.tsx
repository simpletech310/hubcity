"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
}

/**
 * /dashboard/profile/gallery — uploader for the profile photo wall
 * (`profile_gallery_images`). Storage uploads + DB insert are handled
 * by the existing /api/profile/gallery POST (multipart formdata).
 *
 * Citizens, creators, and resource providers all get the same surface.
 */
export default function GalleryUploaderPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/profile/gallery", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setImages(data.images ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      for (const f of Array.from(files)) fd.append("files", f);
      const res = await fetch("/api/profile/gallery", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
      } else {
        await refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this image?")) return;
    try {
      const res = await fetch(`/api/profile/gallery/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setImages((prev) => prev.filter((i) => i.id !== id));
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="px-5 pb-12 pt-6 mx-auto max-w-2xl">
      <div className="mb-5">
        <Link
          href="/dashboard"
          className="c-kicker"
          style={{ color: "var(--ink-mute)" }}
        >
          ← DASHBOARD
        </Link>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 32, color: "var(--ink-strong)" }}
        >
          Photo Wall
        </h1>
        <p
          className="c-serif-it mt-1"
          style={{ fontSize: 13, color: "var(--ink-mute)" }}
        >
          Curate a masonry grid that surfaces on your public profile. Upload
          JPEG / PNG / WebP up to 10 MB.
        </p>
      </div>

      <label
        className="block p-5 mb-4 cursor-pointer text-center"
        style={{
          background: "var(--paper-warm)",
          border: "2px dashed var(--rule-strong-c)",
        }}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
        <p
          className="c-kicker"
          style={{ color: "var(--ink-strong)", fontSize: 12 }}
        >
          {uploading ? "UPLOADING…" : "+ ADD PHOTOS"}
        </p>
        <p
          className="c-serif-it mt-1"
          style={{ fontSize: 12, color: "var(--ink-mute)" }}
        >
          Tap to pick one or more files
        </p>
      </label>

      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg"
          style={{
            background: "rgba(232,72,85,0.08)",
            color: "var(--red-c, #E84855)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="c-kicker" style={{ color: "var(--ink-mute)" }}>
          LOADING…
        </p>
      ) : images.length === 0 ? (
        <div
          className="p-6 text-center"
          style={{
            background: "var(--paper)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <p className="c-card-t" style={{ color: "var(--ink-strong)" }}>
            Your photo wall is empty.
          </p>
          <p
            className="c-serif-it mt-1"
            style={{ fontSize: 13, color: "var(--ink-mute)" }}
          >
            Drop a few favorites — they&rsquo;ll surface on your public
            profile.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative aspect-square overflow-hidden"
              style={{ border: "2px solid var(--rule-strong-c)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url}
                alt={img.caption ?? ""}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute top-1 right-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: "var(--ink-strong)",
                  color: "var(--gold-c)",
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
