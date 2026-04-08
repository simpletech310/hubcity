import { createClient } from "@/lib/supabase/server";
import ParkCard from "@/components/parks/ParkCard";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

export const metadata = {
  title: "Parks & Recreation | Hub City",
  description: "Explore Compton's parks, playgrounds, recreation centers, and community programs.",
};

const AMENITY_FILTERS: { key: string; label: string; icon: IconName }[] = [
  { key: "playground", label: "Playground", icon: "baby" },
  { key: "basketball", label: "Basketball", icon: "basketball" },
  { key: "bbq", label: "BBQ Pits", icon: "bbq" },
  { key: "pool", label: "Pool", icon: "swimming" },
  { key: "soccer", label: "Soccer", icon: "soccer" },
  { key: "baseball", label: "Baseball", icon: "trophy" },
  { key: "walking", label: "Trails", icon: "tree" },
  { key: "gym", label: "Gym", icon: "trophy" },
];

const REC_CENTERS = [
  {
    name: "Lueders Park & Community Center",
    address: "1500 E Santa Fe Ave",
    phone: "(310) 605-5080",
    features: ["Gymnasium", "Swimming Pool", "Event Space", "Fitness Room"],
    href: "/parks/lueders-park",
  },
  {
    name: "Wilson Park",
    address: "701 E Palmer St",
    phone: "(310) 605-5090",
    features: ["Basketball Courts", "Baseball Diamonds", "Picnic Shelters"],
    href: "/parks/wilson-park",
  },
  {
    name: "Gonzales Park",
    address: "111 S Santa Fe Ave",
    phone: "(310) 605-5070",
    features: ["Basketball Courts", "Playground", "BBQ Area"],
    href: "/parks/gonzales-park",
  },
];

const CONTACT_INFO = {
  department: "Compton Parks & Recreation Department",
  phone: "(310) 605-5080",
  address: "205 S Willowbrook Ave, Compton, CA 90220",
  hours: "Mon-Fri 8:00 AM - 5:00 PM",
};

