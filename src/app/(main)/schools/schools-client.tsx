"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { School, SchoolLevel } from "./page";

const levelLabels: Record<SchoolLevel, string> = {
  high_school: "High School",
  middle_school: "Middle School",
  elementary: "Elementary",
  college: "College",
};

const levelColors: Record<SchoolLevel, string> = {
  high_school: "#3B82F6",
  middle_school: "#06B6D4",
  elementary: "#22C55E",
  college: "#F2A900",
};

const levelIcons: Record<SchoolLevel, string> = {
  high_school: "M3 21V7l9-4 9 4v14M3 21h18M9 21V11h6v10M12 3v4",
  middle_school: "M12 3L2 9l10 6 10-6-10-6zM2 17l10 6 10-6M2 13l10 6 10-6",
  elementary: "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z",
  college: "M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12 12 0 01.665 6.479A12 12 0 0112 20.5a12 12 0 01-6.824-2.943 12 12 0 01.665-6.479L12 14z",
};

type FilterLevel = "all" | SchoolLevel;

const filterChips: { label: string; value: FilterLevel; icon: string }[] = [
  { label: "All Schools", value: "all", icon: "M3 21V7l9-4 9 4v14" },
  { label: "High Schools", value: "high_school", icon: levelIcons.high_school },
  { label: "Middle", value: "middle_school", icon: levelIcons.middle_school },
  { label: "Elementary", value: "elementary", icon: levelIcons.elementary },
  { label: "College", value: "college", icon: levelIcons.college },
];

function getSchoolColors(school: School): [string, string] {
  if (school.colors && school.colors.length >= 2) {
    return [school.colors[0].hex, school.colors[1].hex];
  }
  if (school.colors && school.colors.length === 1) {
    return [school.colors[0].hex, school.colors[0].hex + "60"];
  }
  // Fallback based on level
  const fallback: Record<SchoolLevel, [string, string]> = {
    high_school: ["#3B82F6", "#60A5FA"],
    middle_school: ["#06B6D4", "#67E8F9"],
    elementary: ["#22C55E", "#86EFAC"],
    college: ["#F2A900", "#FCD34D"],
  };
  return fallback[school.level];
}

