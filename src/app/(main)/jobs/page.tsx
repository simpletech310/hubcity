"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Chip from "@/components/ui/Chip";
import EditorialHeader from "@/components/ui/EditorialHeader";
import JobCard from "@/components/jobs/JobCard";
import type { JobListing } from "@/types/database";

const jobTypes = [
  { label: "All", value: "all", icon: "💼" },
  { label: "Full-Time", value: "full_time", icon: "🏢" },
  { label: "Part-Time", value: "part_time", icon: "🕐" },
  { label: "Volunteer", value: "volunteer", icon: "🤝" },
  { label: "Contract", value: "contract", icon: "📝" },
  { label: "Seasonal", value: "seasonal", icon: "🌴" },
  { label: "Internship", value: "internship", icon: "🎓" },
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

  return (
    <div className="animate-fade-in">
      {/* Hero with Background Image */}
      <div className="relative min-h-[200px] flex flex-col justify-end mb-5">
        <Image
          src="/images/generated/jobs-hero.png"
          alt="Job opportunities in Compton"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-midnight via-midnight/80 to-midnight" />

        <div className="relative z-10 px-5 pt-4 pb-5">
          <EditorialHeader kicker="OPPORTUNITY AWAITS" title="Jobs in Compton" subtitle="Find opportunities in Compton." />

          {/* Search */}
          <div className="flex items-center gap-3 bg-white/[0.04] border border-border-subtle rounded-2xl px-4 py-3.5 focus-within:border-gold/30 focus-within:bg-white/[0.06] transition-all backdrop-blur-sm">
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-txt-secondary shrink-0"
            >
              <circle cx="8" cy="8" r="5" />
              <path d="M12 12l4 4" />
            </svg>
            <input
              type="text"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-white placeholder:text-txt-secondary/60 w-full outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-txt-secondary hover:text-white press"
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 px-5 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {jobTypes.map((type) => (
          <Chip
            key={type.value}
            label={type.label}
            icon={<span className="text-sm">{type.icon}</span>}
            active={activeType === type.value}
            onClick={() => setActiveType(type.value)}
          />
        ))}
      </div>

      {loading ? (
        <div className="px-5 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      ) : (
        <section className="px-5">
          <div className="space-y-3 stagger">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <span className="text-5xl block mb-3">🔍</span>
                <p className="text-sm font-medium mb-1">No jobs found</p>
                <p className="text-xs text-txt-secondary">
                  Try a different search or filter
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
