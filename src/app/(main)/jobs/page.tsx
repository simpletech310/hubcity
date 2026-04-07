"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Chip from "@/components/ui/Chip";
import Icon from "@/components/ui/Icon";
import EditorialHeader from "@/components/ui/EditorialHeader";
import JobCard from "@/components/jobs/JobCard";
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

const categoryCards: { label: string; iconName: IconName; value: string; color: string }[] = [
  { label: "City Jobs", iconName: "landmark", value: "city", color: "text-gold" },
  { label: "Healthcare", iconName: "heart-pulse", value: "health", color: "text-emerald" },
  { label: "Education", iconName: "graduation", value: "school", color: "text-hc-blue" },
  { label: "Business", iconName: "store", value: "business", color: "text-coral" },
  { label: "Tech", iconName: "lightbulb", value: "tech", color: "text-cyan" },
  { label: "Services", iconName: "wrench", value: "services", color: "text-hc-purple" },
];

export default function JobsPage() {
  const [activeType, setActiveType] = useState("all");
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeType !== "all") params.set("type", activeType);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setLoading(false);
    }
    fetchJobs();
  }, [activeType]);

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
          alt="Job opportunities in Compton"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-midnight via-midnight/80 to-midnight" />

        <div className="relative z-10 px-5 pt-4 pb-5">
          <EditorialHeader kicker="OPPORTUNITY AWAITS" title="Jobs in Compton" subtitle="Find your next opportunity in the Hub City." />

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
          {activeType === "all" && !search && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Icon name="grid" size={16} className="text-txt-secondary" />
                <h2 className="font-heading font-bold text-sm">Browse by Category</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {categoryCards.map((cat) => (
                  <button
                    key={cat.value}
                    className="glass-surface rounded-xl p-3 flex flex-col items-center gap-2 press hover:border-gold/20 transition-all"
                    onClick={() => {
                      // Future: filter by org category
                    }}
                  >
                    <Icon name={cat.iconName} size={22} className={cat.color} />
                    <span className="text-[10px] font-semibold text-txt-secondary">{cat.label}</span>
                  </button>
                ))}
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
