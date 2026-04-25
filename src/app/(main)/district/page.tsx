import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/server";
import { getAccess, canSee } from "@/lib/access";
import { DISTRICT_NAMES, getTrusteeAreasFromZip } from "@/lib/districts";
import type { TrusteeArea } from "@/lib/districts";
import OfficialCard from "@/components/officials/OfficialCard";
import DistrictMap from "@/components/district/DistrictMap";
import PollCard from "@/components/pulse/PollCard";
import SurveyCard from "@/components/pulse/SurveyCard";
import DistrictFeed from "@/components/district/DistrictFeed";
import DistrictMessageForm from "@/components/district/DistrictMessageForm";

export const metadata = {
  title: "My District | Culture",
  description: "Your personalized district hub — council member, events, alerts, and community voice.",
};

const DISTRICT_COLORS: Record<number, { text: string; bg: string; border: string; accent: string }> = {
  1: { text: "text-hc-blue", bg: "bg-hc-blue", border: "border-hc-blue", accent: "#3B82F6" },
  2: { text: "text-gold", bg: "bg-hc-purple", border: "border-gold", accent: "#8B5CF6" },
  3: { text: "text-emerald", bg: "bg-emerald", border: "border-emerald", accent: "#22C55E" },
  4: { text: "text-gold", bg: "bg-gold", border: "border-gold", accent: "#F2A900" },
};

const COUNCIL_HANDLES: Record<number, string> = {
  1: "council_duhart",
  2: "council_spicer",
  3: "council_bowers",
  4: "council_darden",
};

