"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Chip from "@/components/ui/Chip";
import { ROLE_BADGE_MAP } from "@/lib/constants";

interface Profile {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
  role: string;
  verification_status: string;
  bio: string | null;
}

const ROLE_FILTERS = [
  { key: "all", label: "All" },
  { key: "city_official", label: "Officials" },
  { key: "city_ambassador", label: "Ambassadors" },
  { key: "business_owner", label: "Business" },
  { key: "content_creator", label: "Creators" },
  { key: "resource_provider", label: "Resources" },
  { key: "school", label: "Schools" },
  { key: "chamber_admin", label: "Chamber" },
  { key: "admin", label: "Admin" },
] as const;

const ROLE_GRADIENTS: Record<string, string> = {
  city_official: "from-gold/30 via-gold/10 to-transparent",
  city_ambassador: "from-purple/30 via-purple/10 to-transparent",
  admin: "from-blue/30 via-blue/10 to-transparent",
  business_owner: "from-emerald/30 via-emerald/10 to-transparent",
  content_creator: "from-coral/30 via-coral/10 to-transparent",
  creator: "from-coral/30 via-coral/10 to-transparent",
  resource_provider: "from-cyan/30 via-cyan/10 to-transparent",
  chamber_admin: "from-purple/30 via-purple/10 to-transparent",
  school: "from-emerald/30 via-emerald/10 to-transparent",
};

export default function PeopleClient({ profiles }: { profiles: Profile[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = useMemo(() => {
    let result = profiles;

    if (roleFilter !== "all") {
      // Handle "creator" alias for "content_creator"
      result = result.filter(
        (p) => p.role === roleFilter || (roleFilter === "content_creator" && p.role === "creator")
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.display_name.toLowerCase().includes(q) ||
          p.handle.toLowerCase().includes(q) ||
          (p.bio && p.bio.toLowerCase().includes(q))
      );
    }

    return result;
  }, [profiles, search, roleFilter]);

  return (
    <div className="animate-fade-in pb-safe">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-midnight to-midnight" />
        <div className="relative px-5 pt-6 pb-5">
          <h1 className="font-heading text-2xl font-bold mb-1">People</h1>
          <p className="text-sm text-txt-secondary">
            Discover leaders, creators, and organizations in Compton.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 mt-3">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-secondary"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or @handle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.05] border border-border-subtle rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 transition-colors"
          />
        </div>
      </div>

      {/* Role Filter Chips */}
      <div className="px-5 mt-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {ROLE_FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              active={roleFilter === f.key}
              onClick={() => setRoleFilter(f.key)}
            />
          ))}
        </div>
      </div>

      {/* Profile Count */}
      <div className="px-5 mt-4 mb-3">
        <p className="text-xs text-txt-secondary font-medium">
          {filtered.length} {filtered.length === 1 ? "person" : "people"}
        </p>
      </div>

      {/* Profiles Grid */}
      <div className="px-4">
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-10">
            <div className="w-12 h-12 rounded-full bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-txt-secondary"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-white">No people found</p>
            <p className="text-xs text-txt-secondary mt-1">
              Try adjusting your search or filters.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {filtered.map((profile) => {
            const badge = ROLE_BADGE_MAP[profile.role];
            const isVerified = profile.verification_status === "verified";
            const gradient = ROLE_GRADIENTS[profile.role] || "from-white/10 to-transparent";

            return (
              <Link key={profile.id} href={`/user/${profile.handle}`}>
                <div className="rounded-2xl overflow-hidden border border-border-subtle bg-card press hover:border-white/[0.12] transition-all group">
                  {/* Image Area */}
                  <div className="relative aspect-square overflow-hidden">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.display_name}
                        fill
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        sizes="(max-width: 430px) 50vw, 200px"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <span className="text-4xl font-heading font-bold text-white/30">
                          {profile.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Gradient overlay at bottom of image */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Role badge overlay */}
                    {badge && (
                      <div className="absolute bottom-2 left-2">
                        <Badge label={badge.label} variant={badge.variant} />
                      </div>
                    )}

                    {/* Verified check overlay */}
                    {isVerified && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="#F2A900"
                          className="shrink-0"
                        >
                          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-semibold text-white truncate">
                      {profile.display_name}
                    </p>
                    <p className="text-[11px] text-txt-secondary truncate">
                      @{profile.handle}
                    </p>
                    {profile.bio && (
                      <p className="text-[11px] text-white/40 line-clamp-2 mt-1.5 leading-relaxed">
                        {profile.bio}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
