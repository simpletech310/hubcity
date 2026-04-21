"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import JobCard from "@/components/jobs/JobCard";
import SnapCarousel from "@/components/ui/editorial/SnapCarousel";
import { useActiveCity } from "@/hooks/useActiveCity";
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
  const activeCity = useActiveCity();
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
      if (activeCity?.slug) params.set("city", activeCity.slug);

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
  }, [activeType, activeCategory, activeCity?.slug]);

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
    <div className="animate-fade-in pb-20">
      {/* ── Hero / Masthead ── */}
      <div className="relative min-h-[220px] flex flex-col justify-end mb-5">
        <Image
          src="/images/generated/jobs-hero.png"
          alt={`Job opportunities in ${activeCity?.name ?? "your city"}`}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-midnight via-midnight/80 to-midnight" />

        <div className="relative z-10 px-5 pt-6 pb-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-editorial text-gold tabular-nums">
              VOL · 01 · ISSUE WORK
            </span>
            <span className="block w-1 h-1 rounded-full bg-gold/60" />
            <span className="text-[10px] font-bold uppercase tracking-editorial text-white/40">
              {activeCity?.name?.toUpperCase() ?? "EVERYWHERE"}
            </span>
          </div>
          <h1 className="masthead text-white text-[44px]">WORK.</h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="block h-[2px] w-8 bg-gold" />
            <span className="text-[10px] font-bold uppercase tracking-editorial text-ivory/60">
              Opportunity, hustle, and the next chapter
            </span>
          </div>

          {/* Editorial Search Bar */}
          <div className="panel-editorial rounded-2xl border-white/[0.08] flex items-center gap-3 px-4 py-3.5 mt-5 focus-within:border-gold/40 transition-colors">
            <Icon name="search" size={18} className="text-gold shrink-0" />
            <input
              type="text"
              placeholder="Search jobs, companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-white placeholder:text-ivory/30 w-full outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-ivory/40 hover:text-white press"
                aria-label="Clear search"
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Job-Type Filter Chips (editorial) ── */}
      <div className="flex gap-2 px-5 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {jobTypes.map((type) => {
          const isActive = activeType === type.value;
          return (
            <button
              key={type.value}
              onClick={() => setActiveType(type.value)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-bold uppercase tracking-editorial-tight whitespace-nowrap shrink-0 press transition-colors ${
                isActive
                  ? "bg-gold text-midnight border border-gold"
                  : "panel-editorial text-ivory/70 border-white/[0.08] hover:border-gold/30"
              }`}
            >
              <Icon name={type.iconName} size={13} />
              {type.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="px-5 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl panel-editorial h-24 opacity-40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="px-5 space-y-8">
          {/* ── Job Categories (only when no search) ── */}
          {!search && (
            <section>
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-display text-gold text-[22px] leading-none tabular-nums">
                  № 01
                </span>
                <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
                  Browse by Category
                </span>
                <span className="ml-auto rule-hairline flex-1 self-center" />
                {activeCategory && (
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="ml-2 text-[10px] font-bold tracking-editorial-tight uppercase text-gold press shrink-0"
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
                      className={`panel-editorial p-4 rounded-xl flex flex-col items-center gap-2 press transition-colors ${
                        isActive ? "border-gold/40" : "hover:border-gold/25"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg border bg-ink flex items-center justify-center ${
                          isActive ? "border-gold/40" : "border-gold/20"
                        }`}
                      >
                        <Icon name={cat.iconName} size={18} className="text-gold" />
                      </div>
                      <span className="font-display text-[14px] leading-none text-white">
                        {cat.label}
                      </span>
                      <span className="text-[10px] text-ivory/45 uppercase tracking-editorial-tight font-semibold">
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

          {/* ── Job Listings ── */}
          <section>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="font-display text-gold text-[22px] leading-none tabular-nums">
                № {featuredJobs.length > 0 ? "03" : !search ? "02" : "01"}
              </span>
              <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
                {activeType === "all" && !search
                  ? "All Listings"
                  : `${filtered.length} Result${filtered.length !== 1 ? "s" : ""}`}
              </span>
              <span className="ml-auto rule-hairline flex-1 self-center" />
            </div>
            <div className="space-y-2.5 stagger">
              {regularJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
              {filtered.length === 0 && (
                <div className="rounded-2xl panel-editorial py-14 px-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl border border-gold/20 bg-ink flex items-center justify-center">
                    <Icon name="search" size={22} className="text-gold" />
                  </div>
                  <p className="font-display text-[18px] leading-tight text-white mb-1">
                    No jobs found
                  </p>
                  <p className="text-[11px] text-ivory/50 uppercase tracking-editorial-tight font-semibold">
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
