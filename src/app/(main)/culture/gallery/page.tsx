"use client";

import { useState, useEffect } from "react";
import CultureHero from "@/components/culture/CultureHero";
import MuseumNav from "@/components/culture/MuseumNav";
import GalleryItemCard from "@/components/culture/GalleryItemCard";
import type { GalleryItem } from "@/types/database";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

const itemTypes: { label: string; value: string; icon: IconName }[] = [
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

      <div
        className="sticky top-0 z-30"
        style={{
          background: "var(--paper)",
          borderBottom: "2px solid var(--rule-strong-c)",
        }}
      >
        <div className="px-5">
          <MuseumNav />
        </div>
      </div>

      {/* Type filter — editorial pills */}
      <div className="flex gap-2 px-5 overflow-x-auto scrollbar-hide pb-1">
        {itemTypes.map((type) => {
          const active = activeType === type.value;
          return (
            <button
              key={type.value}
              onClick={() => setActiveType(type.value)}
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 press"
              style={{
                padding: "7px 12px",
                background: active ? "var(--gold-c)" : "var(--paper-warm)",
                color: "var(--ink-strong)",
                border: "2px solid var(--rule-strong-c)",
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
                fontWeight: 800,
                fontSize: 10.5,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                boxShadow: active ? "0 2px 0 rgba(0,0,0,0.18)" : "none",
              }}
            >
              <Icon name={type.icon} size={13} />
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Section kicker */}
      {!loading && items.length > 0 && (
        <div className="px-5">
          <div
            className="flex items-baseline gap-3 pb-2"
            style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
          >
            <span
              className="c-kicker"
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                color: "var(--ink-strong)",
                opacity: 0.7,
              }}
            >
              § FROM THE COLLECTION
            </span>
            <span
              className="c-badge c-badge-gold tabular-nums ml-auto"
              style={{ fontSize: 9 }}
            >
              {items.length} {items.length === 1 ? "WORK" : "WORKS"}
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="px-5 grid grid-cols-2 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-square"
              style={{
                background: "var(--paper-warm)",
                border: "2px solid var(--rule-strong-c)",
              }}
            />
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
        <div
          className="text-center py-16 px-5 mx-5"
          style={{
            background: "var(--paper)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <span className="block mb-3" style={{ color: "var(--ink-strong)" }}><Icon name="frame" size={28} /></span>
          <p className="c-card-t mb-1" style={{ fontSize: 14, color: "var(--ink-strong)" }}>Gallery coming soon</p>
          <p className="c-body" style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.7 }}>
            Artworks and artifacts are being digitized for the collection.
          </p>
        </div>
      )}
    </div>
  );
}
