"use client";

import { useState, useEffect } from "react";
import CultureHero from "@/components/culture/CultureHero";
import MuseumNav from "@/components/culture/MuseumNav";
import PersonCard from "@/components/culture/PersonCard";
import PersonCardFeatured from "@/components/culture/PersonCardFeatured";
import Spotlight from "@/components/ui/Spotlight";
import EditorialHeader from "@/components/ui/EditorialHeader";
import AdZone from "@/components/ui/AdZone";
import Chip from "@/components/ui/Chip";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import type { NotablePerson, NotablePersonCategory } from "@/types/database";

const categories: { label: string; value: string; iconName: IconName }[] = [
  { label: "All", value: "all", iconName: "person" },
  { label: "Music", value: "music", iconName: "music" },
  { label: "Sports", value: "sports", iconName: "trophy" },
  { label: "Politics", value: "politics", iconName: "landmark" },
  { label: "Activism", value: "activism", iconName: "megaphone" },
  { label: "Arts", value: "arts", iconName: "palette" },
  { label: "Business", value: "business", iconName: "briefcase" },
  { label: "Education", value: "education", iconName: "graduation" },
];

const CATEGORY_KICKERS: Record<NotablePersonCategory, string> = {
  music: "THE SOUND OF COMPTON",
  sports: "CHAMPIONS OF THE COURT",
  politics: "VOICES OF THE PEOPLE",
  activism: "AGENTS OF CHANGE",
  arts: "CREATIVE VISIONARIES",
  education: "SHAPING MINDS",
  business: "BUILDING COMPTON",
  other: "NOTABLE FIGURES",
};

const CATEGORY_TITLES: Record<NotablePersonCategory, string> = {
  music: "Music",
  sports: "Sports",
  politics: "Politics",
  activism: "Activism",
  arts: "Arts",
  education: "Education",
  business: "Business",
  other: "Notable Figures",
};

const categoryBadge: Record<NotablePersonCategory, { label: string; variant: "gold" | "emerald" | "cyan" | "coral" | "purple" }> = {
  music: { label: "Music", variant: "gold" },
  sports: { label: "Sports", variant: "emerald" },
  politics: { label: "Politics", variant: "purple" },
  activism: { label: "Activism", variant: "coral" },
  arts: { label: "Arts", variant: "cyan" },
  business: { label: "Business", variant: "gold" },
  education: { label: "Education", variant: "emerald" },
  other: { label: "Notable", variant: "cyan" },
};

export default function PeoplePage() {
  const [people, setPeople] = useState<NotablePerson[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.set("category", activeCategory);
      const res = await fetch(`/api/culture/people?${params}`);
      const data = await res.json();
      setPeople(data.people ?? []);
      setLoading(false);
    }
    load();
  }, [activeCategory]);

  const heroPerson = people[0] ?? null;

  return (
    <div className="space-y-6 pb-20">
      <CultureHero
        title="Notable People"
        subtitle="The musicians, athletes, leaders, and visionaries who shaped Compton."
        imageUrl="/images/art/IMG_2775.JPG"
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

      {/* Hero Spotlight — only in "All" view */}
      {!loading && activeCategory === "all" && heroPerson && (
        <div className="px-5">
          <Spotlight
            title={heroPerson.name}
            subtitle={heroPerson.title ?? undefined}
            imageUrl={heroPerson.portrait_url ?? undefined}
            href={`/culture/people/${heroPerson.slug}`}
            kicker="LEGENDS OF COMPTON"
            badge={categoryBadge[heroPerson.category]}
            height="h-[340px]"
          />
        </div>
      )}

      {/* Editorial header for filtered view */}
      {!loading && activeCategory !== "all" && (
        <div className="px-5">
          <EditorialHeader
            kicker={CATEGORY_KICKERS[activeCategory as NotablePersonCategory] ?? "NOTABLE FIGURES"}
            title={CATEGORY_TITLES[activeCategory as NotablePersonCategory] ?? "Notable People"}
          />
        </div>
      )}

      {/* Category filter chips */}
      <div className="flex gap-2 px-5 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((cat) => (
          <Chip
            key={cat.value}
            label={cat.label}
            iconName={cat.iconName}
            active={activeCategory === cat.value}
            onClick={() => setActiveCategory(cat.value)}
          />
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="px-5 space-y-4">
          <div className="skeleton h-[200px]" />
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton aspect-square" />
            ))}
          </div>
        </div>
      )}

      {/* "All" view — Instagram Explorer-style 3-column grid */}
      {!loading && activeCategory === "all" && (
        <div className="space-y-6">
          <section className="px-3">
            {people.length > 1 ? (
              <div className="grid grid-cols-3 gap-1">
                {people.slice(1).map((person) => (
                  <PersonCard key={person.id} person={person} compact />
                ))}
              </div>
            ) : people.length === 0 ? (
              <div
                className="text-center py-16 px-6 mx-2"
                style={{
                  background: "var(--paper)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <Icon name="person" size={48} style={{ color: "var(--ink-strong)" }} className="mx-auto mb-3" />
                <p className="c-card-t mb-1" style={{ fontSize: 14, color: "var(--ink-strong)" }}>People profiles coming soon</p>
                <p className="c-body" style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.7 }}>
                  We&apos;re documenting the stories of Compton&apos;s most influential figures.
                </p>
              </div>
            ) : null}
          </section>

          <div className="px-5">
            <AdZone zone="feed_banner" />
          </div>
        </div>
      )}

      {/* Filtered category view — 2-col grid with full cards */}
      {!loading && activeCategory !== "all" && (
        <section className="px-5">
          {people.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {people.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          ) : (
            <div
              className="text-center py-16 px-6"
              style={{
                background: "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              <Icon name="person" size={48} style={{ color: "var(--ink-strong)" }} className="mx-auto mb-3" />
              <p className="c-card-t mb-1" style={{ fontSize: 14, color: "var(--ink-strong)" }}>People profiles coming soon</p>
              <p className="c-body" style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.7 }}>
                We&apos;re documenting the stories of Compton&apos;s most influential figures.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