export default async function ParksPage({
  searchParams,
}: {
  searchParams: Promise<{ amenity?: string }>;
}) {
  const params = await searchParams;
  const activeAmenity = params.amenity || null;
  const supabase = await createClient();

  let query = supabase.from("parks").select("*").order("name");
  if (activeAmenity) {
    query = query.contains("amenities", [activeAmenity]);
  }

  const [{ data: parks }, { count: programCount }] = await Promise.all([
    query,
    supabase.from("park_programs").select("*", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const parksList = parks ?? [];

  return (
    <div className="min-h-screen bg-midnight text-white pb-28">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald/10 via-midnight to-midnight" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald/40 to-transparent" />
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-emerald/5 blur-3xl" />
        <div className="relative z-10 px-5 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald/15 flex items-center justify-center">
              <Icon name="tree" size={18} className="text-emerald" />
            </div>
            <h1 className="font-heading text-[20px] font-bold text-white">Parks & Recreation</h1>
          </div>
          <p className="text-[12px] text-white/40 ml-10">Green spaces and community programs in Compton</p>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-gradient-to-br from-emerald/8 to-emerald/3 border border-emerald/15 p-3 text-center">
            <p className="text-[20px] font-heading font-bold text-emerald">{parksList.length}</p>
            <p className="text-[9px] text-white/40 font-medium">Parks</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-gold/8 to-gold/3 border border-gold/15 p-3 text-center">
            <p className="text-[20px] font-heading font-bold text-gold">{programCount ?? 0}</p>
            <p className="text-[9px] text-white/40 font-medium">Programs</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-cyan/8 to-cyan/3 border border-cyan/15 p-3 text-center">
            <p className="text-[20px] font-heading font-bold text-cyan">3</p>
            <p className="text-[9px] text-white/40 font-medium">Rec Centers</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex gap-2">
          <Link href="/parks/programs" className="flex-1 flex items-center justify-center gap-2 bg-emerald/10 border border-emerald/20 rounded-xl py-2.5 press">
            <Icon name="calendar" size={14} className="text-emerald" />
            <span className="text-[12px] font-semibold text-emerald">View Programs</span>
          </Link>
          <Link href="/map?layer=parks" className="flex-1 flex items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl py-2.5 press">
            <Icon name="map-pin" size={14} className="text-white/50" />
            <span className="text-[12px] font-semibold text-white/50">View on Map</span>
          </Link>
        </div>

        {/* What You Can Do */}
        <div>
          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-3">What You Can Do</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "BBQ & Picnic", icon: "bbq" as IconName, color: "text-orange-400" },
              { label: "Sports", icon: "basketball" as IconName, color: "text-cyan" },
              { label: "Swimming", icon: "swimming" as IconName, color: "text-hc-blue" },
              { label: "Playgrounds", icon: "baby" as IconName, color: "text-pink" },
              { label: "Walking", icon: "tree" as IconName, color: "text-emerald" },
              { label: "Fitness", icon: "trophy" as IconName, color: "text-gold" },
              { label: "Events", icon: "calendar" as IconName, color: "text-hc-purple" },
              { label: "Community", icon: "users" as IconName, color: "text-coral" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05] p-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                  <Icon name={item.icon} size={16} className={item.color} />
                </div>
                <span className="text-[9px] text-white/50 font-medium text-center leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Amenity Filters */}
        <div>
          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-3">Filter by Amenity</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <a
              href="/parks"
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold transition-colors border ${
                !activeAmenity
                  ? "bg-emerald text-black border-emerald"
                  : "bg-white/[0.04] text-white/50 border-white/[0.08] hover:border-emerald/30"
              }`}
            >
              All Parks
            </a>
            {AMENITY_FILTERS.map((f) => (
              <a
                key={f.key}
                href={`/parks?amenity=${f.key}`}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold transition-colors border ${
                  activeAmenity === f.key
                    ? "bg-emerald text-black border-emerald"
                    : "bg-white/[0.04] text-white/50 border-white/[0.08] hover:border-emerald/30"
                }`}
              >
                <Icon name={f.icon} size={12} className={activeAmenity === f.key ? "text-black" : "text-white/40"} />
                {f.label}
              </a>
            ))}
          </div>
        </div>

        {/* Parks Grid */}
        <div>
          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-3">
            {activeAmenity ? `Parks with ${activeAmenity.replace(/_/g, " ")}` : "All Parks"}
          </p>
          {parksList.length > 0 ? (
            <div className="space-y-3">
              {parksList.map((park) => (
                <ParkCard key={park.id} park={park} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                <Icon name="tree" size={24} className="text-white/20" />
              </div>
              <p className="text-[13px] font-semibold text-white/50">No parks found</p>
              <p className="text-[11px] text-white/30 mt-1">
                {activeAmenity ? `No parks with ${activeAmenity.replace(/_/g, " ")}.` : "Parks coming soon."}
              </p>
            </div>
          )}
        </div>

        {/* Recreation Centers */}
        <div>
          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-3">Recreation Centers</p>
          <div className="space-y-3">
            {REC_CENTERS.map((center) => (
              <Link
                key={center.name}
                href={center.href}
                className="block glass-card-elevated rounded-2xl p-4 press hover:border-emerald/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center shrink-0">
                    <Icon name="landmark" size={18} className="text-emerald" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white">{center.name}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">{center.address}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {center.features.map((f) => (
                        <span key={f} className="text-[9px] text-emerald/70 bg-emerald/8 border border-emerald/10 rounded-full px-2 py-0.5">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Icon name="chevron-right" size={14} className="text-white/20 shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Contact & Info */}
        <div>
          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-3">Contact Information</p>
          <div className="glass-card-elevated rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                <Icon name="phone" size={18} className="text-gold" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white">{CONTACT_INFO.department}</p>
                <p className="text-[11px] text-white/40">{CONTACT_INFO.address}</p>
              </div>
            </div>
            <div className="space-y-2.5">
              <a href={`tel:${CONTACT_INFO.phone.replace(/[^0-9]/g, "")}`} className="flex items-center gap-3 press">
                <div className="w-8 h-8 rounded-lg bg-emerald/10 flex items-center justify-center">
                  <Icon name="phone" size={14} className="text-emerald" />
                </div>
                <div>
                  <p className="text-[12px] text-white/60">Phone</p>
                  <p className="text-[13px] font-semibold text-white">{CONTACT_INFO.phone}</p>
                </div>
              </a>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan/10 flex items-center justify-center">
                  <Icon name="clock" size={14} className="text-cyan" />
                </div>
                <div>
                  <p className="text-[12px] text-white/60">Office Hours</p>
                  <p className="text-[13px] font-semibold text-white">{CONTACT_INFO.hours}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Park Rules & Tips */}
        <div>
          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-3">Park Rules & Tips</p>
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4 space-y-3">
            {[
              { text: "Parks open at dawn and close at dusk unless posted otherwise", icon: "sun" as IconName },
              { text: "BBQ pits are first-come, first-served. Bring your own charcoal", icon: "bbq" as IconName },
              { text: "Shelter reservations available for large groups and events", icon: "calendar" as IconName },
              { text: "All programs are free for Compton residents", icon: "star" as IconName },
              { text: "Dogs must be on leash in all parks", icon: "alert" as IconName },
              { text: "Report maintenance issues through the Hub City app", icon: "megaphone" as IconName },
            ].map((rule) => (
              <div key={rule.text} className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-md bg-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name={rule.icon} size={12} className="text-white/30" />
                </div>
                <p className="text-[12px] text-white/50 leading-relaxed">{rule.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
