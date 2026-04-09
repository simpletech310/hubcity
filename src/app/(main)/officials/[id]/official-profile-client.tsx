"use client";

import { useState } from "react";
import Image from "next/image";
import type {
  CivicOfficial,
  OfficialFlag,
  ManagerAction,
  AccountabilityVector,
} from "@/types/database";
import VotingRecordTable from "@/components/officials/VotingRecordTable";
import FlagsList from "@/components/officials/FlagsList";
import ActionTimeline from "@/components/officials/ActionTimeline";
import AccountabilityVectors from "@/components/officials/AccountabilityVectors";

interface VoteRecord {
  id: string;
  title: string;
  description?: string;
  category: string;
  vote_date: string;
  result: string;
  impact_level: string;
  aftermath?: string;
  position: string;
  notes?: string | null;
}

interface AreaSchool {
  id: string;
  school_name: string;
  school_type: string;
  grades: string;
  address?: string;
}

type Tab = "overview" | "votes" | "actions" | "flags" | "accountability";

const TYPE_LABELS: Record<string, { text: string; color: string }> = {
  mayor: { text: "Mayor", color: "text-gold bg-gold/10 border-gold/20" },
  council_member: {
    text: "Council Member",
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  },
  city_manager: {
    text: "City Manager",
    color: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  },
  board_president: {
    text: "Board President",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
  board_vp: {
    text: "Vice President",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
  board_clerk: {
    text: "Clerk of Board",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
  school_trustee: {
    text: "Trustee",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
  board_member: {
    text: "Board Member",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
  superintendent: {
    text: "Superintendent",
    color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  },
};

const COUNCIL_TYPES = ["mayor", "council_member"];
const SCHOOL_BOARD_TYPES = [
  "school_trustee",
  "board_president",
  "board_vp",
  "board_clerk",
  "board_member",
];
const APPOINTED_TYPES = ["city_manager", "superintendent"];

export default function OfficialProfileClient({
  official,
  flags,
  votes,
  actions,
  vectors,
  areaSchools,
}: {
  official: CivicOfficial;
  flags: OfficialFlag[];
  votes: VoteRecord[];
  actions: ManagerAction[];
  vectors: AccountabilityVector[];
  areaSchools: AreaSchool[];
}) {
  const isVoting =
    COUNCIL_TYPES.includes(official.official_type) ||
    SCHOOL_BOARD_TYPES.includes(official.official_type);
  const isAppointed = APPOINTED_TYPES.includes(official.official_type);

  const defaultTab: Tab = isVoting ? "overview" : isAppointed ? "overview" : "overview";
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  const typeLabel = TYPE_LABELS[official.official_type] ?? {
    text: official.official_type,
    color: "text-zinc-400 bg-zinc-800 border-zinc-700",
  };

  const locationLabel = official.district
    ? `District ${official.district}`
    : official.trustee_area
      ? `Trustee Area ${official.trustee_area}`
      : official.official_type === "mayor"
        ? "Citywide"
        : isAppointed
          ? "Appointed"
          : "";

  const criticalFlags = flags.filter((f) => f.severity === "critical").length;
  const warningFlags = flags.filter((f) => f.severity === "warning").length;

  // Build tab list dynamically
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
  ];
  if (isVoting) {
    tabs.push({ id: "votes", label: "Voting Record", count: votes.length });
  }
  if (isAppointed) {
    tabs.push({ id: "actions", label: "Actions", count: actions.length });
  }
  tabs.push({ id: "flags", label: "Flags", count: flags.length });
  tabs.push({ id: "accountability", label: "Accountability" });

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24">
      {/* Profile Header */}
      <div className="py-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 ring-2 ring-zinc-700">
            {official.photo_url ? (
              <Image
                src={official.photo_url}
                alt={official.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500 text-2xl font-bold">
                {official.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white font-heading tracking-tight">
                {official.name}
              </h1>
              {!official.is_voting_member && (
                <span className="text-[9px] font-semibold text-zinc-500 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Non-Voting
                </span>
              )}
            </div>

            <p className="text-sm text-zinc-400 mt-0.5">{official.title}</p>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${typeLabel.color}`}
              >
                {typeLabel.text}
              </span>
              {locationLabel && (
                <span className="text-[10px] text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded">
                  {locationLabel}
                </span>
              )}
              {official.party && (
                <span className="text-[10px] text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded">
                  {official.party}
                </span>
              )}
            </div>

            {/* Flag summary */}
            {flags.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                {criticalFlags > 0 && (
                  <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                    {criticalFlags} critical
                  </span>
                )}
                {warningFlags > 0 && (
                  <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    {warningFlags} warning
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Election / Running info */}
        {official.running_for &&
          official.running_for !== "N/A" &&
          official.running_for !== "N/A (not elected)" && (
            <div className="mt-4 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
              <p className="text-xs text-amber-400 font-semibold">
                Running for: {official.running_for}
              </p>
              {official.term_expires && (
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Term: {official.term_expires}
                </p>
              )}
            </div>
          )}
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-zinc-800 -mx-4 px-4">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-3 px-4 text-sm font-medium transition-all relative ${
                activeTab === tab.id
                  ? "text-gold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 text-[10px] text-zinc-600">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Background */}
            {official.background && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="text-xs font-semibold text-gold uppercase tracking-wider mb-2">
                  Background
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                  {official.background}
                </p>
              </div>
            )}

            {/* Key Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {official.in_office_since && (
                <DetailCard
                  label="In Office Since"
                  value={official.in_office_since}
                />
              )}
              {official.term_expires && (
                <DetailCard
                  label="Term Expires"
                  value={official.term_expires}
                />
              )}
              {official.geography && (
                <DetailCard
                  label="Geography"
                  value={official.geography}
                />
              )}
              {official.communities && official.communities.length > 0 && (
                <DetailCard
                  label="Communities"
                  value={official.communities.join(", ")}
                />
              )}
            </div>

            {/* Schools in Area (for trustees) */}
            {areaSchools.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                  Schools in Area {official.trustee_area}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {areaSchools.map((school) => (
                    <div
                      key={school.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3"
                    >
                      <p className="text-[13px] font-semibold text-white">
                        {school.school_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded">
                          {school.school_type}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {school.grades}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick flags summary on overview */}
            {flags.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                    Active Flags
                  </h3>
                  <button
                    onClick={() => setActiveTab("flags")}
                    className="text-[10px] text-gold hover:text-gold/80 transition-colors"
                  >
                    View all →
                  </button>
                </div>
                <FlagsList flags={flags.slice(0, 3)} />
              </div>
            )}

            {/* Quick vote summary on overview */}
            {isVoting && votes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                    Recent Votes
                  </h3>
                  <button
                    onClick={() => setActiveTab("votes")}
                    className="text-[10px] text-gold hover:text-gold/80 transition-colors"
                  >
                    View all →
                  </button>
                </div>
                <VotingRecordTable votes={votes.slice(0, 3)} />
              </div>
            )}

            {/* Quick actions summary for appointed */}
            {isAppointed && actions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                    Recent Actions
                  </h3>
                  <button
                    onClick={() => setActiveTab("actions")}
                    className="text-[10px] text-gold hover:text-gold/80 transition-colors"
                  >
                    View all →
                  </button>
                </div>
                <ActionTimeline actions={actions.slice(0, 3)} />
              </div>
            )}
          </div>
        )}

        {/* Voting Record Tab */}
        {activeTab === "votes" && (
          <div>
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-white">
                Voting Record
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {votes.length} recorded vote{votes.length !== 1 ? "s" : ""} on{" "}
                {COUNCIL_TYPES.includes(official.official_type)
                  ? "city council"
                  : "school board"}{" "}
                matters.
              </p>
            </div>
            <VotingRecordTable votes={votes} />
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === "actions" && (
          <div>
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-white">
                Executive Actions
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {actions.length} tracked action{actions.length !== 1 ? "s" : ""}{" "}
                as {official.title}.
              </p>
            </div>
            <ActionTimeline actions={actions} />
          </div>
        )}

        {/* Flags Tab */}
        {activeTab === "flags" && (
          <div>
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-white">
                Flags &amp; Controversies
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {flags.length} flag{flags.length !== 1 ? "s" : ""} on record.
                Sourced from court records, audits, FPPC filings, and
                investigative reporting.
              </p>
            </div>
            <FlagsList flags={flags} />
          </div>
        )}

        {/* Accountability Tab */}
        {activeTab === "accountability" && (
          <div>
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-white">
                Accountability Vectors
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Key areas of evaluation for this official&apos;s role and
                responsibilities.
              </p>
            </div>
            <AccountabilityVectors
              vectors={vectors}
              officialType={official.official_type}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1">
        {label}
      </span>
      <p className="text-sm text-white">{value}</p>
    </div>
  );
}
