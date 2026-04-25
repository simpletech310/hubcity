"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import JobCard from "@/components/jobs/JobCard";
import SnapCarousel from "@/components/ui/editorial/SnapCarousel";
import { useSearchParams } from "next/navigation";
import { useKnownCities } from "@/hooks/useActiveCity";
import CityFilterChip from "@/components/ui/CityFilterChip";
import type { JobListing } from "@/types/database";
import type { IconName } from "@/components/ui/Icon";

const jobTypes: { label: string; value: string; iconName: IconName }[] = [
  { label: "All", value: "all", iconName: "briefcase" },
  { label: "Full-Time", value: "full_time", iconName: "building" },
  { label: "Part-Time", value: "part_time", iconName: "clock" },
  { label: "Volunteer", value: "volunteer", iconName: "handshake" },
  { label: "Contract", value: "contract", iconName: "document" },
  { label: "Seasonal", value: "seasonal", iconName: "palm" },
  { label: "Internship", value: "internship", iconName: "graduation" },
];

const categoryCards: { label: string; iconName: IconName; value: string; color: string; filter: "org_type" | "search" }[] = [
  { label: "City Jobs", iconName: "landmark", value: "city", color: "text-gold", filter: "org_type" },
  { label: "Healthcare", iconName: "heart-pulse", value: "healthcare", color: "text-gold", filter: "search" },
  { label: "Education", iconName: "graduation", value: "school", color: "text-gold", filter: "org_type" },
  { label: "Business", iconName: "store", value: "business", color: "text-gold", filter: "org_type" },
  { label: "Tech", iconName: "lightbulb", value: "tech", color: "text-gold", filter: "search" },
  { label: "Services", iconName: "wrench", value: "services", color: "text-gold", filter: "search" },
];

