"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import type { FoodSpecial } from "@/types/database";
import Icon from "@/components/ui/Icon";

export default function SpecialsPage() {
  const [specials, setSpecials] = useState<FoodSpecial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBiz, setFilterBiz] = useState<string>("all");

  useEffect(() => {
    async function fetchSpecials() {
      setLoading(true);
      const res = await fetch("/api/food/specials");
      const data = await res.json();
      setSpecials(data.specials ?? []);
      setLoading(false);
    }
    fetchSpecials();
  }, []);

  // Get unique businesses for the filter
  const bizOptions = Array.from(
    new Map(
      specials.map((s) => {
        const biz = s.business as unknown as { id: string; name: string };
        return [biz?.id ?? "unknown", biz?.name ?? "Unknown"];
      })
    )
  );

  const filtered =
    filterBiz === "all"
      ? specials
      : specials.filter(
          (s) =>
            (s.business as unknown as { id: string })?.id === filterBiz
        );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-4 mb-5">
        <Link
          href="/food"
          className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press mb-3"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          Food
        </Link>
        <h1 className="font-heading text-2xl font-bold mb-1">
          Today&apos;s Specials
        </h1>
        <p className="text-sm text-txt-secondary">
          Limited-time deals from local restaurants
        </p>
      </div>

      {/* Filter by business */}
      {bizOptions.length > 1 && (
        <div className="flex gap-2 px-5 mb-5 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setFilterBiz("all")}
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-all press ${
              filterBiz === "all"
                ? "bg-gold text-midnight"
                : "bg-white/[0.06] text-txt-secondary border border-border-subtle"
            }`}
          >
            All
          </button>
          {bizOptions.map(([id, name]) => (
            <button
              key={id}
              onClick={() => setFilterBiz(id)}
              className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-all press ${
                filterBiz === id
                  ? "bg-gold text-midnight"
                  : "bg-white/[0.06] text-txt-secondary border border-border-subtle"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Specials list */}
      <div className="px-5 space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="skeleton h-28" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-3"><Icon name="tag" size={28} /></span>
            <p className="text-sm font-medium mb-1">No active specials</p>
            <p className="text-xs text-txt-secondary">
              Check back soon for new deals
            </p>
          </div>
        ) : (
          filtered.map((special) => {
            const bizName =
              (special.business as unknown as { name: string })?.name ??
              "Local Business";
            const bizSlug =
              (special.business as unknown as { slug: string })?.slug ?? "";
            const validUntil = new Date(
              special.valid_until
            ).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });

            return (
              <Card key={special.id} hover>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-txt-secondary font-medium mb-0.5">
                      {bizName}
                    </p>
                    <h3 className="font-heading font-bold text-sm mb-1">
                      {special.title}
                    </h3>
                    {special.description && (
                      <p className="text-[11px] text-txt-secondary mb-2 line-clamp-2">
                        {special.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-txt-secondary text-xs line-through">
                          ${(special.original_price / 100).toFixed(2)}
                        </span>
                        <span className="font-heading font-bold text-gold text-lg">
                          ${(special.special_price / 100).toFixed(2)}
                        </span>
                      </div>
                      <Badge label={`Until ${validUntil}`} variant="coral" />
                    </div>
                  </div>
                  {bizSlug && (
                    <Link
                      href={`/business/${bizSlug}`}
                      className="shrink-0 bg-gold/10 text-gold text-[10px] font-semibold px-3 py-1.5 rounded-full press"
                    >
                      View
                    </Link>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
