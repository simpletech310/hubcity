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
          className="inline-flex items-center gap-1.5 press mb-3 c-kicker"
          style={{ color: "var(--ink-strong)" }}
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
        <h1 className="c-hero mb-1" style={{ fontSize: "1.75rem", color: "var(--ink-strong)" }}>
          Today&apos;s Specials
        </h1>
        <p className="c-body" style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.7 }}>
          Limited-time deals from local restaurants
        </p>
      </div>

      {/* Filter by business */}
      {bizOptions.length > 1 && (
        <div className="flex gap-2 px-5 mb-5 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setFilterBiz("all")}
            className="shrink-0 px-3.5 py-2 transition-all press"
            style={{
              background: filterBiz === "all" ? "var(--gold-c)" : "var(--paper)",
              color: "var(--ink-strong)",
              border: "2px solid var(--rule-strong-c)",
              fontFamily: "var(--font-archivo-narrow), sans-serif",
              fontSize: 12,
              fontWeight: filterBiz === "all" ? 800 : 600,
            }}
          >
            All
          </button>
          {bizOptions.map(([id, name]) => (
            <button
              key={id}
              onClick={() => setFilterBiz(id)}
              className="shrink-0 px-3.5 py-2 transition-all press"
              style={{
                background: filterBiz === id ? "var(--gold-c)" : "var(--paper)",
                color: "var(--ink-strong)",
                border: "2px solid var(--rule-strong-c)",
                fontFamily: "var(--font-archivo-narrow), sans-serif",
                fontSize: 12,
                fontWeight: filterBiz === id ? 800 : 600,
              }}
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
          <div
            className="text-center py-16 px-6"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <span className="block mb-3" style={{ color: "var(--ink-strong)" }}><Icon name="tag" size={28} /></span>
            <p className="c-card-t mb-1" style={{ fontSize: 14, color: "var(--ink-strong)" }}>No active specials</p>
            <p className="c-body" style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.7 }}>
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
                    <p className="c-meta mb-0.5" style={{ fontSize: 10 }}>
                      {bizName}
                    </p>
                    <h3 className="c-card-t mb-1" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
                      {special.title}
                    </h3>
                    {special.description && (
                      <p className="c-body mb-2 line-clamp-2" style={{ fontSize: 11, color: "var(--ink-strong)", opacity: 0.7 }}>
                        {special.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex items-baseline gap-2">
                        <span className="c-body line-through" style={{ fontSize: 12, opacity: 0.5, color: "var(--ink-strong)" }}>
                          ${(special.original_price / 100).toFixed(2)}
                        </span>
                        <span
                          className="c-card-t"
                          style={{ fontSize: 18, color: "var(--ink-strong)" }}
                        >
                          ${(special.special_price / 100).toFixed(2)}
                        </span>
                      </div>
                      <Badge label={`Until ${validUntil}`} variant="coral" />
                    </div>
                  </div>
                  {bizSlug && (
                    <Link
                      href={`/business/${bizSlug}`}
                      className="c-btn c-btn-outline c-btn-sm shrink-0"
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
