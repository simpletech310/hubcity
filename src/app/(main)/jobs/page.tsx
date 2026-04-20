"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Chip from "@/components/ui/Chip";
import Icon from "@/components/ui/Icon";
import EditorialHeader from "@/components/ui/EditorialHeader";
import JobCard from "@/components/jobs/JobCard";
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
  { label: "Healthcare", iconName: "heart-pulse", value: "healthcare", color: "text-emerald", filter: "search" },
  { label: "Education", iconName: "graduation", value: "school", color: "text-hc-blue", filter: "org_type" },
  { label: "Business", iconName: "store", value: "business", color: "text-coral", filter: "org_type" },
  { label: "Tech", iconName: "lightbulb", value: "tech", color: "text-cyan", filter: "search" },
  { label: "Services", iconName: "wrench", value: "services", color: "text-hc-purple", filter: "search" },
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
      {/* ── Hero ── */}
      <div className="relative min-h-[220px] flex flex-col justify-end mb-5">
        <Image
          src="/images/generated/jobs-hero.png"
          alt={`Job opportunities in ${activeCity?.name ?? "your city"}`}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-midnight via-midnight/80 to-midnight" />

        <div className="relative z-10 px-5 pt-4 pb-5">
          <EditorialHeader kicker="OPPORTUNITY AWAITS" title={`Jobs in ${activeCity?.name ?? "your city"}`} subtitle="Find your next opportunity on Knect." />

          {/* Glass Search Bar */}
          <div className="glass-card-elevated flex items-center gap-3 rounded-2xl px-4 py-3.5 focus-within:border-gold/30 transition-all mt-4">
            <Icon name="search" size={18} className="text-txt-secondary shrink-0" />
            <input
              type="text"
              placeholder="Search jobs, companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-white placeholder:text-txt-secondary/60 w-full outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-txt-secondary hover:text-white press">
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Filter Chips ── */}
      <div className="flex gap-2 px-5 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {jobTypes.map((type) => (
          <Chip
            key={type.value}
            label={type.label}
            iconName={type.iconName}
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
      ) : (
        <div className="px-5 space-y-8">
          {/* ── Featured Jobs ── */}
          {featuredJobs.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Icon name="sparkle" size={16} className="text-gold" />
                <h2 className="font-heading font-bold text-sm">Featured Opportunities</h2>
              </div>
              <div className="space-y-3 stagger">
                {featuredJobs.map((job) => (
                  <JobCard key={job.id} job={job} featured />
                ))}
              </div>
            </section>
          )}

          {/* ── Job Categories (only when "All" and no search) ── */}
          {!search && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon name="grid" size={16} className="text-txt-secondary" />
                  <h2 className="font-heading font-bold text-sm">Browse by Category</h2>
                </div>
                {activeCategory && (
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="text-[10px] text-gold font-semibold press"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {categoryCards.map((cat) => {
                  const isActive = activeCategory?.value === cat.value;
                  return (
                    <button
                      key={cat.value}
                      className={`rounded-xl p-3 flex flex-col items-center gap-2 press transition-all ${
                        isActive
                          ? "bg-gold/10 border border-gold/30 glow-gold-sm"
                          : "glass-surface hover:border-gold/20"
                      }`}
                      onClick={() => setActiveCategory(isActive ? null : { value: cat.value, filter: cat.filter })}
                    >
                      <Icon name={cat.iconName} size={22} className={isActive ? "text-gold" : cat.color} />
                      <span className={`text-[10px] font-semibold ${
                        isActive ? "text-gold" : "text-txt-secondary"
                      }`}>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Job Listings ── */}
          <section>
            {regularJobs.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Icon name="list" size={16} className="text-txt-secondary" />
                <h2 className="font-heading font-bold text-sm">
                  {activeType === "all" && !search ? "Recent Openings" : `${filtered.length} Job${filtered.length !== 1 ? "s" : ""} Found`}
                </h2>
              </div>
            )}
            <div className="space-y-3 stagger">
              {regularJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full glass-card-elevated flex items-center justify-center mx-auto mb-4">
                    <Icon name="search" size={28} className="text-txt-secondary" />
                  </div>
                  <p className="text-sm font-heading font-semibold mb-1">No jobs found</p>
                  <p className="text-xs text-txt-secondary">
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