export default async function DistrictPage() {
  const supabase = await createClient();

  const access = await getAccess();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gate the verified-only "District Programs" overlay: visible to a verified
  // resident when viewing their home city. Everyone else sees a prompt to
  // verify their address. See src/lib/access.ts for the full matrix.
  const canSeeDistrictPrograms = canSee(
    "district_programs",
    access.mode,
    access.homeCityId,
    access.homeCityId
  );

  let userDistrict: number | null = null;
  let userDisplayName: string | null = null;
  let userZip: string | null = null;
  let userId: string | null = user?.id ?? null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("district, display_name, zip")
      .eq("id", user.id)
      .single();
    userDistrict = profile?.district ?? null;
    userDisplayName = profile?.display_name ?? null;
    userZip = profile?.zip ?? null;
  }

  // Derive trustee areas from ZIP (client-side mapping + DB lookup)
  const localTrusteeAreas: TrusteeArea[] = userZip ? getTrusteeAreasFromZip(userZip) : [];

  const today = new Date().toISOString().split("T")[0];
  const districtColor = userDistrict ? DISTRICT_COLORS[userDistrict] : null;

  // Build queries based on whether user has a district
  const councilHandle = userDistrict ? COUNCIL_HANDLES[userDistrict] : null;

  // Fetch all data in parallel
  const [
    { data: councilMember },
    { data: mayor },
    { data: districtEvents },
    { data: districtAlerts },
    { data: activePolls },
    { data: activeSurveys },
    { data: officialPosts },
    { count: businessCount },
    { data: districtSchools },
    { data: districtParks },
    { data: allCouncil },
    { data: parkPrograms },
    { data: schoolTrustees },
    { data: trusteeAreaSchools },
    { data: councilVotes },
    { data: boardActions },
    { data: districtPrograms },
  ] = await Promise.all([
    // Council member for user's district
    councilHandle
      ? supabase
          .from("profiles")
          .select("id, display_name, avatar_url, bio, role, handle, district")
          .eq("handle", councilHandle)
          .single()
      : Promise.resolve({ data: null }),
    // Mayor (always shown)
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url, bio, role, handle, district")
      .eq("handle", "mayor_sharif")
      .single(),
    // Events — filtered by district if signed in
    userDistrict
      ? supabase
          .from("events")
          .select("*")
          .gte("start_date", today)
          .eq("is_published", true)
          .eq("district", userDistrict)
          .order("start_date")
          .limit(5)
      : supabase
          .from("events")
          .select("*")
          .gte("start_date", today)
          .eq("is_published", true)
          .order("start_date")
          .limit(5),
    // City alerts — filtered by affected_districts if signed in
    userDistrict
      ? supabase
          .from("city_alerts")
          .select("id, title, body, alert_type, severity, affected_districts")
          .eq("is_active", true)
          .contains("affected_districts", [userDistrict])
          .order("created_at", { ascending: false })
          .limit(5)
      : supabase
          .from("city_alerts")
          .select("id, title, body, alert_type, severity, affected_districts")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(5),
    // Active polls (global — no district field)
    supabase
      .from("polls")
      .select("*, options:poll_options(*), author:profiles!polls_author_id_fkey(id, display_name, avatar_url, role, handle, verification_status)")
      .eq("status", "active")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(3),
    // Active surveys (global — no district field)
    supabase
      .from("surveys")
      .select("*, questions:survey_questions(*), author:profiles!surveys_author_id_fkey(id, display_name, avatar_url, role, handle, verification_status)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(3),
    // Official posts from district council member
    councilHandle
      ? supabase
          .from("posts")
          .select("id, body, created_at, author:profiles!posts_author_id_fkey(id, display_name, avatar_url, role, handle)")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(5)
      : supabase
          .from("posts")
          .select("id, body, created_at, author:profiles!posts_author_id_fkey(id, display_name, avatar_url, role, handle)")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(5),
    // Business count
    supabase
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    // Schools — filtered by district if signed in
    userDistrict
      ? supabase
          .from("schools")
          .select("id, name, slug, address, level, mascot, district, image_urls")
          .eq("is_published", true)
          .eq("district", userDistrict)
          .order("name")
      : supabase
          .from("schools")
          .select("id, name, slug, address, level, mascot, district, image_urls")
          .eq("is_published", true)
          .order("name")
          .limit(6),
    // Parks — filtered by district if signed in
    userDistrict
      ? supabase
          .from("parks")
          .select("id, name, slug, address, district, amenities, image_urls")
          .eq("district", userDistrict)
          .order("name")
      : supabase
          .from("parks")
          .select("id, name, slug, address, district, amenities, image_urls")
          .order("name")
          .limit(6),
    // All council members (for non-signed-in view)
    !userDistrict
      ? supabase
          .from("profiles")
          .select("id, display_name, avatar_url, bio, role, handle, district")
          .eq("role", "city_official")
          .order("display_name")
      : Promise.resolve({ data: null }),
    // Park programs for district parks
    userDistrict
      ? supabase
          .from("park_programs")
          .select("id, name, park_id, age_range, schedule, parks!inner(name, district)")
          .eq("is_active", true)
          .eq("parks.district", userDistrict)
          .limit(10)
      : Promise.resolve({ data: null }),
    // School trustees for user's trustee areas
    localTrusteeAreas.length > 0
      ? supabase
          .from("civic_officials")
          .select("*")
          .in("trustee_area", localTrusteeAreas)
          .in("official_type", ["school_board_member", "school_board_president", "school_board_vp", "school_board_clerk"])
          .order("name")
      : Promise.resolve({ data: null }),
    // Schools in user's trustee areas
    localTrusteeAreas.length > 0
      ? supabase
          .from("trustee_area_schools")
          .select("*")
          .in("trustee_area", localTrusteeAreas)
          .order("school_name")
      : Promise.resolve({ data: null }),
    // Recent council decisions
    supabase
      .from("council_votes")
      .select("*, rolls:council_vote_rolls(*, official:civic_officials(id, name, trustee_area, district))")
      .order("vote_date", { ascending: false })
      .limit(5),
    // Recent school board decisions
    supabase
      .from("board_actions")
      .select("*, rolls:board_action_rolls(*, official:civic_officials(id, name, trustee_area, district))")
      .order("action_date", { ascending: false })
      .limit(5),
    // District programs (council-created)
    userDistrict
      ? supabase
          .from("district_programs")
          .select("id, title, category, schedule, location_name")
          .eq("district", userDistrict)
          .eq("is_active", true)
          .limit(10)
      : Promise.resolve({ data: null }),
  ]);

  // Filter official posts to city officials only
  const officialPostsList = (officialPosts ?? []).filter((p) => {
    const authorArr = p.author as unknown as { role: string; handle: string }[] | null;
    const author = authorArr?.[0];
    return author?.role === "city_official";
  });

  // For polls/surveys, add user_vote / user_responded info
  const pollsWithVotes = await Promise.all(
    (activePolls ?? []).map(async (poll) => {
      if (!userId) return { ...poll, user_vote: null, total_votes: poll.options?.reduce((sum: number, o: { vote_count: number }) => sum + o.vote_count, 0) ?? 0 };
      const { data: vote } = await supabase
        .from("poll_votes")
        .select("option_id")
        .eq("poll_id", poll.id)
        .eq("user_id", userId)
        .maybeSingle();
      return {
        ...poll,
        user_vote: vote?.option_id ?? null,
        total_votes: poll.options?.reduce((sum: number, o: { vote_count: number }) => sum + o.vote_count, 0) ?? 0,
      };
    })
  );

  const surveysWithResponses = await Promise.all(
    (activeSurveys ?? []).map(async (survey) => {
      if (!userId) return { ...survey, user_responded: false, response_count: survey.response_count ?? 0 };
      const { count } = await supabase
        .from("survey_responses")
        .select("id", { count: "exact", head: true })
        .eq("survey_id", survey.id)
        .eq("user_id", userId);
      return {
        ...survey,
        user_responded: (count ?? 0) > 0,
        response_count: survey.response_count ?? 0,
      };
    })
  );

  const eventsList = districtEvents ?? [];
  const alertsList = districtAlerts ?? [];
  const schoolsList = districtSchools ?? [];
  const parksList = districtParks ?? [];
  const trusteesList = schoolTrustees ?? [];
  const areaSchoolsList = trusteeAreaSchools ?? [];
  const councilVotesList = councilVotes ?? [];
  const boardActionsList = boardActions ?? [];

  const severityStyles: Record<string, { icon: IconName; color: string; bg: string }> = {
    critical: { icon: "alert", color: "text-coral", bg: "bg-coral/10" },
    high: { icon: "alert", color: "text-coral", bg: "bg-coral/10" },
    medium: { icon: "alert", color: "text-gold", bg: "bg-gold/10" },
    low: { icon: "info", color: "text-cyan", bg: "bg-cyan/10" },
    info: { icon: "info", color: "text-cyan", bg: "bg-cyan/10" },
  };

  const quickLinks: { label: string; href: string; icon: IconName; color: string }[] = [
    { label: "Report Issue", href: "/city-hall/issues", icon: "megaphone", color: "text-coral" },
    { label: "City Data", href: "/city-data", icon: "chart", color: "text-cyan" },
    { label: "Events", href: "/events", icon: "calendar", color: "text-gold" },
    { label: "Parks", href: "/parks", icon: "tree", color: "text-emerald" },
    { label: "Schools", href: "/schools", icon: "graduation", color: "text-gold" },
    { label: "Resources", href: "/resources", icon: "heart-pulse", color: "text-pink" },
  ];

  return (
    <div className="culture-surface min-h-dvh pb-28">
      {/* Hero */}
      <div
        className="px-[18px] pt-5 pb-5"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § VOL·01 · ISSUE CIVIC · {userDistrict ? `DISTRICT ${userDistrict}` : "ALL DISTRICTS"}
        </div>
        <h1 className="c-hero mt-2" style={{ fontSize: 48, lineHeight: 0.9 }}>
          {userDistrict ? (DISTRICT_NAMES[userDistrict] ?? `District ${userDistrict}`) : "My District."}
        </h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          {userDisplayName
            ? `Welcome back, ${userDisplayName.split(" ")[0]}. Your personalized district hub.`
            : "Explore all 4 council districts."}
        </p>
      </div>
      {/* Map */}
      <div className="relative">
        <DistrictMap
          district={userDistrict}
          height="220px"
          className="w-full"
        />
      </div>

      <div className="px-5 space-y-5 mt-2">
        {/* ── Sign In CTA (not signed in) ────────────── */}
        {!user && (
          <Link
            href="/auth"
            className="block c-frame p-4 press"
            style={{ background: "var(--paper-warm)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: "var(--gold-c)", border: "2px solid var(--rule-strong-c)" }}>
                <Icon name="users" size={18} className="text-gold" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gold">Sign in to see your district</p>
                <p className="text-[11px] c-meta mt-0.5">Get personalized content for your area</p>
              </div>
              <Icon name="chevron-right" size={14} className="text-gold/50" />
            </div>
          </Link>
        )}

        {/* ── No District CTA (signed in but no district) ── */}
        {user && !userDistrict && (
          <Link
            href="/profile"
            className="block c-frame p-4 press"
            style={{ background: "var(--paper-warm)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: "var(--gold-c)", border: "2px solid var(--rule-strong-c)" }}>
                <Icon name="map-pin" size={18} className="text-gold" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gold">Set your district</p>
                <p className="text-[11px] c-meta mt-0.5">Add your address in profile to see district-specific content</p>
              </div>
              <Icon name="chevron-right" size={14} className="text-gold/50" />
            </div>
          </Link>
        )}

        {/* ── Council Member(s) ──────────────────────── */}
        <div>
          <p className="c-kicker mb-3" style={{ opacity: 0.65 }}>
            {userDistrict ? "Your Representatives" : "Meet Your Council"}
          </p>
          <div className="space-y-3">
            {/* Mayor — always shown */}
            {mayor && (
              <CouncilCard
                name={mayor.display_name}
                title="Mayor"
                bio={mayor.bio}
                avatarUrl={mayor.avatar_url}
                handle={mayor.handle}
                accentColor="#F2A900"
              />
            )}

            {/* District council member (signed in with district) */}
            {userDistrict && councilMember && (
              <CouncilCard
                name={councilMember.display_name}
                title={`Council Member — District ${userDistrict}`}
                bio={councilMember.bio}
                avatarUrl={councilMember.avatar_url}
                handle={councilMember.handle}
                accentColor={districtColor?.accent ?? "#F2A900"}
              />
            )}

            {/* All council members (not signed in or no district) */}
            {!userDistrict && allCouncil && allCouncil
              .filter((c) => c.handle !== "mayor_sharif")
              .map((member) => {
                const mDistrict = member.district as number | null;
                const mColor = mDistrict ? DISTRICT_COLORS[mDistrict]?.accent : "#F2A900";
                return (
                  <CouncilCard
                    key={member.id}
                    name={member.display_name}
                    title={mDistrict ? `Council Member — District ${mDistrict}` : "Council Member"}
                    bio={member.bio}
                    avatarUrl={member.avatar_url}
                    handle={member.handle}
                    accentColor={mColor ?? "#F2A900"}
                  />
                );
              })}
          </div>
        </div>

        {/* ── Your School Trustee(s) ─────────────────── */}
        {trusteesList.length > 0 && (
          <div>
            <p className="c-kicker mb-3" style={{ opacity: 0.65 }}>
              Your School Trustee{trusteesList.length > 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {trusteesList.map((trustee: any) => (
                <OfficialCard key={trustee.id} official={trustee} compact />
              ))}
            </div>
          </div>
        )}

        {/* ── Schools in Your Trustee Area ──────────── */}
        {areaSchoolsList.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="c-kicker" style={{ opacity: 0.65 }}>
                Schools in Your Area
              </p>
              <Link href="/schools" className="c-meta" style={{ color: "var(--gold-c)", fontSize: 10 }}>
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {areaSchoolsList.map((school: any) => (
                <div
                  key={school.id}
                  className="c-frame p-3.5" style={{ background: "var(--paper)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0 c-frame">
                      <Icon name="graduation" size={18} className="text-emerald" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold" style={{ color: "var(--ink-strong)" }}>{school.school_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {school.school_type && (
                          <span className="text-[9px] font-semibold text-emerald bg-emerald/10 rounded-full px-2 py-0.5 capitalize">
                            {school.school_type}
                          </span>
                        )}
                        {school.grades && (
                          <span className="text-[9px] c-meta">
                            Grades {school.grades}
                          </span>
                        )}
                        {school.trustee_area && (
                          <span className="text-[9px] text-gold/60 bg-hc-purple/8 rounded-full px-1.5 py-0.5">
                            Area {school.trustee_area}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recent Council Decisions ──────────────── */}
        {councilVotesList.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="c-kicker" style={{ opacity: 0.65 }}>
                Recent Council Decisions
              </p>
              <Link href="/officials" className="c-meta" style={{ color: "var(--gold-c)", fontSize: 10 }}>
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {councilVotesList.map((vote: any) => {
                const userCouncilRoll = userDistrict
                  ? (vote.rolls ?? []).find((r: any) => r.official?.district === userDistrict)
                  : null;
                return (
                  <div
                    key={vote.id}
                    className="c-frame p-3.5" style={{ background: "var(--paper)" }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        vote.impact_level === "high"
                          ? "bg-coral/10 border border-coral/15"
                          : vote.impact_level === "medium"
                          ? "bg-gold/10 border border-gold/15"
                          : "bg-cyan/10 border border-cyan/15"
                      }`}>
                        <Icon
                          name="megaphone"
                          size={16}
                          className={
                            vote.impact_level === "high"
                              ? "text-coral"
                              : vote.impact_level === "medium"
                              ? "text-gold"
                              : "text-cyan"
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold" style={{ color: "var(--ink-strong)" }}>{vote.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            vote.result === "passed" || vote.result === "approved"
                              ? "text-emerald bg-emerald/10"
                              : vote.result === "failed" || vote.result === "denied"
                              ? "text-coral bg-coral/10"
                              : "c-meta"
                          }`}>
                            {vote.result}
                          </span>
                          <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${
                            vote.impact_level === "high"
                              ? "text-coral/70 bg-coral/8"
                              : vote.impact_level === "medium"
                              ? "text-gold/70 bg-gold/8"
                              : "text-cyan/70 bg-cyan/8"
                          }`}>
                            {vote.impact_level} impact
                          </span>
                          <span className="text-[10px] c-meta">
                            {new Date(vote.vote_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        {userCouncilRoll && (
                          <p className="text-[11px] mt-1.5">
                            <span className="c-meta">Your rep voted: </span>
                            <span className={`font-semibold ${
                              userCouncilRoll.position === "aye"
                                ? "text-emerald"
                                : userCouncilRoll.position === "nay"
                                ? "text-coral"
                                : "c-meta"
                            }`}>
                              {userCouncilRoll.position}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Recent School Board Decisions ─────────── */}
        {boardActionsList.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="c-kicker" style={{ opacity: 0.65 }}>
                Recent School Board Decisions
              </p>
              <Link href="/officials" className="c-meta" style={{ color: "var(--gold-c)", fontSize: 10 }}>
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {boardActionsList.map((action: any) => {
                const userTrusteeRoll = localTrusteeAreas.length > 0
                  ? (action.rolls ?? []).find((r: any) =>
                      localTrusteeAreas.includes(r.official?.trustee_area)
                    )
                  : null;
                return (
                  <div
                    key={action.id}
                    className="c-frame p-3.5" style={{ background: "var(--paper)" }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        action.impact_level === "high"
                          ? "bg-hc-purple/10 border border-gold/15"
                          : action.impact_level === "medium"
                          ? "bg-gold/10 border border-gold/15"
                          : "bg-cyan/10 border border-cyan/15"
                      }`}>
                        <Icon
                          name="graduation"
                          size={16}
                          className={
                            action.impact_level === "high"
                              ? "text-gold"
                              : action.impact_level === "medium"
                              ? "text-gold"
                              : "text-cyan"
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold" style={{ color: "var(--ink-strong)" }}>{action.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            action.result === "passed" || action.result === "approved"
                              ? "text-emerald bg-emerald/10"
                              : action.result === "failed" || action.result === "denied"
                              ? "text-coral bg-coral/10"
                              : "c-meta"
                          }`}>
                            {action.result}
                          </span>
                          <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${
                            action.impact_level === "high"
                              ? "text-gold/70 bg-hc-purple/8"
                              : action.impact_level === "medium"
                              ? "text-gold/70 bg-gold/8"
                              : "text-cyan/70 bg-cyan/8"
                          }`}>
                            {action.impact_level} impact
                          </span>
                          <span className="text-[10px] c-meta">
                            {new Date(action.action_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        {userTrusteeRoll && (
                          <p className="text-[11px] mt-1.5">
                            <span className="c-meta">Your trustee voted: </span>
                            <span className={`font-semibold ${
                              userTrusteeRoll.position === "aye"
                                ? "text-emerald"
                                : userTrusteeRoll.position === "nay"
                                ? "text-coral"
                                : "c-meta"
                            }`}>
                              {userTrusteeRoll.position}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── District Stats ─────────────────────────── */}
        <div>
          <p className="c-kicker mb-3" style={{ opacity: 0.65 }}>
            {userDistrict ? "District Overview" : "Compton at a Glance"}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Events", count: eventsList.length, icon: "calendar" as IconName },
              { label: "Businesses", count: businessCount ?? 0, icon: "store" as IconName },
              { label: "Schools", count: schoolsList.length, icon: "graduation" as IconName },
              { label: "Parks", count: parksList.length, icon: "tree" as IconName },
            ].map((stat) => (
              <div
                key={stat.label}
                className="c-frame p-2.5 text-center"
                style={{ background: "var(--paper-warm)" }}
              >
                <Icon name={stat.icon} size={16} style={{ color: "var(--gold-c)" }} className="mx-auto mb-1" />
                <p className="c-hero" style={{ fontSize: 18, color: "var(--ink-strong)" }}>{stat.count}</p>
                <p className="c-meta" style={{ fontSize: 8 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick Facts ─────────────────────────── */}
        {userDistrict && (schoolsList.length > 0 || parksList.length > 0 || (parkPrograms && parkPrograms.length > 0) || (districtPrograms && districtPrograms.length > 0)) && (
          <div>
            <p className="c-kicker mb-3" style={{ opacity: 0.65 }}>
              Quick Facts — {DISTRICT_NAMES[userDistrict] ?? `District ${userDistrict}`}
            </p>
            <div className="c-frame overflow-hidden" style={{ background: "var(--paper)" }}>
              {/* Schools by level */}
              {schoolsList.length > 0 && (() => {
                const elementary = schoolsList.filter((s) => s.level === "elementary");
                const middle = schoolsList.filter((s) => s.level === "middle_school");
                const high = schoolsList.filter((s) => s.level === "high_school");
                return (
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-7 h-7 rounded-lg bg-cyan/10 flex items-center justify-center">
                        <Icon name="graduation" size={14} className="text-cyan" />
                      </div>
                      <p className="text-[12px] font-semibold" style={{ color: "var(--ink-strong)" }}>Your Schools</p>
                    </div>
                    <div className="space-y-2 pl-9">
                      {elementary.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-cyan/70 uppercase tracking-wider mb-1">Elementary</p>
                          {elementary.map((s) => (
                            <Link key={s.id} href={`/schools/${s.slug || s.id}`} className="block text-[12px] c-meta hover:text-[var(--ink-strong)] transition-colors py-0.5 press">
                              {s.name} {s.mascot && <span className="c-meta">· {s.mascot}</span>}
                            </Link>
                          ))}
                        </div>
                      )}
                      {middle.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-cyan/70 uppercase tracking-wider mb-1">Middle School</p>
                          {middle.map((s) => (
                            <Link key={s.id} href={`/schools/${s.slug || s.id}`} className="block text-[12px] c-meta hover:text-[var(--ink-strong)] transition-colors py-0.5 press">
                              {s.name} {s.mascot && <span className="c-meta">· {s.mascot}</span>}
                            </Link>
                          ))}
                        </div>
                      )}
                      {high.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-cyan/70 uppercase tracking-wider mb-1">High School</p>
                          {high.map((s) => (
                            <Link key={s.id} href={`/schools/${s.slug || s.id}`} className="block text-[12px] c-meta hover:text-[var(--ink-strong)] transition-colors py-0.5 press">
                              {s.name} {s.mascot && <span className="c-meta">· {s.mascot}</span>}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Parks + amenities snapshot */}
              {parksList.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald/10 flex items-center justify-center">
                      <Icon name="tree" size={14} className="text-emerald" />
                    </div>
                    <p className="text-[12px] font-semibold" style={{ color: "var(--ink-strong)" }}>Your Parks</p>
                  </div>
                  <div className="space-y-2 pl-9">
                    {parksList.slice(0, 5).map((park) => (
                      <Link key={park.id} href={`/parks/${park.slug || park.id}`} className="block py-0.5 press">
                        <p className="text-[12px] c-meta hover:text-[var(--ink-strong)] transition-colors">{park.name}</p>
                        {park.amenities && park.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {park.amenities.slice(0, 5).map((a: string) => (
                              <span key={a} className="text-[8px] text-emerald/60 bg-emerald/8 rounded-full px-1.5 py-0.5 capitalize">
                                {a.replace(/_/g, " ")}
                              </span>
                            ))}
                            {park.amenities.length > 5 && (
                              <span className="text-[8px] c-meta">+{park.amenities.length - 5} more</span>
                            )}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Park Programs */}
              {parkPrograms && parkPrograms.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-7 h-7 rounded-lg bg-hc-purple/10 flex items-center justify-center">
                      <Icon name="calendar" size={14} className="text-gold" />
                    </div>
                    <p className="text-[12px] font-semibold" style={{ color: "var(--ink-strong)" }}>Park Programs</p>
                  </div>
                  <div className="space-y-1.5 pl-9">
                    {parkPrograms.slice(0, 5).map((prog: { id: string; name: string; age_range: string | null; schedule: string | null; parks: { name: string } | { name: string }[] | null }) => {
                      const parkName = Array.isArray(prog.parks) ? prog.parks[0]?.name : prog.parks?.name;
                      return (
                        <div key={prog.id} className="py-0.5">
                          <p className="text-[12px]" style={{ color: "var(--ink-mute)" }}>{prog.name}</p>
                          <div className="flex items-center gap-2 text-[10px] c-meta mt-0.5">
                            {parkName && <span>{parkName}</span>}
                            {prog.age_range && <><span className="c-meta">·</span><span>{prog.age_range}</span></>}
                            {prog.schedule && <><span className="c-meta">·</span><span>{prog.schedule}</span></>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* District Programs (council-created) — verified residents only */}
              {districtPrograms && districtPrograms.length > 0 && canSeeDistrictPrograms && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                      <Icon name="heart-pulse" size={14} className="text-gold" />
                    </div>
                    <p className="text-[12px] font-semibold" style={{ color: "var(--ink-strong)" }}>Community Programs</p>
                  </div>
                  <div className="space-y-1.5 pl-9">
                    {districtPrograms.slice(0, 5).map((prog: { id: string; title: string; category: string; schedule: string | null; location_name: string | null }) => (
                      <div key={prog.id} className="py-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-[12px]" style={{ color: "var(--ink-mute)" }}>{prog.title}</p>
                          <span className="text-[8px] font-semibold text-gold/60 bg-gold/8 rounded-full px-1.5 py-0.5 capitalize">{prog.category}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] c-meta mt-0.5">
                          {prog.location_name && <span>{prog.location_name}</span>}
                          {prog.schedule && <><span className="c-meta">·</span><span>{prog.schedule}</span></>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gated prompt: shown to signed-in users who haven't verified */}
              {!canSeeDistrictPrograms && access.mode !== "anonymous" && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                      <Icon name="pin" size={14} className="text-gold" />
                    </div>
                    <p className="text-[12px] font-semibold" style={{ color: "var(--ink-strong)" }}>Community Programs</p>
                  </div>
                  <p className="text-[11px] c-meta pl-9 mb-2">
                    Verify your address to see council-run programs, workshops, and events for your district.
                  </p>
                  <Link
                    href="/verify-address"
                    className="inline-block text-[11px] font-semibold text-gold hover:text-gold/80 press pl-9"
                  >
                    Verify your address →
                  </Link>
                </div>
              )}

              {/* Council member quick contact */}
              {councilMember && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${districtColor?.accent}15` }}>
                      <Icon name="users" size={14} style={{ color: districtColor?.accent }} />
                    </div>
                    <p className="text-[12px] font-semibold" style={{ color: "var(--ink-strong)" }}>Your Council Member</p>
                  </div>
                  <p className="text-[12px] c-meta pl-9">
                    {councilMember.display_name} represents District {userDistrict}
                  </p>
                </div>
              )}

              {/* City Hall contact */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                    <Icon name="phone" size={14} className="text-gold" />
                  </div>
                  <p className="text-[12px] font-semibold" style={{ color: "var(--ink-strong)" }}>City Hall</p>
                </div>
                <p className="text-[12px] c-meta pl-9">
                  <a href="tel:3106035700" className="text-gold press">(310) 603-5700</a>
                  <span className="c-meta mx-2">·</span>
                  205 S Willowbrook Ave, Compton
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Quick Links (moved here from bottom) ──── */}
        <div>
          <p className="c-kicker mb-3" style={{ opacity: 0.65 }}>Quick Links</p>
          <div className="grid grid-cols-3 gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-1.5 c-frame p-3 press transition-colors"
                style={{ background: "var(--paper)" }}
              >
                <div
                  className="w-9 h-9 flex items-center justify-center"
                  style={{ background: "var(--paper-warm)", border: "1.5px solid var(--rule-strong-c)" }}
                >
                  <Icon name={link.icon} size={18} style={{ color: "var(--ink-strong)" }} />
                </div>
                <span className="c-meta" style={{ fontSize: 10 }}>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Alerts ─────────────────────────────────── */}
        {alertsList.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="c-kicker" style={{ opacity: 0.65 }}>
                {userDistrict ? "District Alerts" : "City Alerts"}
              </p>
              <Link href="/city-data" className="c-meta" style={{ color: "var(--gold-c)", fontSize: 10 }}>
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {alertsList.map((alert) => {
                const style = severityStyles[alert.severity ?? "info"] ?? severityStyles.info;
                return (
                  <Link key={alert.id} href="/city-data" className="block c-frame p-3.5 press transition-colors" style={{ background: "var(--paper)" }}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
                        <Icon name={style.icon} size={14} className={style.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[12px] font-semibold" style={{ color: "var(--ink-strong)" }}>{alert.title}</p>
                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${style.bg} ${style.color}`}>
                            {alert.severity ?? "info"}
                          </span>
                        </div>
                        {alert.body && (
                          <p className="text-[11px] c-meta line-clamp-2">{alert.body}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── District Feed (Updates, Photos, Programs) ── */}
        {userDistrict && (
          <div>
            <p className="c-kicker mb-3" style={{ opacity: 0.65 }}>
              District Feed
            </p>
            <DistrictFeed
              district={userDistrict}
              districtColor={districtColor?.accent ?? "#F2A900"}
              userId={userId}
              isCouncilMember={false}
            />
          </div>
        )}

        {/* ── Upcoming Events ────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="c-kicker" style={{ opacity: 0.65 }}>
              {userDistrict ? "Events in Your District" : "Upcoming Events"}
            </p>
            <Link href="/events" className="c-meta" style={{ color: "var(--gold-c)", fontSize: 10 }}>
              View All
            </Link>
          </div>
          {eventsList.length > 0 ? (
            <div className="space-y-2">
              {eventsList.map((event) => {
                const date = new Date(event.start_date);
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block c-frame p-3.5 press transition-colors" style={{ background: "var(--paper)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 flex flex-col items-center justify-center shrink-0 c-frame" style={{ background: "var(--paper-warm)" }}>
                        <p className="text-[9px] text-gold font-bold uppercase leading-none">
                          {date.toLocaleDateString("en-US", { month: "short" })}
                        </p>
                        <p className="text-[18px] font-heading font-bold leading-none mt-0.5" style={{ color: "var(--ink-strong)" }}>
                          {date.getDate()}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold" style={{ color: "var(--ink-strong)" }}>{event.title}</p>
                        {event.location_name && (
                          <p className="text-[11px] c-meta truncate mt-0.5">{event.location_name}</p>
                        )}
                        {event.category && (
                          <span className="inline-block mt-1.5 text-[9px] font-semibold text-gold bg-gold/10 rounded-full px-2 py-0.5">
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
          ) : (
            <div
              className="text-center py-8 c-frame"
              style={{ background: "var(--paper-warm)" }}
            >
              <Icon name="calendar" size={24} style={{ color: "var(--ink-strong)", opacity: 0.4 }} className="mx-auto mb-2" />
              <p className="c-body" style={{ fontSize: 12 }}>
                {userDistrict ? "No upcoming events in your district" : "No upcoming events"}
              </p>
            </div>
          )}
        </div>

        {/* ── Schools in District ────────────────────── */}
        {schoolsList.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="c-kicker" style={{ opacity: 0.65 }}>
                {userDistrict ? "Schools in Your District" : "Schools in Compton"}
              </p>
              <Link href="/schools" className="c-meta" style={{ color: "var(--gold-c)", fontSize: 10 }}>
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {schoolsList.slice(0, 5).map((school) => (
                <Link
                  key={school.id}
                  href={`/schools/${school.slug || school.id}`}
                  className="block c-frame p-3.5 press transition-colors" style={{ background: "var(--paper)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0 c-frame">
                      <Icon name="graduation" size={18} className="text-cyan" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold" style={{ color: "var(--ink-strong)" }}>{school.name}</p>
                      {school.address && (
                        <p className="text-[11px] c-meta truncate mt-0.5">{school.address}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {school.level && (
                          <span className="text-[9px] font-semibold text-cyan bg-cyan/10 rounded-full px-2 py-0.5 capitalize">
                            {school.level}
                          </span>
                        )}
                        {school.mascot && (
                          <span className="text-[9px] c-meta">
                            {school.mascot}
                          </span>
                        )}
                      </div>
                    </div>
                    <Icon name="chevron-right" size={14} className="shrink-0" style={{ color: "var(--ink-mute)" }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Parks in District ──────────────────────── */}
        {parksList.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="c-kicker" style={{ opacity: 0.65 }}>
                {userDistrict ? "Parks in Your District" : "Parks in Compton"}
              </p>
              <Link href="/parks" className="c-meta" style={{ color: "var(--gold-c)", fontSize: 10 }}>
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {parksList.slice(0, 5).map((park) => (
                <Link
                  key={park.id}
                  href={`/parks/${park.slug || park.id}`}
                  className="block c-frame p-3.5 press transition-colors" style={{ background: "var(--paper)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0 c-frame">
                      <Icon name="tree" size={18} className="text-emerald" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold" style={{ color: "var(--ink-strong)" }}>{park.name}</p>
                      {park.address && (
                        <p className="text-[11px] c-meta truncate mt-0.5">{park.address}</p>
                      )}
                      {park.amenities && park.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {park.amenities.slice(0, 4).map((amenity: string) => (
                            <span
                              key={amenity}
                              className="text-[8px] text-emerald/70 bg-emerald/8 border border-emerald/10 rounded-full px-1.5 py-0.5 capitalize"
                            >
                              {amenity.replace(/_/g, " ")}
                            </span>
                          ))}
                          {park.amenities.length > 4 && (
                            <span className="text-[8px] c-meta self-center">
                              +{park.amenities.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <Icon name="chevron-right" size={14} className="shrink-0" style={{ color: "var(--ink-mute)" }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Community Voice (Polls & Surveys) ──────── */}
        {(pollsWithVotes.length > 0 || surveysWithResponses.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="c-kicker" style={{ opacity: 0.65 }}>Community Voice</p>
              <Link href="/pulse" className="c-meta" style={{ color: "var(--gold-c)", fontSize: 10 }}>
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {pollsWithVotes.map((poll) => (
                <PollCard key={poll.id} poll={poll as any} userId={userId} />
              ))}
              {surveysWithResponses.map((survey) => (
                <SurveyCard key={survey.id} survey={survey as any} userId={userId} />
              ))}
            </div>
          </div>
        )}

        {/* ── Recent from City Hall ──────────────────── */}
        {officialPostsList.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="c-kicker" style={{ opacity: 0.65 }}>
                {userDistrict ? "From Your Representatives" : "From City Hall"}
              </p>
              <Link href="/pulse" className="c-meta" style={{ color: "var(--gold-c)", fontSize: 10 }}>
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {officialPostsList.slice(0, 3).map((post) => {
                const authorArr = post.author as unknown as { id: string; display_name: string; avatar_url: string | null; role: string; handle: string }[] | null;
                const author = authorArr?.[0] ?? null;
                return (
                  <Link
                    key={post.id}
                    href="/pulse"
                    className="block c-frame p-3.5 press transition-colors" style={{ background: "var(--paper)" }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-royal to-hc-purple flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-gold/20">
                        {author?.avatar_url ? (
                          <Image
                            src={author.avatar_url}
                            alt={author.display_name ?? ""}
                            width={36}
                            height={36}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="text-gold font-heading font-bold text-xs">
                            {(author?.display_name ?? "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[12px] font-bold truncate">{author?.display_name ?? "City Official"}</p>
                          <span className="text-[8px] font-bold text-gold bg-gold/10 rounded-full px-1.5 py-0.5">Official</span>
                        </div>
                        <p className="text-[12px] c-meta line-clamp-2">{post.body}</p>
                        <p className="text-[10px] c-meta mt-1">
                          {new Date(post.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Message Your Council Member ─────────── */}
        {userDistrict && councilMember && (
          <div>
            <p className="c-kicker mb-3" style={{ opacity: 0.65 }}>
              Contact Your Council Member
            </p>
            <DistrictMessageForm
              district={userDistrict}
              councilMemberName={councilMember.display_name ?? "Your Council Member"}
            />
          </div>
        )}

        {/* ── Footer Info ────────────────────────────── */}
        <div className="c-frame p-4 text-center" style={{ background: "var(--paper-warm)" }}>
          <p className="c-body leading-relaxed" style={{ fontSize: 11 }}>
            Compton has 4 city council districts. Each district is represented by a council member.
            Contact City Hall at <a href="tel:3106035700" className="press" style={{ color: "var(--gold-c)" }}>(310) 603-5700</a> for inquiries.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Council Member Card ─────────────────────────── */

function CouncilCard({
  name,
  title,
  bio,
  avatarUrl,
  handle,
  accentColor,
}: {
  name: string;
  title: string;
  bio: string | null;
  avatarUrl: string | null;
  handle: string | null;
  accentColor: string;
}) {
  const initials = name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";

  return (
    <Link
      href={handle ? `/user/${handle}` : "/city-hall"}
      className="block c-frame p-4 press transition-colors" style={{ background: "var(--paper)" }}
    >
      <div className="flex items-start gap-3.5">
        <div
          className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
          style={{
            background: avatarUrl ? undefined : `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
            border: `1px solid ${accentColor}30`,
          }}
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              width={56}
              height={56}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="font-heading font-bold text-lg" style={{ color: accentColor }}>
              {initials}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold truncate" style={{ color: "var(--ink-strong)" }}>{name}</p>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0" style={{ color: accentColor }}>
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <p className="text-[11px] font-medium mt-0.5" style={{ color: accentColor }}>
            {title}
          </p>
          {bio && (
            <p className="text-[11px] c-meta mt-1.5 line-clamp-2 leading-relaxed">{bio}</p>
          )}
        </div>
        <Icon name="chevron-right" size={14} className="shrink-0 mt-1" style={{ color: "var(--ink-mute)" }} />
      </div>
    </Link>
  );
}
