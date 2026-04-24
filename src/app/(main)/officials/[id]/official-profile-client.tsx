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

const TYPE_LABELS: Record<string, { text: string; variant: "gold" | "ink" }> = {
  mayor: { text: "Mayor", variant: "gold" },
  council_member: { text: "Council Member", variant: "ink" },
  city_manager: { text: "City Manager", variant: "ink" },
  board_president: { text: "Board President", variant: "ink" },
  board_vp: { text: "Vice President", variant: "ink" },
  board_clerk: { text: "Clerk of Board", variant: "ink" },
  school_trustee: { text: "Trustee", variant: "ink" },
  board_member: { text: "Board Member", variant: "ink" },
  superintendent: { text: "Superintendent", variant: "ink" },
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
    variant: "ink" as const,
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
          <div
            className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0"
            style={{ background: "var(--paper-soft)", border: "2px solid var(--rule-strong-c)" }}
          >
            {official.photo_url ? (
              <Image
                src={official.photo_url}
                alt={official.name}
                fill
                className="object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-2xl font-bold"
                style={{ color: "var(--ink-strong)", opacity: 0.6 }}
              >
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
              <h1 className="c-hero" style={{ fontSize: 24, lineHeight: 1 }}>
                {official.name}
              </h1>
              {!official.is_voting_member && (
                <span className="c-badge-ink">Non-Voting</span>
              )}
            </div>

            <p className="c-body text-sm mt-0.5">{official.title}</p>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={typeLabel.variant === "gold" ? "c-badge-gold" : "c-badge-ink"}>
                {typeLabel.text}
              </span>
              {locationLabel && (
                <span className="c-meta" style={{ fontSize: 10 }}>
                  {locationLabel}
                </span>
              )}
              {official.party && (
                <span className="c-meta" style={{ fontSize: 10 }}>
                  {official.party}
                </span>
              )}
            </div>

            {/* Flag summary */}
            {flags.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                {criticalFlags > 0 && (
                  <span className="c-badge-live">{criticalFlags} critical</span>
                )}
                {warningFlags > 0 && (
                  <span className="c-badge-gold">{warningFlags} warning</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Election / Running info */}
        {official.running_for &&
          official.running_for !== "N/A" &&
          official.running_for !== "N/A (not elected)" && (
            <div className="mt-4 c-frame p-3" style={{ background: "var(--paper-warm)" }}>
              <p className="c-card-t" style={{ color: "var(--gold-c)" }}>
                Running for: {official.running_for}
              </p>
              {official.term_expires && (
                <p className="c-meta mt-0.5" style={{ fontSize: 10 }}>
                  Term: {official.term_expires}
                </p>
              )}
            </div>
          )}
      </div>

      {/* Tabs */}
      <div
        className="sticky top-0 z-10 -mx-4 px-4"
        style={{
          background: "var(--paper)",
          borderBottom: "2px solid var(--rule-strong-c)",
        }}
      >
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="whitespace-nowrap py-3 px-4 text-sm font-medium transition-all relative"
              style={{
                color: activeTab === tab.id ? "var(--gold-c)" : "var(--ink-strong)",
                opacity: activeTab === tab.id ? 1 : 0.6,
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 text-[10px]" style={{ opacity: 0.5 }}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: "var(--gold-c)" }}
                />
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
              <div className="c-frame p-4" style={{ background: "var(--paper-warm)" }}>
                <h3 className="c-kicker mb-2" style={{ color: "var(--gold-c)" }}>
                  Background
                </h3>
                <p className="c-body text-sm leading-relaxed whitespace-pre-line">
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
                <h3 className="c-kicker mb-3" style={{ color: "var(--ink-strong)" }}>
                  Schools in Area {official.trustee_area}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {areaSchools.map((school) => (
                    <div
                      key={school.id}
                      className="c-frame p-3"
                      style={{ background: "var(--paper)" }}
                    >
                      <p className="c-card-t text-[13px]">
                        {school.school_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="c-badge-ink">
                          {school.school_type}
                        </span>
                        <span className="c-meta" style={{ fontSize: 10 }}>
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
                  <h3 className="c-kicker" style={{ color: "var(--ink-strong)" }}>
                    Active Flags
                  </h3>
                  <button
                    onClick={() => setActiveTab("flags")}
                    className="text-[10px] transition-colors"
                    style={{ color: "var(--gold-c)" }}
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
                  <h3 className="c-kicker" style={{ color: "var(--ink-strong)" }}>
                    Recent Votes
                  </h3>
                  <button
                    onClick={() => setActiveTab("votes")}
                    className="text-[10px] transition-colors"
                    style={{ color: "var(--gold-c)" }}
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
                  <h3 className="c-kicker" style={{ color: "var(--ink-strong)" }}>
                    Recent Actions
                  </h3>
                  <button
                    onClick={() => setActiveTab("actions")}
                    className="text-[10px] transition-colors"
                    style={{ color: "var(--gold-c)" }}
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
              <h2 className="c-card-t text-sm">Voting Record</h2>
              <p className="c-meta mt-0.5" style={{ fontSize: 11 }}>
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
              <h2 className="c-card-t text-sm">Executive Actions</h2>
              <p className="c-meta mt-0.5" style={{ fontSize: 11 }}>
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
              <h2 className="c-card-t text-sm">Flags &amp; Controversies</h2>
              <p className="c-meta mt-0.5" style={{ fontSize: 11 }}>
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
              <h2 className="c-card-t text-sm">Accountability Vectors</h2>
              <p className="c-meta mt-0.5" style={{ fontSize: 11 }}>
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
    <div className="c-frame p-3" style={{ background: "var(--paper)" }}>
      <span className="c-kicker block mb-1">
        {label}
      </span>
      <p className="text-sm" style={{ color: "var(--ink-strong)" }}>{value}</p>
    </div>
  );
}
