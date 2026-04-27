"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CultureHero from "@/components/culture/CultureHero";
import MuseumNav from "@/components/culture/MuseumNav";
import PersonCard from "@/components/culture/PersonCard";
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

const CATEGORY_LABEL: Record<NotablePersonCategory, string> = {
  music: "MUSIC",
  sports: "SPORTS",
  politics: "POLITICS",
  activism: "ACTIVISM",
  arts: "ARTS",
  education: "EDUCATION",
  business: "BUSINESS",
  other: "NOTABLE",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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
  const rest = people.slice(1);

  const sectionKicker =
    activeCategory === "all"
      ? "§ LEGENDS OF COMPTON"
      : `§ ${CATEGORY_KICKERS[activeCategory as NotablePersonCategory] ?? "NOTABLE FIGURES"}`;

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

      {/* Category filter chips — editorial pill row */}
      <div className="flex gap-2 px-5 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((cat) => {
          const active = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
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
              <Icon name={cat.iconName} size={13} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="px-5 space-y-4">
          <div
            style={{
              aspectRatio: "3 / 2",
              background: "var(--paper-warm)",
              border: "2px solid var(--rule-strong-c)",
            }}
          />
          <div className="grid grid-cols-3 gap-1">
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
        </div>
      )}

      {/* Section kicker bar */}
      {!loading && people.length > 0 && (
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
              {sectionKicker}
            </span>
            <span
              className="c-badge c-badge-gold tabular-nums ml-auto"
              style={{ fontSize: 9 }}
            >
              {people.length} {people.length === 1 ? "FIGURE" : "FIGURES"}
            </span>
          </div>
        </div>
      )}

      {/* Editorial featured spotlight — full-bleed magazine cover */}
      {!loading && heroPerson && (
        <section className="px-5">
          <Link
            href={`/culture/people/${heroPerson.slug}`}
            className="group block relative overflow-hidden press"
            style={{
              aspectRatio: "3 / 2",
              background: "var(--ink-strong)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            {heroPerson.portrait_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroPerson.portrait_url}
                alt={heroPerson.name}
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  color: "var(--gold-c)",
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: 120,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                {initials(heroPerson.name)}
              </div>
            )}

            {/* Ink wash */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, rgba(26,21,18,0.2) 0%, transparent 40%, rgba(26,21,18,0.92) 100%)",
              }}
            />

            {/* Category chip */}
            <span
              className="absolute top-3 left-3 c-badge c-badge-gold"
              style={{ fontSize: 10 }}
            >
              § {CATEGORY_LABEL[heroPerson.category] ?? heroPerson.category.toUpperCase()}
            </span>

            {/* Featured chip */}
            <span
              className="absolute top-3 right-3 c-badge c-badge-gold inline-flex items-center gap-1"
              style={{ fontSize: 10 }}
            >
              <Icon name="star" size={10} />
              FEATURE
            </span>

            {/* Title block */}
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h2
                className="c-hero"
                style={{
                  fontSize: 32,
                  lineHeight: 0.95,
                  letterSpacing: "-0.012em",
                  color: "#fff",
                }}
              >
                {heroPerson.name.toUpperCase()}.
              </h2>
              {heroPerson.title && (
                <p
                  className="c-serif-it mt-1.5 line-clamp-2"
                  style={{
                    fontSize: 13,
                    lineHeight: 1.35,
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {heroPerson.title}
                </p>
              )}
            </div>
          </Link>
        </section>
      )}

      {/* "All" view — 3-column explorer grid for the rest */}
      {!loading && activeCategory === "all" && rest.length > 0 && (
        <section className="px-3">
          <div className="grid grid-cols-3 gap-1">
            {rest.map((person) => (
              <PersonCard key={person.id} person={person} compact />
            ))}
          </div>
        </section>
      )}

      {/* Filtered category view — 2-col grid with full cards */}
      {!loading && activeCategory !== "all" && rest.length > 0 && (
        <section className="px-5">
          <div className="grid grid-cols-2 gap-3">
            {rest.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!loading && people.length === 0 && (
        <section className="px-5">
          <div
            className="text-center py-16 px-6"
            style={{
              background: "var(--paper-warm)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <Icon
              name="person"
              size={32}
              style={{ color: "var(--ink-strong)" }}
              className="mx-auto mb-3"
            />
            <p
              className="c-card-t mb-1"
              style={{ fontSize: 14, color: "var(--ink-strong)" }}
            >
              People profiles coming soon
            </p>
            <p
              className="c-body"
              style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.7 }}
            >
              We&apos;re documenting the stories of Compton&apos;s most influential figures.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
