"use client";

import { useState, useEffect } from "react";
import CultureHero from "@/components/culture/CultureHero";
import MuseumNav from "@/components/culture/MuseumNav";
import LibraryItemCard from "@/components/culture/LibraryItemCard";
import Chip from "@/components/ui/Chip";
import type { LibraryItem } from "@/types/database";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

const itemTypes = [
  { label: "All", value: "all", icon: "book" },
  { label: "Books", value: "book", icon: "book" },
  { label: "Articles", value: "article", icon: "document" },
  { label: "Docs", value: "documentary", icon: "film" },
  { label: "Academic", value: "academic", icon: "graduation" },
  { label: "Archives", value: "archive", icon: "scroll" },
];

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [activeType, setActiveType] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeType !== "all") params.set("type", activeType);
      const res = await fetch(`/api/culture/library?${params}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setLoading(false);
    }
    load();
  }, [activeType]);

  return (
    <div className="space-y-6 pb-20">
      <CultureHero
        title="Library"
        subtitle="Books, articles, and essential reading about Compton's culture and history."
        imageUrl="/images/art/IMG_2792.JPG"
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
        <div className="px-5 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <section className="px-5 space-y-2">
          {items.map((item) => (
            <LibraryItemCard key={item.id} item={item} />
          ))}
        </section>
      ) : (
        <div
          className="text-center py-16 px-5 mx-5"
          style={{
            background: "var(--paper)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <span className="block mb-3" style={{ color: "var(--ink-strong)" }}><Icon name="book" size={28} /></span>
          <p className="c-card-t mb-1" style={{ fontSize: 14, color: "var(--ink-strong)" }}>Library coming soon</p>
          <p className="c-body" style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.7 }}>
            Essential books and reading about Compton are being catalogued.
          </p>
        </div>
      )}
    </div>
  );
}
