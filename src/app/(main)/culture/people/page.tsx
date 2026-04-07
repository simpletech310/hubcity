"use client";

import { useState, useEffect, useMemo } from "react";
import MuseumNav from "@/components/culture/MuseumNav";
import PersonCard from "@/components/culture/PersonCard";
import PersonCardFeatured from "@/components/culture/PersonCardFeatured";
import Spotlight from "@/components/ui/Spotlight";
import EditorialHeader from "@/components/ui/EditorialHeader";
import PullQuote from "@/components/ui/PullQuote";
import AdZone from "@/components/ui/AdZone";
import Chip from "@/components/ui/Chip";
import type { NotablePerson, NotablePersonCategory } from "@/types/database";

const categories = [
  { label: "All", value: "all", icon: "👤" },
  { label: "Music", value: "music", icon: "🎵" },
  { label: "Sports", value: "sports", icon: "🏆" },
  { label: "Politics", value: "politics", icon: "🏛️" },
  { label: "Activism", value: "activism", icon: "✊" },
  { label: "Arts", value: "arts", icon: "🎨" },
  { label: "Business", value: "business", icon: "💼" },
  { label: "Education", value: "education", icon: "🎓" },
];

const CATEGORY_ORDER: NotablePersonCategory[] = [
  "music",
  "sports",
  "politics",
  "activism",
  "arts",
  "education",
  "business",
  "other",
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

  // Group people by category for the "All" view
  const grouped = useMemo(() => {
    if (activeCategory !== "all") return null;
    const map: Partial<Record<NotablePersonCategory, NotablePerson[]>> = {};
    for (const person of people) {
      const cat = person.category;
      if (!map[cat]) map[cat] = [];
      map[cat]!.push(person);
    }
    return map;
  }, [people, activeCategory]);

  // Hero person is the first in the list (highest display_order from API)
  const heroPerson = people[0] ?? null;

  // Pull quote: grab first achievement from a music person (index 1 or fallback)
  const pullQuotePerson = useMemo(() => {
    if (activeCategory !== "all") return null;
    const musicPeople = people.filter((p) => p.category === "music");
    // Try second music person, fallback to first
    const candidate = musicPeople[1] ?? musicPeople[0] ?? null;
    if (!candidate) return null;
    const achievements = (candidate.notable_achievements ?? []) as string[];
    if (achievements.length === 0) return null;
    return { quote: achievements[0], name: candidate.name };
  }, [people, activeCategory]);

  return (
    <div className="space-y-6 pb-20">
      {/* Hero Spotlight — only in "All" view */}
      {!loading && activeCategory === "all" && heroPerson && (
        <Spotlight
          title={heroPerson.name}
          subtitle={heroPerson.title ?? undefined}
          imageUrl={heroPerson.portrait_url ?? undefined}
          href={`/culture/people/${heroPerson.slug}`}
          kicker="LEGENDS OF COMPTON"
          badge={categoryBadge[heroPerson.category]}
          height="h-[400px]"
        />
      )}

      {/* Editorial header for filtered view */}
      {!loading && activeCategory !== "all" && (
        <div className="px-5 pt-2">
          <EditorialHeader
            kicker={CATEGORY_KICKERS[activeCategory as NotablePersonCategory] ?? "NOTABLE FIGURES"}
            title={CATEGORY_TITLES[activeCategory as NotablePersonCategory] ?? "Notable People"}
            subtitle="The musicians, athletes, leaders, and visionaries who shaped Compton."
          />
        </div>
      )}

      {/* Museum Navigation */}
      <div className="px-5">
        <MuseumNav />
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 px-5 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((cat) => (
          <Chip
            key={cat.value}
            label={cat.label}
            icon={<span className="text-sm">{cat.icon}</span>}
            active={activeCategory === cat.value}
            onClick={() => setActiveCategory(cat.value)}
          />
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="px-5 space-y-4">
          <div className="skeleton h-[200px] rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        </div>
      )}

      {/* "All" view — magazine editorial sections */}
      {!loading && activeCategory === "all" && grouped && (
        <div className="space-y-10">
          {CATEGORY_ORDER.map((cat, catIndex) => {
            const catPeople = grouped[cat];
            if (!catPeople || catPeople.length === 0) return null;

            const [featured, ...rest] = catPeople;

            return (
              <div key={cat}>
                <section className="px-5 space-y-4">
                  <EditorialHeader
                    kicker={CATEGORY_KICKERS[cat]}
                    title={CATEGORY_TITLES[cat]}
                  />

                  {/* Featured person — horizontal card */}
                  <PersonCardFeatured person={featured} />

                  {/* Remaining people in 2-col grid */}
                  {rest.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {rest.map((person) => (
                        <PersonCard key={person.id} person={person} />
                      ))}
                    </div>
                  )}
                </section>

                {/* PullQuote between music and sports sections */}
                {cat === "music" && pullQuotePerson && (
                  <div className="px-5 py-6">
                    <PullQuote
                      quote={pullQuotePerson.quote}
                      attribution={pullQuotePerson.name}
                    />
                  </div>
                )}

                {/* AdZone after sports section */}
                {cat === "sports" && (
                  <div className="px-5 pt-2">
                    <AdZone zone="feed_banner" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Filtered category view — flat 2-col grid */}
      {!loading && activeCategory !== "all" && (
        <section className="px-5">
          {people.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {people.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <span className="text-5xl block mb-3">👤</span>
              <p className="text-sm font-medium mb-1">People profiles coming soon</p>
              <p className="text-xs text-txt-secondary">
                We&apos;re documenting the stories of Compton&apos;s most influential figures.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
