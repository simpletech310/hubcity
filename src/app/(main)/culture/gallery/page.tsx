"use client";

import { useState, useEffect } from "react";
import CultureHero from "@/components/culture/CultureHero";
import MuseumNav from "@/components/culture/MuseumNav";
import GalleryItemCard from "@/components/culture/GalleryItemCard";
import Chip from "@/components/ui/Chip";
import type { GalleryItem } from "@/types/database";

const itemTypes = [
  { label: "All", value: "all", icon: "🖼️" },
  { label: "Artwork", value: "artwork", icon: "🎨" },
  { label: "Photos", value: "photo", icon: "📷" },
  { label: "Artifacts", value: "artifact", icon: "🏺" },
  { label: "Documents", value: "document", icon: "📜" },
  { label: "Posters", value: "poster", icon: "🪧" },
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
      <CultureHero title="Gallery" subtitle="Artworks, photographs, and artifacts from Compton's cultural heritage." />

      <div className="px-5">
        <MuseumNav />
      </div>

      {/* Type filter */}
      <div className="flex gap-2 px-5 overflow-x-auto scrollbar-hide pb-1">
        {itemTypes.map((type) => (
          <Chip
            key={type.value}
            label={type.label}
            icon={<span className="text-sm">{type.icon}</span>}
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
          <span className="text-5xl block mb-3">🖼️</span>
          <p className="text-sm font-medium mb-1">Gallery coming soon</p>
          <p className="text-xs text-txt-secondary">
            Artworks and artifacts are being digitized for the collection.
          </p>
        </div>
      )}
    </div>
  );
}
