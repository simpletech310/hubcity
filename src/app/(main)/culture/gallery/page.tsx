"use client";

import { useState, useEffect } from "react";
import CultureHero from "@/components/culture/CultureHero";
import MuseumNav from "@/components/culture/MuseumNav";
import GalleryItemCard from "@/components/culture/GalleryItemCard";
import Chip from "@/components/ui/Chip";
import type { GalleryItem } from "@/types/database";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

const itemTypes = [
  { label: "All", value: "all", icon: "frame" },
  { label: "Artwork", value: "artwork", icon: "palette" },
  { label: "Photos", value: "photo", icon: "film" },
  { label: "Artifacts", value: "artifact", icon: "museum" },
  { label: "Documents", value: "document", icon: "scroll" },
  { label: "Posters", value: "poster", icon: "frame" },
];

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [activeType, setActiveType] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeType !== "all") params.set("type", activeType);
      const res = await fetch(`/api/culture/gallery?${params}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setLoading(false);
    }
    load();
  }, [activeType]);

  return (
    <div className="space-y-6 pb-20">
      <CultureHero
        title="Gallery"
        subtitle="Artworks, photographs, and artifacts from Compton's cultural heritage."
        imageUrl="/images/art/IMG_2777.JPG"
      />

      <div className="sticky top-0 z-30 bg-midnight/95 backdrop-blur-lg border-b border-border-subtle">
        <div className="px-5">
          <MuseumNav />
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 px-5 overflow-x-auto scrollbar-hide pb-1">
        {itemTypes.map((type) => (
          <Chip
            key={type.value}
            label={type.label}
            icon={<Icon name={type.icon as IconName} size={14} />}
            active={activeType === type.value}
            onClick={() => setActiveType(type.value)}
          />
        ))}
      </div>

      {loading ? (
        <div className="px-5 grid grid-cols-2 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton aspect-square rounded-2xl" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <section className="px-5">
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <GalleryItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : (
        <div className="text-center py-16 px-5">
          <span className="text-5xl block mb-3"><Icon name="frame" size={28} /></span>
          <p className="text-sm font-medium mb-1">Gallery coming soon</p>
          <p className="text-xs text-txt-secondary">
            Artworks and artifacts are being digitized for the collection.
          </p>
        </div>
      )}
    </div>
  );
}
