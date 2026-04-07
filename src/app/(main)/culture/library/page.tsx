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
      <CultureHero title="Library" subtitle="Books, articles, and essential reading about Compton's culture and history." />

      <div className="px-5">
        <MuseumNav />
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
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <section className="px-5 space-y-2">
          {items.map((item) => (
            <LibraryItemCard key={item.id} item={item} />
          ))}
        </section>
      ) : (
        <div className="text-center py-16 px-5">
          <span className="text-5xl block mb-3"><Icon name="book" size={28} /></span>
          <p className="text-sm font-medium mb-1">Library coming soon</p>
          <p className="text-xs text-txt-secondary">
            Essential books and reading about Compton are being catalogued.
          </p>
        </div>
      )}
    </div>
  );
}
