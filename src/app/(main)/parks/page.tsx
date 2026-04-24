import { createClient } from "@/lib/supabase/server";
import ParkCard from "@/components/parks/ParkCard";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

export const metadata = {
  title: "Parks & Recreation | Culture",
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
    <div className="culture-surface min-h-dvh pb-28">
      <div
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § VOL·01 · ISSUE GREEN · COMPTON
        </div>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 56, lineHeight: 0.88, letterSpacing: "-0.02em" }}
        >
          Parks.
        </h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Green spaces and community programs across the city.
        </p>
      </div>

      <div className="px-5 space-y-5">
        {/* Quick Stats */}
        <div
          className="grid grid-cols-3"
          style={{ borderBottom: "3px solid var(--rule-strong-c)", borderTop: "2px solid var(--rule-strong-c)" }}
        >
          {[
            { label: "Parks", value: parksList.length, gold: true },
            { label: "Programs", value: programCount ?? 0, gold: false },
            { label: "Rec Centers", value: 3, gold: false },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="text-center"
              style={{
                padding: "14px 10px",
                borderRight: i < 2 ? "2px solid var(--rule-strong-c)" : "none",
                background: stat.gold ? "var(--gold-c)" : "var(--paper)",
              }}
            >
              <div className="c-display c-tabnum" style={{ fontSize: 22, lineHeight: 1 }}>{stat.value}</div>
              <div className="c-kicker mt-1.5" style={{ fontSize: 9 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="flex gap-2">
          <Link href="/parks/programs" className="c-btn c-btn-primary c-btn-sm flex-1 press">
            <Icon name="calendar" size={14} />
            View Programs
          </Link>
          <Link href="/map?layer=parks" className="c-btn c-btn-outline c-btn-sm flex-1 press">
            <Icon name="map-pin" size={14} />
            View on Map
          </Link>
        </div>

        {/* What You Can Do */}
        <div>
          <p className="c-kicker mb-3">What You Can Do</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "BBQ & Picnic", icon: "bbq" as IconName },
              { label: "Sports", icon: "basketball" as IconName },
              { label: "Swimming", icon: "swimming" as IconName },
              { label: "Playgrounds", icon: "baby" as IconName },
              { label: "Walking", icon: "tree" as IconName },
              { label: "Fitness", icon: "trophy" as IconName },
              { label: "Events", icon: "calendar" as IconName },
              { label: "Community", icon: "users" as IconName },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-1.5 p-2.5"
                style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
              >
                <div
                  className="w-8 h-8 flex items-center justify-center"
                  style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                >
                  <Icon name={item.icon} size={16} style={{ color: "var(--ink-strong)" }} />
                </div>
                <span className="c-kicker text-center" style={{ fontSize: 9 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Amenity Filters */}
        <div>
          <p className="c-kicker mb-3">Filter by Amenity</p>
          <div className="c-noscroll flex gap-1.5 overflow-x-auto pb-1">
            <a
              href="/parks"
              className={`c-chip${!activeAmenity ? " gold" : ""} inline-flex items-center gap-1.5`}
            >
              All Parks
            </a>
            {AMENITY_FILTERS.map((f) => (
              <a
                key={f.key}
                href={`/parks?amenity=${f.key}`}
                className={`c-chip${activeAmenity === f.key ? " gold" : ""} inline-flex items-center gap-1.5`}
              >
                <Icon name={f.icon} size={12} />
                {f.label}
              </a>
            ))}
          </div>
        </div>

        {/* Parks Grid */}
        <div>
          <p className="c-kicker mb-3">
            {activeAmenity ? `Parks with ${activeAmenity.replace(/_/g, " ")}` : "All Parks"}
          </p>
          {parksList.length > 0 ? (
            <div className="space-y-3">
              {parksList.map((park) => (
                <ParkCard key={park.id} park={park} />
              ))}
            </div>
          ) : (
            <div
              className="text-center py-12"
              style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
            >
              <div
                className="w-12 h-12 flex items-center justify-center mx-auto mb-3"
                style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
              >
                <Icon name="tree" size={24} style={{ color: "var(--ink-strong)" }} />
              </div>
              <p className="c-card-t" style={{ color: "var(--ink-strong)" }}>No parks found</p>
              <p className="c-meta mt-1">
                {activeAmenity ? `No parks with ${activeAmenity.replace(/_/g, " ")}.` : "Parks coming soon."}
              </p>
            </div>
          )}
        </div>

        {/* Recreation Centers */}
        <div>
          <p className="c-kicker mb-3">Recreation Centers</p>
          <div className="space-y-3">
            {REC_CENTERS.map((center) => (
              <Link
                key={center.name}
                href={center.href}
                className="block c-frame p-4 press"
                style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 flex items-center justify-center shrink-0"
                    style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                  >
                    <Icon name="landmark" size={18} style={{ color: "var(--ink-strong)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="c-card-t" style={{ fontSize: 13, color: "var(--ink-strong)" }}>{center.name}</p>
                    <p className="c-meta mt-0.5">{center.address}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {center.features.map((f) => (
                        <span key={f} className="c-badge-ink inline-flex px-2 py-0.5" style={{ fontSize: 9 }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Icon name="chevron-right" size={14} style={{ color: "var(--ink-strong)" }} className="shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Contact & Info */}
        <div>
          <p className="c-kicker mb-3">Contact Information</p>
          <div className="c-frame p-5" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 flex items-center justify-center shrink-0"
                style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
              >
                <Icon name="phone" size={18} style={{ color: "var(--ink-strong)" }} />
              </div>
              <div>
                <p className="c-card-t" style={{ fontSize: 13, color: "var(--ink-strong)" }}>{CONTACT_INFO.department}</p>
                <p className="c-meta">{CONTACT_INFO.address}</p>
              </div>
            </div>
            <div className="space-y-2.5">
              <a href={`tel:${CONTACT_INFO.phone.replace(/[^0-9]/g, "")}`} className="flex items-center gap-3 press">
                <div
                  className="w-8 h-8 flex items-center justify-center"
                  style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                >
                  <Icon name="phone" size={14} style={{ color: "var(--ink-strong)" }} />
                </div>
                <div>
                  <p className="c-meta">Phone</p>
                  <p className="c-card-t" style={{ fontSize: 13, color: "var(--ink-strong)" }}>{CONTACT_INFO.phone}</p>
                </div>
              </a>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 flex items-center justify-center"
                  style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                >
                  <Icon name="clock" size={14} style={{ color: "var(--ink-strong)" }} />
                </div>
                <div>
                  <p className="c-meta">Office Hours</p>
                  <p className="c-card-t" style={{ fontSize: 13, color: "var(--ink-strong)" }}>{CONTACT_INFO.hours}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Park Rules & Tips */}
        <div>
          <p className="c-kicker mb-3">Park Rules & Tips</p>
          <div
            className="p-4 space-y-3"
            style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
          >
            {[
              { text: "Parks open at dawn and close at dusk unless posted otherwise", icon: "sun" as IconName },
              { text: "BBQ pits are first-come, first-served. Bring your own charcoal", icon: "bbq" as IconName },
              { text: "Shelter reservations available for large groups and events", icon: "calendar" as IconName },
              { text: "All programs are free for Compton residents", icon: "star" as IconName },
              { text: "Dogs must be on leash in all parks", icon: "alert" as IconName },
              { text: "Report maintenance issues through the Culture app", icon: "megaphone" as IconName },
            ].map((rule) => (
              <div key={rule.text} className="flex items-start gap-2.5">
                <div
                  className="w-6 h-6 flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                >
                  <Icon name={rule.icon} size={12} style={{ color: "var(--ink-strong)" }} />
                </div>
                <p className="c-body">{rule.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
