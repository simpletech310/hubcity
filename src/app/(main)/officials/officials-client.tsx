"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import type { CivicOfficial, OfficialFlag } from "@/types/database";

type OfficialWithFlags = CivicOfficial & { flags: OfficialFlag[] };

function ImpactDot({ severity }: { severity: string }) {
  const color =
    severity === "critical"
      ? "bg-red-500"
      : severity === "warning"
        ? "bg-amber-500"
        : "bg-blue-400";
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />;
}

function OfficialTypeLabel({ type }: { type: string }) {
  const labels: Record<string, { text: string; color: string }> = {
    mayor: { text: "Mayor", color: "text-gold bg-gold/10 border-gold/20" },
    council_member: { text: "Council", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
    city_manager: { text: "City Manager", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
    board_president: { text: "Board President", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    board_vp: { text: "Vice President", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    board_clerk: { text: "Clerk of Board", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    school_trustee: { text: "Trustee", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    board_member: { text: "Board Member", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    superintendent: { text: "Superintendent", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
  };
  const l = labels[type] ?? { text: type, color: "text-zinc-400 bg-zinc-800 border-zinc-700" };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${l.color}`}>
      {l.text}
    </span>
  );
}

function OfficialCard({ official }: { official: OfficialWithFlags }) {
  const criticalFlags = official.flags?.filter((f) => f.severity === "critical").length ?? 0;
  const warningFlags = official.flags?.filter((f) => f.severity === "warning").length ?? 0;
  const totalFlags = official.flags?.length ?? 0;

  const locationLabel = official.district
    ? `District ${official.district}`
    : official.trustee_area
      ? `Area ${official.trustee_area}`
      : official.official_type === "mayor"
        ? "Citywide"
        : official.official_type === "city_manager" || official.official_type === "superintendent"
          ? "Appointed"
          : "";

  return (
    <Link
      href={`/officials/${official.id}`}
      className="group block bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 hover:border-gold/30 hover:bg-zinc-900 transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative w-14 h-14 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 ring-2 ring-zinc-700 group-hover:ring-gold/30 transition-all">
          {official.photo_url ? (
            <Image
              src={official.photo_url}
              alt={official.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-lg font-bold">
              {official.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
          )}
          {!official.is_voting_member && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center">
              <span className="text-[8px] text-zinc-400">NV</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white truncate group-hover:text-gold transition-colors">
              {official.name}
            </h3>
            <OfficialTypeLabel type={official.official_type} />
          </div>

          <p className="text-xs text-zinc-400 mt-0.5">{official.title}</p>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {locationLabel && (
              <span className="text-[10px] text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded">
                {locationLabel}
              </span>
            )}
            {official.party && (
              <span className="text-[10px] text-zinc-500">
                {official.party}
              </span>
            )}
          </div>

          {/* Election / Running info */}
          {official.running_for && official.running_for !== "N/A" && official.running_for !== "N/A (not elected)" && (
            <div className="mt-2 text-[10px] text-amber-400 bg-amber-400/5 border border-amber-400/10 rounded px-2 py-0.5 inline-block">
              Running for: {official.running_for}
            </div>
          )}

          {official.term_expires?.includes("UP FOR ELECTION") && (
            <div className="mt-1 text-[10px] text-amber-400 bg-amber-400/5 border border-amber-400/10 rounded px-2 py-0.5 inline-block">
              Up for election 2026
            </div>
          )}
        </div>

        {/* Flags indicator */}
        {totalFlags > 0 && (
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <div className="flex gap-0.5">
              {criticalFlags > 0 && <ImpactDot severity="critical" />}
              {warningFlags > 0 && <ImpactDot severity="warning" />}
              {totalFlags - criticalFlags - warningFlags > 0 && <ImpactDot severity="info" />}
            </div>
            <span className="text-[9px] text-zinc-500">{totalFlags} flag{totalFlags !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function OfficialsClient({
  councilOfficials,
  schoolOfficials,
}: {
  councilOfficials: OfficialWithFlags[];
  schoolOfficials: OfficialWithFlags[];
}) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "school_board" ? "school_board" : "council";
  const [activeTab, setActiveTab] = useState<"council" | "school_board">(initialTab);

  const tabs = [
    { id: "council" as const, label: "City Council", count: councilOfficials.length },
    { id: "school_board" as const, label: "School Board", count: schoolOfficials.length },
  ];

  const currentOfficials = activeTab === "council" ? councilOfficials : schoolOfficials;

  // Group officials by type for display
  const groupedCouncil = {
    mayor: councilOfficials.filter((o) => o.official_type === "mayor"),
    council: councilOfficials.filter((o) => o.official_type === "council_member"),
    manager: councilOfficials.filter((o) => o.official_type === "city_manager"),
  };

  const groupedSchool = {
    leadership: schoolOfficials.filter((o) =>
      ["board_president", "board_vp", "board_clerk"].includes(o.official_type)
    ),
    trustees: schoolOfficials.filter((o) =>
      ["school_trustee", "board_member"].includes(o.official_type)
    ),
    superintendent: schoolOfficials.filter((o) => o.official_type === "superintendent"),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24">
      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-zinc-800 -mx-4 px-4">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium transition-all relative ${
                activeTab === tab.id
                  ? "text-gold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] text-zinc-600">
                {tab.count}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Council Tab */}
      {activeTab === "council" && (
        <div className="mt-6 space-y-6">
          {/* Info banner */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Compton is a charter city. All positions are officially
              non-partisan per city charter. The City Manager does not vote but
              controls the agenda, hires department heads, and oversees the
              budget. Data sourced from council minutes, court records, state
              audits, and FPPC filings.
            </p>
          </div>

          {/* Mayor */}
          {groupedCouncil.mayor.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gold uppercase tracking-wider mb-3">
                Mayor
              </h2>
              <div className="space-y-2">
                {groupedCouncil.mayor.map((o) => (
                  <OfficialCard key={o.id} official={o} />
                ))}
              </div>
            </div>
          )}

          {/* Council Members */}
          {groupedCouncil.council.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gold uppercase tracking-wider mb-3">
                Council Members
              </h2>
              <div className="space-y-2">
                {groupedCouncil.council.map((o) => (
                  <OfficialCard key={o.id} official={o} />
                ))}
              </div>
            </div>
          )}

          {/* City Manager */}
          {groupedCouncil.manager.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gold uppercase tracking-wider mb-3">
                City Manager
              </h2>
              <div className="space-y-2">
                {groupedCouncil.manager.map((o) => (
                  <OfficialCard key={o.id} official={o} />
                ))}
              </div>
            </div>
          )}

          {/* Election reminder */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-amber-400 mb-1">
              June 2, 2026 Election
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Mayor and District 3 seats are up for election. Both Mayor Sharif
              and Councilman Spicer are running for Mayor. Councilman Bowers is
              seeking re-election in District 3.
            </p>
          </div>
        </div>
      )}

      {/* School Board Tab */}
      {activeTab === "school_board" && (
        <div className="mt-6 space-y-6">
          {/* Info banner */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
            <p className="text-xs text-zinc-400 leading-relaxed">
              CUSD serves ~17,000 students across 37 schools. 7 trustees
              elected by district (Areas A-G) to 4-year staggered terms. All
              trustees vote on everything for all schools — the area determines
              who elects them. Data from CUSD BoardDocs, CA Dept of Education,
              Ballotpedia, and LACOE.
            </p>
          </div>

          {/* Board Leadership */}
          {groupedSchool.leadership.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                Board Leadership
              </h2>
              <div className="space-y-2">
                {groupedSchool.leadership.map((o) => (
                  <OfficialCard key={o.id} official={o} />
                ))}
              </div>
            </div>
          )}

          {/* Trustees */}
          {groupedSchool.trustees.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                Trustees
              </h2>
              <div className="space-y-2">
                {groupedSchool.trustees.map((o) => (
                  <OfficialCard key={o.id} official={o} />
                ))}
              </div>
            </div>
          )}

          {/* Superintendent */}
          {groupedSchool.superintendent.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                Superintendent
              </h2>
              <div className="space-y-2">
                {groupedSchool.superintendent.map((o) => (
                  <OfficialCard key={o.id} official={o} />
                ))}
              </div>
            </div>
          )}

          {/* Election reminder */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-emerald-400 mb-1">
              2026 Board Election — 4 Seats Up
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Areas A (Perry), B (Davis), E (Taylor-Pleasant), and G (Zurita)
              are up for election in 2026. Note: Zurita also holds the Compton
              City Clerk position and faces a challenger for that seat.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
