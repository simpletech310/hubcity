"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import MediaLightbox from "@/components/pulse/MediaLightbox";

interface GalleryItem {
  id: string;
  image_url: string | null;
  video_url: string | null;
  media_type: string | null;
  created_at: string;
  author: { id: string; display_name: string; avatar_url: string | null } | null;
}

interface GroupGalleryProps {
  groupId: string;
}

export default function GroupGallery({ groupId }: GroupGalleryProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState("");
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/groups/${groupId}/gallery`);
        if (res.ok) {
          const data = await res.json();
          setItems(data.media ?? []);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, [groupId]);

  const toggleVideo = useCallback((id: string) => {
    const vid = videoRefs.current[id];
    if (!vid) return;
    if (playingVideo === id) {
      vid.pause();
      setPlayingVideo(null);
    } else {
      if (playingVideo && videoRefs.current[playingVideo]) {
        videoRefs.current[playingVideo]?.pause();
      }
      vid.play();
      setPlayingVideo(id);
    }
  }, [playingVideo]);

  if (loading) {
    return (
      <div className="px-5 grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-square bg-white/[0.03] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-5">
        <div className="text-center py-12 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-white/10 mb-2">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-xs text-txt-secondary">No photos or videos yet</p>
          <p className="text-[10px] text-txt-secondary mt-1">Media from group posts will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-5 grid grid-cols-3 gap-1">
        {items.map((item) => (
          <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-black/20">
            {item.video_url ? (
              <button onClick={() => toggleVideo(item.id)} className="w-full h-full relative">
                <video
                  ref={(el) => { videoRefs.current[item.id] = el; }}
                  src={item.video_url}
                  playsInline
                  muted
                  preload="metadata"
                  onEnded={() => setPlayingVideo(null)}
                  className="w-full h-full object-cover"
                />
                {playingVideo !== item.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="6,3 20,12 6,21" /></svg>
                  </div>
                )}
              </button>
            ) : item.image_url ? (
              <button onClick={() => { setLightboxSrc(item.image_url!); setLightboxOpen(true); }} className="w-full h-full">
                <Image src={item.image_url} alt="" width={140} height={140} className="w-full h-full object-cover" />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {lightboxOpen && (
        <MediaLightbox type="image" src={lightboxSrc} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
}
