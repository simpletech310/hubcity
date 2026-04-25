"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import DistrictPostComposer from "@/components/district/DistrictPostComposer";
import DistrictFeed from "@/components/district/DistrictFeed";
import DistrictProgramForm from "@/components/district/DistrictProgramForm";
import CouncilEventForm from "@/components/district/CouncilEventForm";
import CouncilInbox from "@/components/district/CouncilInbox";
import CouncilIssuesView from "@/components/district/CouncilIssuesView";

interface CouncilDashboardClientProps {
  district: number;
  districtName: string;
  districtColor: string;
  userId: string;
  userName: string;
}

const TABS = ["Feed", "Events", "Programs", "Issues", "Messages"] as const;
type Tab = (typeof TABS)[number];

export default function CouncilDashboardClient({
  district,
  districtName,
  districtColor,
  userId,
}: CouncilDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Feed");
  const [showEventForm, setShowEventForm] = useState(false);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [feedKey, setFeedKey] = useState(0);

  return (
    <div className="min-h-screen pb-28 animate-fade-in" style={{ background: "var(--paper)" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: "var(--paper)", borderBottom: "2px solid var(--rule-strong-c)" }}>
        <div className="flex items-center gap-3 px-5 py-3.5">
          <Link href="/district" className="press">
            <Icon name="back" size={20} style={{ color: "var(--ink-mute)" }} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-[17px] font-bold" style={{ color: "var(--ink-strong)" }}>Council Dashboard</h1>
            <p className="text-[11px] c-meta">{districtName}</p>
          </div>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${districtColor}20`, border: `1px solid ${districtColor}40` }}
          >
            <span className="font-heading font-bold text-[12px]" style={{ color: districtColor }}>
              D{district}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-5 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-current"
                  : "border-transparent c-meta hover:text-[var(--ink-mute)]"
              }`}
              style={activeTab === tab ? { color: districtColor, borderColor: districtColor } : undefined}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* ── Feed Tab ──────────────────────────────── */}
        {activeTab === "Feed" && (
          <>
            <DistrictPostComposer
              district={district}
              userId={userId}
              districtColor={districtColor}
              onPost={() => setFeedKey((k) => k + 1)}
            />
            <DistrictFeed
              key={feedKey}
              district={district}
              districtColor={districtColor}
              userId={userId}
              isCouncilMember={true}
            />
          </>
        )}

        {/* ── Events Tab ────────────────────────────── */}
        {activeTab === "Events" && (
          <>
            <button
              onClick={() => setShowEventForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border border-dashed transition-colors press c-meta hover:text-[var(--ink-mute)]"
            style={{ borderColor: "var(--rule-strong-c)" }}
            >
              <Icon name="plus" size={16} />
              <span className="text-xs font-semibold">Create Event</span>
            </button>

            <CouncilEventForm
              district={district}
              isOpen={showEventForm}
              onClose={() => setShowEventForm(false)}
              onCreated={() => setShowEventForm(false)}
            />

            <EventsList district={district} />
          </>
        )}

        {/* ── Programs Tab ──────────────────────────── */}
        {activeTab === "Programs" && (
          <>
            <button
              onClick={() => setShowProgramForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border border-dashed transition-colors press c-meta hover:text-[var(--ink-mute)]"
            style={{ borderColor: "var(--rule-strong-c)" }}
            >
              <Icon name="plus" size={16} />
              <span className="text-xs font-semibold">Create Program</span>
            </button>

            <DistrictProgramForm
              district={district}
              isOpen={showProgramForm}
              onClose={() => setShowProgramForm(false)}
              onCreated={() => setShowProgramForm(false)}
            />

            <ProgramsList district={district} />
          </>
        )}

        {/* ── Issues Tab ────────────────────────────── */}
        {activeTab === "Issues" && <CouncilIssuesView district={district} />}

        {/* ── Messages Tab ──────────────────────────── */}
        {activeTab === "Messages" && <CouncilInbox district={district} />}
      </div>
    </div>
  );
}

/* ── Events List ──────────────────────────────────── */

function EventsList({ district }: { district: number }) {
  const [events, setEvents] = useState<Array<{
    id: string;
    title: string;
    start_date: string;
    location_name: string | null;
    category: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/districts/${district}/events`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events ?? []);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, [district]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse" style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-10" style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}>
        <Icon name="calendar" size={28} className="c-meta mx-auto mb-2" />
        <p className="text-xs c-meta">No upcoming events</p>
        <p className="text-[10px] c-meta mt-1">Create an event for your district</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => {
        const date = new Date(event.start_date);
        return (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="block p-3.5 press hover:border-gold/20 transition-colors"
            style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-14 flex flex-col items-center justify-center shrink-0" style={{ background: "var(--paper-soft)", border: "2px solid var(--rule-strong-c)" }}>
                <p className="text-[9px] text-gold font-bold uppercase leading-none">
                  {date.toLocaleDateString("en-US", { month: "short" })}
                </p>
                <p className="text-[18px] font-heading font-bold leading-none mt-0.5" style={{ color: "var(--ink-strong)" }}>
                  {date.getDate()}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: "var(--ink-strong)" }}>{event.title}</p>
                {event.location_name && (
                  <p className="text-[11px] c-meta truncate mt-0.5">{event.location_name}</p>
                )}
                {event.category && (
                  <span className="inline-block mt-1.5 text-[9px] font-semibold text-gold bg-hc-purple/10 rounded-full px-2 py-0.5">
                    {event.category}
                  </span>
                )}
              </div>
              <Icon name="chevron-right" size={14} className="shrink-0" style={{ color: "var(--ink-mute)" }} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ── Programs List ────────────────────────────────── */

const PROGRAM_COLORS: Record<string, { text: string; bg: string }> = {
  community: { text: "text-gold", bg: "bg-gold/10" },
  youth: { text: "text-cyan", bg: "bg-cyan/10" },
  sports: { text: "text-emerald", bg: "bg-emerald/10" },
  education: { text: "text-hc-blue", bg: "bg-hc-blue/10" },
  health: { text: "text-coral", bg: "bg-coral/10" },
  senior: { text: "text-gold", bg: "bg-hc-purple/10" },
  arts: { text: "text-pink", bg: "bg-pink/10" },
};

function ProgramsList({ district }: { district: number }) {
  const [programs, setPrograms] = useState<Array<{
    id: string;
    title: string;
    description: string | null;
    category: string;
    schedule: string | null;
    location_name: string | null;
    is_active: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/districts/${district}/programs`);
        if (res.ok) {
          const data = await res.json();
          setPrograms(data.programs ?? []);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, [district]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse" style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }} />
        ))}
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="text-center py-10" style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}>
        <Icon name="heart-pulse" size={28} className="c-meta mx-auto mb-2" />
        <p className="text-xs c-meta">No programs yet</p>
        <p className="text-[10px] c-meta mt-1">Create a program for your district</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {programs.map((program) => {
        const colors = PROGRAM_COLORS[program.category] ?? PROGRAM_COLORS.community;
        return (
          <div key={program.id} className="p-4" style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold" style={{ color: "var(--ink-strong)" }}>{program.title}</p>
                {program.description && (
                  <p className="text-[12px] c-meta mt-1 line-clamp-2">{program.description}</p>
                )}
              </div>
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} shrink-0`}>
                {program.category}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-[11px] c-meta">
              {program.schedule && (
                <span className="flex items-center gap-1">
                  <Icon name="clock" size={12} />
                  {program.schedule}
                </span>
              )}
              {program.location_name && (
                <span className="flex items-center gap-1">
                  <Icon name="map-pin" size={12} />
                  {program.location_name}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
