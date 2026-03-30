import Image from "next/image";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import SectionHeader from "@/components/layout/SectionHeader";
import { createClient } from "@/lib/supabase/server";

const councilMembers = [
  {
    name: "Mayor Emma Sharif",
    role: "Mayor",
    areas: "City-wide Leadership",
    focus: "Economic Growth, Public Safety, Community Development",
    initials: "ES",
    variant: "gold" as const,
  },
  {
    name: "Council District 1",
    role: "District 1",
    areas: "Northwest Compton",
    focus: "Economic Development, Public Safety",
    initials: "D1",
    variant: "cyan" as const,
  },
  {
    name: "Council District 2",
    role: "District 2",
    areas: "Northeast Compton",
    focus: "Education, Youth Programs",
    initials: "D2",
    variant: "emerald" as const,
  },
  {
    name: "Council District 3",
    role: "District 3",
    areas: "Southeast Compton",
    focus: "Housing, Infrastructure",
    initials: "D3",
    variant: "purple" as const,
  },
  {
    name: "Council District 4",
    role: "District 4",
    areas: "Southwest Compton",
    focus: "Parks, Community Services",
    initials: "D4",
    variant: "coral" as const,
  },
];

const landmarks = [
  { name: "Compton City Hall", type: "Government", icon: "🏛️" },
  { name: "Compton/Woodley Airport", type: "Aviation", icon: "✈️" },
  { name: "Tomorrow's Aeronautical Museum", type: "Museum", icon: "🏛️" },
  { name: "Lueders Park", type: "Recreation", icon: "🌳" },
  { name: "MLK Jr. Transit Center", type: "Transit", icon: "🚌" },
  { name: "Compton Courthouse", type: "Legal", icon: "⚖️" },
];

const quickFacts = [
  { label: "Population", value: "100K+", icon: "👥" },
  { label: "Districts", value: "4", icon: "📍" },
  { label: "Founded", value: "1888", icon: "📜" },
  { label: "Area", value: "10.1 mi²", icon: "🗺️" },
];