export default function JobsPage() {
  // Default scope = ALL cities. Listener narrows via the CityFilterChip.
  const sp = useSearchParams();
  const cities = useKnownCities();
  const filterCitySlug = sp.get("city");
  const filterCity = filterCitySlug
    ? cities.find((c) => c.slug === filterCitySlug) ?? null
    : null;
  const [activeType, setActiveType] = useState("all");
  const [activeCategory, setActiveCategory] = useState<{ value: string; filter: "org_type" | "search" } | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeType !== "all") params.set("type", activeType);
      if (activeCategory?.filter === "org_type") {
        params.set("org_type", activeCategory.value);
      }
      if (filterCitySlug) params.set("city", filterCitySlug);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      let result = data.jobs ?? [];

      // Client-side search filter for industry categories
      if (activeCategory?.filter === "search") {
        const q = activeCategory.value.toLowerCase();
        result = result.filter((j: JobListing) => {
          const biz = j.business as { name?: string } | null;
          return (
            j.title.toLowerCase().includes(q) ||
            j.description?.toLowerCase().includes(q) ||
            (j.organization_name ?? "").toLowerCase().includes(q) ||
            biz?.name?.toLowerCase().includes(q)
          );
        });
      }

      setJobs(result);
      setLoading(false);
    }
    fetchJobs();
  }, [activeType, activeCategory, filterCitySlug]);

  const filtered = search
    ? jobs.filter((j) => {
        const q = search.toLowerCase();
        const biz = j.business as { name?: string } | null;
        const orgName = (j.organization_name ?? "").toLowerCase();
        return (
          j.title.toLowerCase().includes(q) ||
          biz?.name?.toLowerCase().includes(q) ||
          orgName.includes(q)
        );
      })
    : jobs;

  // Separate featured jobs (first 3 if no search)
  const featuredJobs = !search && activeType === "all" ? filtered.slice(0, 3) : [];
  const regularJobs = !search && activeType === "all" ? filtered.slice(3) : filtered;

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-20">
      <div
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § VOL·01 · ISSUE WORK · {filterCity?.name?.toUpperCase() ?? "EVERYWHERE"}
        </div>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 56, lineHeight: 0.88, letterSpacing: "-0.02em" }}
        >
          Work.
        </h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13, lineHeight: 1.45 }}>
          Opportunity, hustle, and the next chapter.
        </p>
        <div className="mt-3"><CityFilterChip /></div>

        <div
          className="flex items-center gap-3 mt-4 px-3"
          style={{ border: "2px solid var(--rule-strong-c)", background: "var(--paper)" }}
        >
          <Icon name="search" size={16} style={{ color: "var(--ink-strong)" }} />
          <input
            type="text"
            placeholder="Search jobs, companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none"
            style={{
              background: "transparent",
              color: "var(--ink-strong)",
              fontSize: 13,
              padding: "12px 0",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="press"
              style={{ color: "var(--ink-strong)", opacity: 0.6 }}
              aria-label="Clear search"
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Job-Type Filter Chips */}
      <div className="flex gap-2 px-[18px] mt-4 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {jobTypes.map((type) => {
          const isActive = activeType === type.value;
          return (
            <button
              key={type.value}
              onClick={() => setActiveType(type.value)}
              className={`c-chip ${isActive ? "gold" : ""}`}
            >
              <Icon name={type.iconName} size={13} />
              {type.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="px-[18px] space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse"
              style={{ border: "2px solid var(--rule-strong-c)", background: "var(--paper-soft)" }}
            />
          ))}
        </div>
      ) : (
        <div className="px-[18px] space-y-8">
          {/* Categories */}
          {!search && (
            <section>
              <div className="flex items-baseline gap-3 mb-3">
                <span
                  className="c-kicker tabular-nums"
                  style={{ color: "var(--gold-c)", fontSize: 14 }}
                >
                  № 01
                </span>
                <span className="c-kicker" style={{ opacity: 0.55 }}>
                  Browse by Category
                </span>
                <span
                  className="ml-auto flex-1 self-center"
                  style={{ borderTop: "2px solid var(--rule-strong-c)" }}
                />
                {activeCategory && (
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="c-kicker press shrink-0 ml-2"
                    style={{ color: "var(--gold-c)" }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {categoryCards.map((cat) => {
                  const isActive = activeCategory?.value === cat.value;
                  const count = isActive ? filtered.length : null;
                  return (
                    <button
                      key={cat.value}
                      onClick={() =>
                        setActiveCategory(isActive ? null : { value: cat.value, filter: cat.filter })
                      }
                      className="p-4 flex flex-col items-center gap-2 press"
                      style={{
                        background: isActive ? "var(--gold-c)" : "var(--paper)",
                        border: "2px solid var(--rule-strong-c)",
                      }}
                    >
                      <div
                        className="w-10 h-10 flex items-center justify-center"
                        style={{
                          background: "var(--ink-strong)",
                          border: "2px solid var(--rule-strong-c)",
                        }}
                      >
                        <Icon name={cat.iconName} size={18} style={{ color: "var(--gold-c)" }} />
                      </div>
                      <span className="c-card-t" style={{ fontSize: 13, color: "var(--ink-strong)" }}>
                        {cat.label}
                      </span>
                      <span className="c-kicker" style={{ fontSize: 9, opacity: 0.7 }}>
                        {count !== null ? `${count} Open` : "Browse"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Featured Jobs ── */}
          {featuredJobs.length > 0 && (
            <section className="-mx-5">
              <SnapCarousel
                number={2}
                kicker={`Featured · ${featuredJobs.length} Listing${featuredJobs.length !== 1 ? "s" : ""}`}
              >
                {featuredJobs.map((job) => (
                  <JobCard key={job.id} job={job} featured />
                ))}
              </SnapCarousel>
            </section>
          )}

          {/* Job Listings */}
          <section>
            <div className="flex items-baseline gap-3 mb-3">
              <span
                className="c-kicker tabular-nums"
                style={{ color: "var(--gold-c)", fontSize: 14 }}
              >
                № {featuredJobs.length > 0 ? "03" : !search ? "02" : "01"}
              </span>
              <span className="c-kicker" style={{ opacity: 0.55 }}>
                {activeType === "all" && !search
                  ? "All Listings"
                  : `${filtered.length} Result${filtered.length !== 1 ? "s" : ""}`}
              </span>
              <span
                className="ml-auto flex-1 self-center"
                style={{ borderTop: "2px solid var(--rule-strong-c)" }}
              />
            </div>
            <div className="space-y-2.5 stagger">
              {regularJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
              {filtered.length === 0 && (
                <div
                  className="py-14 px-6 text-center"
                  style={{ border: "2px solid var(--rule-strong-c)", background: "var(--paper)" }}
                >
                  <div
                    className="w-12 h-12 mx-auto mb-4 flex items-center justify-center"
                    style={{ background: "var(--ink-strong)", border: "2px solid var(--rule-strong-c)" }}
                  >
                    <Icon name="search" size={22} style={{ color: "var(--gold-c)" }} />
                  </div>
                  <p className="c-card-t mb-1" style={{ fontSize: 17 }}>
                    No jobs found
                  </p>
                  <p className="c-kicker" style={{ fontSize: 10, opacity: 0.6 }}>
                    Try a different search or filter
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
