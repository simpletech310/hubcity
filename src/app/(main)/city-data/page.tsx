import { createClient } from "@/lib/supabase/server";
import SectionHeader from "@/components/layout/SectionHeader";
import { WeatherWidget } from "@/components/city-data/WeatherWidget";
import { AlertBanner } from "@/components/city-data/AlertBanner";
import { CityAtGlance } from "@/components/city-data/CityAtGlance";
import Link from "next/link";

interface CityAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  body: string;
  affected_districts: number[];
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export const metadata = {
  title: "City Data - Hub City",
  description: "Compton at a glance: weather, air quality, alerts, and community data.",
};

export default async function CityDataPage() {
  const supabase = await createClient();

  // Fetch active alerts
  const { data: alerts } = await supabase
    .from("city_alerts")
    .select("*")
    .eq("is_active", true)
    .or("expires_at.is.null,expires_at.gt.now()")
    .order("created_at", { ascending: false });

  // Fetch quick stats
  const { count: issuesCount } = await supabase
    .from("city_issues")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");

  const { count: eventsCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const subPages = [
    {
      href: "/city-data/transit",
      title: "Transit",
      description: "Metro routes, bus schedules, and transit info for Compton.",
      icon: "transit",
    },
    {
      href: "/city-data/safety",
      title: "Community Safety",
      description: "Issue tracking, emergency contacts, and safety resources.",
      icon: "shield",
    },
    {
      href: "/city-data/meetings",
      title: "City Meetings",
      description: "Council meetings, agendas, minutes, and livestreams.",
      icon: "landmark",
    },
  ];

  return (
    <div className="min-h-screen bg-midnight text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeader
          title="City at a Glance"
          subtitle="Real-time data and transparency for Compton, CA"
        />

        {/* Alert Banner */}
        {alerts && alerts.length > 0 && (
          <div className="mb-6">
            <AlertBanner alerts={alerts as CityAlert[]} />
          </div>
        )}

        {/* Weather + AQI row */}
        <div className="mb-8">
          <WeatherWidget />
        </div>

        {/* At-a-glance cards */}
        <div className="mb-8">
          <CityAtGlance />
        </div>

        {/* Quick Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl bg-royal p-4 text-center">
            <p className="text-3xl font-bold text-gold">{issuesCount ?? 0}</p>
            <p className="text-sm text-white/60">Open Issues</p>
          </div>
          <div className="rounded-2xl bg-royal p-4 text-center">
            <p className="text-3xl font-bold text-gold">{eventsCount ?? 0}</p>
            <p className="text-sm text-white/60">Active Events</p>
          </div>
          <div className="rounded-2xl bg-royal p-4 text-center">
            <p className="text-3xl font-bold text-gold">4</p>
            <p className="text-sm text-white/60">Districts</p>
          </div>
          <div className="rounded-2xl bg-royal p-4 text-center">
            <p className="text-3xl font-bold text-gold">97K+</p>
            <p className="text-sm text-white/60">Residents</p>
          </div>
        </div>

        {/* Sub-page Link Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {subPages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="group rounded-2xl bg-royal p-6 transition-all hover:bg-royal/80 hover:ring-1 hover:ring-gold/30"
            >
              <span className="mb-2 block text-3xl">{page.icon}</span>
              <h3 className="mb-1 text-lg font-semibold text-white group-hover:text-gold">
                {page.title}
              </h3>
              <p className="text-sm text-white/60">{page.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