export default async function DistrictPage() {
  const supabase = await createClient();

  // Fetch current user's profile for district info
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userDistrict: number | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("district")
      .eq("id", user.id)
      .single();
    userDistrict = profile?.district ?? null;
  }

  const today = new Date().toISOString().split("T")[0];

  // Fetch real community data in parallel
  const [
    { data: upcomingEvents },
    { count: resourcesCount },
    { count: businessesCount },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .gte("start_date", today)
      .eq("is_published", true)
      .order("start_date")
      .limit(3),
    supabase
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
  ]);

  return (
    <div className="animate-fade-in">
      {/* Your District Banner */}
      {userDistrict && (
        <div className="mx-5 mt-4 mb-3 bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
            <span className="text-gold font-heading font-bold text-sm">D{userDistrict}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gold">Your District: District {userDistrict}</p>
            <p className="text-[11px] text-txt-secondary">Verified resident</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-4 mb-5">
        <h1 className="font-heading text-2xl font-bold mb-1">Your District</h1>
        <p className="text-sm text-txt-secondary">
          Know your representatives and neighborhood
        </p>
      </div>

      {/* City Hero */}
      <div className="px-5 mb-6">
        <div className="relative h-44 rounded-2xl overflow-hidden">
          <Image
            src="/images/city-hall.png"
            alt="Compton City Hall"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/50 to-transparent" />
          <div className="pattern-dots absolute inset-0 opacity-20" />
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-[10px] text-gold font-bold tracking-[0.2em] uppercase mb-1">
              City of
            </p>
            <h2 className="font-display text-2xl font-bold">Compton, California</h2>
          </div>
        </div>
      </div>

      {/* Quick Facts */}
      <div className="grid grid-cols-4 gap-2 px-5 mb-6">
        {quickFacts.map((fact) => (
          <div key={fact.label} className="bg-card rounded-xl p-2.5 text-center border border-border-subtle">
            <span className="text-base block mb-1">{fact.icon}</span>
            <p className="font-heading font-bold text-gold text-sm leading-none">{fact.value}</p>
            <p className="text-[9px] text-txt-secondary mt-0.5 font-medium">{fact.label}</p>
          </div>
        ))}
      </div>

      {/* City Leadership */}
      <div className="px-5 mb-6">
        <SectionHeader title="City Leadership" compact />
        <div className="space-y-2.5 stagger">
          {councilMembers.map((member) => {
            const districtNum = member.role.startsWith("District ") ? parseInt(member.role.split(" ")[1]) : null;
            const isUserDistrict = userDistrict !== null && districtNum === userDistrict;
            return (
              <Card key={member.role} hover className={isUserDistrict ? "border-gold/30 ring-1 ring-gold/20" : ""}>
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br from-royal to-hc-purple flex items-center justify-center text-gold font-heading font-bold text-sm ring-2 ${isUserDistrict ? "ring-gold/40" : "ring-white/5"} shrink-0`}>
                    {member.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-[13px] truncate">{member.name}</p>
                      <Badge label={member.role} variant={member.variant} />
                      {isUserDistrict && <Badge label="Your District" variant="gold" />}
                    </div>
                    <p className="text-[11px] text-txt-secondary">{member.areas}</p>
                    <p className="text-[10px] text-txt-secondary/70 mt-0.5">{member.focus}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="divider-subtle mx-5 mb-6" />

      {/* Landmarks */}
      <div className="px-5 mb-6">
        <SectionHeader title="Key Landmarks" compact />
        <div className="grid grid-cols-2 gap-2.5">
          {landmarks.map((landmark) => (
            <Card key={landmark.name} hover>
              <div className="text-center py-1">
                <span className="text-2xl block mb-1.5">{landmark.icon}</span>
                <p className="text-xs font-bold mb-0.5">{landmark.name}</p>
                <Badge label={landmark.type} variant="purple" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Community Stats */}
      <div className="px-5 mb-6">
        <SectionHeader title="Community at a Glance" compact />
        <div className="grid grid-cols-3 gap-2.5">
          <Card>
            <div className="text-center py-1">
              <p className="font-heading font-bold text-gold text-lg leading-none">{upcomingEvents?.length ?? 0}</p>
              <p className="text-[10px] text-txt-secondary mt-1 font-medium">Upcoming Events</p>
            </div>
          </Card>
          <Card>
            <div className="text-center py-1">
              <p className="font-heading font-bold text-gold text-lg leading-none">{resourcesCount ?? 0}</p>
              <p className="text-[10px] text-txt-secondary mt-1 font-medium">Resources</p>
            </div>
          </Card>
          <Card>
            <div className="text-center py-1">
              <p className="font-heading font-bold text-gold text-lg leading-none">{businessesCount ?? 0}</p>
              <p className="text-[10px] text-txt-secondary mt-1 font-medium">Businesses</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <div className="px-5 mb-6">
          <SectionHeader title="Upcoming Events" linkText="See All" linkHref="/events" compact />
          <div className="space-y-2.5">
            {upcomingEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card hover>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-14 rounded-lg bg-midnight/50 border border-border-subtle flex flex-col items-center justify-center shrink-0">
                      <p className="text-[9px] text-gold font-bold uppercase leading-none">
                        {new Date(event.start_date).toLocaleDateString("en-US", { month: "short" })}
                      </p>
                      <p className="text-base font-bold leading-none mt-0.5">
                        {new Date(event.start_date).getDate()}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[13px] truncate">{event.title}</p>
                      {event.location_name && (
                        <p className="text-[11px] text-txt-secondary truncate">{event.location_name}</p>
                      )}
                    </div>
                    <Badge label={event.category} variant="purple" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Report Issue CTA */}
      <div className="px-5 mb-6">
        <Card glow className="border-gold/15 text-center py-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <span className="text-3xl block mb-2">🛠️</span>
          <h3 className="font-heading font-bold text-base mb-1">Report an Issue</h3>
          <p className="text-[12px] text-txt-secondary mb-3 max-w-[260px] mx-auto">
            Pothole? Streetlight out? Let your council member know through Hub City.
          </p>
          <button className="inline-flex items-center gap-2 bg-gold text-midnight px-5 py-2.5 rounded-full text-xs font-bold press">
            Report Issue
          </button>
        </Card>
      </div>
    </div>
  );
}
