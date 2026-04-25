"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import MediaLightbox from "@/components/pulse/MediaLightbox";
import GroupGalleryUploader from "./GroupGalleryUploader";
import Icon from "@/components/ui/Icon";

interface GalleryItem {
  id: string;
  source?: "curated" | "post";
  image_url: string | null;
  video_url: string | null;
  poster_url?: string | null;
  media_type: string | null;
  caption?: string | null;
  created_at: string;
  author: { id: string; display_name: string; avatar_url: string | null } | null;
}

interface GroupGalleryProps {
  groupId: string;
  /** Whether the viewer can curate the gallery (admin / moderator). */
  canCurate?: boolean;
  /** Current user id — used to allow uploaders to delete their own items. */
  currentUserId?: string | null;
}

export default function GroupGallery({ groupId, canCurate = false, currentUserId = null }: GroupGalleryProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploaderOpen, setUploaderOpen] = useState(false);

  // Lightbox state
  const [lightbox, setLightbox] = useState<
    | { type: "image" | "video"; src: string }
    | null
  >(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/gallery`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.media ?? []);
      }
    } catch {}
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  const openItem = useCallback((item: GalleryItem) => {
    if (item.video_url) {
      setLightbox({ type: "video", src: item.video_url });
    } else if (item.image_url) {
      setLightbox({ type: "image", src: item.image_url });
    }
  }, []);

  const handleDelete = useCallback(
    async (item: GalleryItem) => {
      if (item.source !== "curated") return; // can only delete curated rows
      if (!confirm("Remove this item from the gallery?")) return;
      const res = await fetch(`/api/groups/${groupId}/gallery/${item.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      }
    },
    [groupId]
  );

  return (
    <>
      {/* Curate (admin) action bar */}
      {canCurate && (
        <div className="px-5 mb-3">
          <button
            onClick={() => setUploaderOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 c-kicker press"
            style={{
              fontSize: 11,
              color: "var(--ink-strong)",
              border: "2px dashed var(--rule-strong-c)",
              background: "var(--paper-warm)",
            }}
          >
            <Icon name="plus" size={14} style={{ color: "var(--gold-c)" }} />
            ADD PHOTO OR VIDEO
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          className="px-5 grid grid-cols-3"
          style={{ gap: "2px", background: "var(--rule-strong-c)", border: "2px solid var(--rule-strong-c)" }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse"
              style={{ background: "var(--paper-soft)" }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="px-5">
          <div
            className="text-center py-12"
            style={{ background: "var(--paper-soft)", border: "2px solid var(--rule-strong-c)" }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--ink-strong)"
              strokeWidth="1.5"
              className="mx-auto mb-3"
              style={{ opacity: 0.35 }}
            >
              <rect x="3" y="3" width="18" height="18" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="c-kicker" style={{ opacity: 0.7 }}>No photos · no videos</p>
            <p className="c-serif-it mt-1" style={{ fontSize: 12 }}>
              {canCurate
                ? "Add the first photo or video above."
                : "Media from group posts will appear here."}
            </p>
          </div>
        </div>
      )}

      {/* Grid */}
      {!loading && items.length > 0 && (
        <div className="px-5">
          <div
            className="grid grid-cols-3"
            style={{
              gap: "2px",
              background: "var(--rule-strong-c)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            {items.map((item) => {
              const canRemove =
                item.source === "curated" &&
                (canCurate || (currentUserId && item.author?.id === currentUserId));
              return (
                <div
                  key={item.id}
                  className="relative aspect-square overflow-hidden"
                  style={{ background: "var(--paper-soft)" }}
                >
                  <button
                    onClick={() => openItem(item)}
                    className="block w-full h-full relative"
                    aria-label={item.video_url ? "Play video" : "View image"}
                  >
                    {item.video_url ? (
                      item.poster_url ? (
                        <Image
                          src={item.poster_url}
                          alt=""
                          width={140}
                          height={140}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={item.video_url}
                          playsInline
                          muted
                          preload="metadata"
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt=""
                        width={140}
                        height={140}
                        className="w-full h-full object-cover"
                      />
                    ) : null}

                    {/* Play badge for videos */}
                    {item.video_url && (
                      <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                          background:
                            "color-mix(in srgb, var(--ink-strong) 18%, transparent)",
                        }}
                      >
                        <div
                          className="w-9 h-9 flex items-center justify-center"
                          style={{
                            background: "var(--gold-c)",
                            border: "2px solid var(--ink-strong)",
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--ink-strong)">
                            <polygon points="6,3 20,12 6,21" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Curated chip */}
                    {item.source === "curated" && (
                      <span
                        className="absolute top-1 left-1 c-kicker"
                        style={{
                          fontSize: 8,
                          background: "var(--gold-c)",
                          color: "var(--ink-strong)",
                          padding: "1px 4px",
                          letterSpacing: "0.08em",
                          border: "1px solid var(--ink-strong)",
                        }}
                      >
                        PINNED
                      </span>
                    )}
                  </button>

                  {/* Delete control (curated only, admin or uploader) */}
                  {canRemove && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center press"
                      style={{
                        background: "var(--paper)",
                        border: "1.5px solid var(--rule-strong-c)",
                        color: "var(--ink-strong)",
                      }}
                      aria-label="Remove from gallery"
                    >
                      <Icon name="trash" size={10} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <MediaLightbox
          type={lightbox.type}
          src={lightbox.src}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Admin uploader */}
      {canCurate && (
        <GroupGalleryUploader
          groupId={groupId}
          isOpen={uploaderOpen}
          onClose={() => setUploaderOpen(false)}
          onUploaded={(item) => {
            setItems((prev) => [
              {
                id: item.id,
                source: "curated",
                media_type: item.media_type,
                image_url: item.media_type === "image" ? item.media_url : null,
                video_url: item.media_type === "video" ? item.media_url : null,
                poster_url: item.poster_url,
                caption: item.caption,
                created_at: item.created_at,
                author: item.author ?? null,
              },
              ...prev,
            ]);
          }}
        />
      )}
    </>
  );
}