function getColorNames(school: School): string | null {
  if (!school.colors || school.colors.length === 0) return null;
  return school.colors.map((c) => c.name).join(" & ");
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={star <= Math.round(rating) ? "#F2A900" : "none"}
          stroke={star <= Math.round(rating) ? "#F2A900" : "rgba(255,255,255,0.2)"}
          strokeWidth="2"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span className="text-[10px] text-txt-secondary ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function FeaturedSchoolCard({ school }: { school: School }) {
  const schoolColors = getSchoolColors(school);
  return (
    <Link href={`/schools/${school.slug}`} className="block shrink-0 w-[280px] press">
      <div
        className="relative h-[200px] overflow-hidden"
        style={{ border: "2px solid var(--rule-strong-c)" }}
      >
        {school.image_url ? (
          <Image src={school.image_url} alt={school.name} fill className="object-cover" sizes="280px" />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: `linear-gradient(135deg, ${schoolColors[0]}, ${schoolColors[1]}30)` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="c-badge-gold inline-flex px-2.5 py-1">
            {levelLabels[school.level]}
          </span>
          {school.notable_alumni && school.notable_alumni.length > 0 && (
            <span className="c-badge-gold inline-flex px-2 py-1">
              Notable Alumni
            </span>
          )}
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-heading font-bold text-base leading-tight mb-1">{school.name}</h3>
          {school.tagline && (
            <p className="text-[11px] text-white/70 italic mb-2">&ldquo;{school.tagline}&rdquo;</p>
          )}
          <div className="flex items-center gap-3">
            {school.rating != null && <StarRating rating={school.rating} />}
            {school.enrollment != null && (
              <span className="text-[10px] text-white/50">{school.enrollment.toLocaleString()} students</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function SchoolCard({ school }: { school: School }) {
  const schoolColors = getSchoolColors(school);
  const colorNames = getColorNames(school);
  return (
    <Link href={`/schools/${school.slug}`} className="block press">
      <div
        className="relative overflow-hidden transition-all"
        style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            {/* School icon/image */}
            <div
              className="w-12 h-12 shrink-0 flex items-center justify-center overflow-hidden"
              style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
            >
              {school.image_url ? (
                <Image src={school.image_url} alt={school.name} width={48} height={48} className="w-full h-full object-cover" />
              ) : (
                <span className="c-card-t" style={{ fontSize: 20, color: "var(--ink-strong)" }}>
                  {school.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="c-card-t" style={{ fontSize: 14, color: "var(--ink-strong)" }}>{school.name}</h3>
              {school.tagline && (
                <p className="c-serif-it" style={{ fontSize: 11 }}>{school.tagline}</p>
              )}
            </div>

            {/* Chevron */}
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20 shrink-0 mt-1" strokeLinecap="round">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mb-3">
            {school.rating != null && (
              <div className="flex items-center gap-1.5">
                <StarRating rating={school.rating} />
              </div>
            )}
            {school.enrollment != null && (
              <span className="text-[10px] text-txt-secondary">{school.enrollment.toLocaleString()} students</span>
            )}
            {school.grades && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${color}15`, color }}
              >
                {school.grades}
              </span>
            )}
          </div>

          {/* Highlights */}
          {school.highlights && school.highlights.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {school.highlights.slice(0, 3).map((h) => (
                <span key={h} className="text-[10px] bg-white/[0.04] text-white/60 rounded-full px-2.5 py-1 border border-white/[0.06]">
                  {h}
                </span>
              ))}
            </div>
          )}

          {/* Programs preview */}
          {school.programs && school.programs.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white/40">Programs:</span>
              <div className="flex flex-wrap gap-1">
                {school.programs.slice(0, 3).map((p, i) => (
                  <span key={p} className="text-[10px] font-medium" style={{ color: `${color}CC` }}>
                    {p}{i < 2 && school.programs!.length > 1 ? " \u00b7 " : ""}
                  </span>
                ))}
                {school.programs.length > 3 && (
                  <span className="text-[10px] text-white/30">+{school.programs.length - 3} more</span>
                )}
              </div>
            </div>
          )}

          {/* Mascot & colors strip */}
          {school.mascot && (
            <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: `${schoolColors[0]}30` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: schoolColors[0] }} />
                </div>
                <span className="text-[11px] font-semibold text-white/70">{school.mascot}</span>
                {colorNames && (
                  <span className="text-[10px] text-white/30">{colorNames}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function SchoolsClientPage({ schools }: { schools: School[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterLevel>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSchools = useMemo(() => {
    let result = schools;

    if (activeFilter !== "all") {
      result = result.filter((s) => s.level === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address?.toLowerCase().includes(q) ||
          s.mascot?.toLowerCase().includes(q) ||
          s.tagline?.toLowerCase().includes(q) ||
          s.programs?.some(p => p.toLowerCase().includes(q)) ||
          s.highlights?.some(h => h.toLowerCase().includes(q))
      );
    }

    return result;
  }, [schools, activeFilter, searchQuery]);

  const featured = useMemo(
    () => schools.filter((s) => s.notable_alumni && s.notable_alumni.length > 0),
    [schools]
  );

  const totalEnrollment = useMemo(
    () => schools.reduce((sum, s) => sum + (s.enrollment ?? 0), 0),
    [schools]
  );

  const levelCounts = useMemo(
    () => ({
      high_school: schools.filter(s => s.level === "high_school").length,
      middle_school: schools.filter(s => s.level === "middle_school").length,
      elementary: schools.filter(s => s.level === "elementary").length,
      college: schools.filter(s => s.level === "college").length,
    }),
    [schools]
  );

  const oldestYear = useMemo(
    () => {
      const years = schools.map(s => s.established).filter((y): y is number => y != null);
      return years.length > 0 ? Math.min(...years) : null;
    },
    [schools]
  );

  const totalPrograms = useMemo(
    () => {
      const all = new Set<string>();
      schools.forEach(s => s.programs?.forEach(p => all.add(p)));
      return all.size;
    },
    [schools]
  );

  return (
    <div className="animate-fade-in pb-safe">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden">
        <Image
          src="/images/generated/school-sports.png"
          alt="Compton Schools"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-midnight/60 via-midnight/80 to-midnight" />
        <div className="absolute inset-0 pattern-dots opacity-30" />
        <div className="absolute inset-0 flex flex-col items-start justify-end px-5 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-gold/15 border border-gold/25 rounded-full px-3 py-1 text-[11px] font-semibold text-gold badge-shine">
              Compton Unified School District
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold mb-1 leading-tight">
            Our <span className="text-gold-gradient">Schools</span>
          </h1>
          <p className="text-sm text-white/60 leading-relaxed max-w-[300px]">
            Discover {schools.length} schools shaping the next generation of Compton leaders
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="px-5 -mt-3 mb-5 relative z-10">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Schools", value: schools.length.toString(), color: "#F2A900" },
            { label: "Students", value: `${(totalEnrollment / 1000).toFixed(1)}K`, color: "#3B82F6" },
            { label: "Programs", value: `${totalPrograms}+`, color: "#22C55E" },
            { label: "Since", value: oldestYear?.toString() ?? "--", color: "#8B5CF6" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card border border-border-subtle rounded-xl p-2.5 text-center"
            >
              <p className="text-base font-bold font-heading" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-[9px] text-white/40 uppercase tracking-wider mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="relative">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" strokeLinecap="round">
            <circle cx="8" cy="8" r="6" />
            <path d="M13 13l3 3" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, program, mascot..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border-subtle rounded-xl pl-11 pr-10 py-3 text-sm text-txt-primary placeholder:text-white/25 focus:outline-none focus:border-gold/40 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-5 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {filterChips.map((chip) => {
          const isActive = activeFilter === chip.value;
          const color = chip.value === "all" ? "#F2A900" : levelColors[chip.value as SchoolLevel];
          return (
            <button
              key={chip.value}
              onClick={() => setActiveFilter(chip.value)}
              className="flex items-center gap-1.5 shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition-all press"
              style={{
                background: isActive ? `${color}20` : "rgba(255,255,255,0.04)",
                color: isActive ? color : "rgba(255,255,255,0.5)",
                border: `1px solid ${isActive ? `${color}30` : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {chip.label}
              {chip.value !== "all" && (
                <span
                  className="text-[10px] rounded-full px-1.5 py-0.5 font-bold"
                  style={{
                    background: isActive ? `${color}30` : "rgba(255,255,255,0.06)",
                    color: isActive ? color : "rgba(255,255,255,0.3)",
                  }}
                >
                  {levelCounts[chip.value as SchoolLevel]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Featured Schools */}
      {activeFilter === "all" && !searchQuery && featured.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between px-5 mb-3">
            <div>
              <h2 className="font-heading font-bold text-base">Featured Schools</h2>
              <p className="text-[11px] text-white/40">Schools with notable alumni & legacy</p>
            </div>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
            {featured.map((school) => (
              <FeaturedSchoolCard key={school.slug} school={school} />
            ))}
          </div>
        </section>
      )}

      {/* Browse by Level - visual grid */}
      {activeFilter === "all" && !searchQuery && (
        <section className="px-5 mb-6">
          <h2 className="font-heading font-bold text-base mb-3">Browse by Level</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {(["high_school", "middle_school", "elementary", "college"] as SchoolLevel[]).map((level) => {
              const color = levelColors[level];
              const count = levelCounts[level];
              return (
                <button
                  key={level}
                  onClick={() => setActiveFilter(level)}
                  className="relative overflow-hidden rounded-xl p-4 text-left press transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${color}12, ${color}05)`,
                    border: `1px solid ${color}20`,
                  }}
                >
                  <div className="absolute top-2 right-2 opacity-10">
                    <svg width="32" height="32" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={levelIcons[level]} />
                    </svg>
                  </div>
                  <p className="font-heading font-bold text-2xl mb-0.5" style={{ color }}>{count}</p>
                  <p className="text-[12px] font-semibold text-white/70">{levelLabels[level]}s</p>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    {level === "college" ? "Community College" : `Grades ${level === "high_school" ? "9-12" : level === "middle_school" ? "6-8" : "K-5"}`}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between px-5 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-heading font-bold text-base">
            {activeFilter === "all" && !searchQuery ? "All Schools" : `${filteredSchools.length} Results`}
          </h2>
          {activeFilter !== "all" && (
            <button
              onClick={() => setActiveFilter("all")}
              className="flex items-center gap-1 bg-gold/10 rounded-full px-2.5 py-1 border border-gold/20 press"
            >
              <span className="text-[10px] font-medium text-gold">Clear</span>
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gold" strokeLinecap="round">
                <path d="M3 3l4 4M7 3l-4 4" />
              </svg>
            </button>
          )}
        </div>
        <span className="text-[10px] text-white/30">{filteredSchools.length} schools</span>
      </div>

      {/* School List */}
      <section className="px-5 mb-8">
        <div className="space-y-3 stagger">
          {filteredSchools.map((school) => (
            <SchoolCard key={school.slug} school={school} />
          ))}

          {filteredSchools.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21V7l9-4 9 4v14M3 21h18M9 21V11h6v10" />
                </svg>
              </div>
              <p className="text-sm font-semibold mb-1">No schools found</p>
              <p className="text-xs text-white/40">Try a different filter or search term</p>
            </div>
          )}
        </div>
      </section>

      {/* Compton Promise CTA */}
      {activeFilter === "all" && !searchQuery && (
        <section className="px-5 mb-8">
          <div className="relative overflow-hidden rounded-2xl border border-gold/20 p-5" style={{ background: "linear-gradient(135deg, rgba(242,169,0,0.08), rgba(242,169,0,0.02))" }}>
            <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
              <svg viewBox="0 0 100 100" fill="none" stroke="#F2A900" strokeWidth="1">
                <circle cx="80" cy="20" r="40" />
                <circle cx="80" cy="20" r="25" />
              </svg>
            </div>
            <div className="relative">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gold uppercase tracking-wider mb-2">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12 12 0 01.665 6.479A12 12 0 0112 20.5" />
                </svg>
                Compton Promise
              </span>
              <h3 className="font-heading font-bold text-lg mb-1">Free College Tuition</h3>
              <p className="text-[12px] text-white/50 leading-relaxed mb-3">
                Compton College offers free tuition for all Compton Unified graduates through the Compton Promise program. Your future starts here.
              </p>
              <Link
                href="/schools/compton-college"
                className="inline-flex items-center gap-2 bg-gold text-midnight rounded-full px-4 py-2 text-[12px] font-bold press hover:bg-gold-light transition-colors"
              >
                Learn More
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 7h4M7 5v4M3 7a4 4 0 118 0 4 4 0 01-8 0z" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Emergency Contact */}
      <section className="px-5 mb-6">
        <div className="bg-card border border-border-subtle rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-hc-blue/15 flex items-center justify-center shrink-0">
            <svg width="18" height="18" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[12px] font-bold">Compton Unified School District</p>
            <p className="text-[11px] text-white/40">417 W Compton Blvd, Compton, CA 90220</p>
          </div>
          <a href="tel:3106393200" className="text-[11px] text-gold font-semibold press">
            Call
          </a>
        </div>
      </section>
    </div>
  );
}
