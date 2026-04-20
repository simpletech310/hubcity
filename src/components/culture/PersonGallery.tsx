"use client";

import { useMemo, useState } from "react";
import Lightbox, { type LightboxImage } from "@/components/ui/Lightbox";

interface PersonGalleryProps {
  images: string[];
  name: string;
}

export default function PersonGallery({ images, name }: PersonGalleryProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const lightboxImages: LightboxImage[] = useMemo(
    () => images.map((url, i) => ({ url, alt: `${name} photo ${i + 1}` })),
    [images, name]
  );

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {images.map((url, i) => (
          <button
            key={i}
            onClick={() => setLightboxIdx(i)}
            className="aspect-square rounded-xl overflow-hidden bg-white/5 group"
          >
            <img
              src={url}
              alt={`${name} photo ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </button>
        ))}
      </div>

      <Lightbox
        images={lightboxImages}
        index={lightboxIdx}
        onClose={() => setLightboxIdx(null)}
        onChange={setLightboxIdx}
      />
    </>
  );
}
