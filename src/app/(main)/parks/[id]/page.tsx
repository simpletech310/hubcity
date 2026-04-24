import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

const AMENITY_DETAILS: Record<string, { icon: IconName; label: string; color: string; desc: string }> = {
  playground: { icon: "baby", label: "Playground", color: "text-pink", desc: "Modern playground equipment for kids" },
  basketball: { icon: "basketball", label: "Basketball Courts", color: "text-orange-400", desc: "Full courts, open for pick-up games" },
  bbq: { icon: "bbq", label: "BBQ Grills & Pits", color: "text-orange-400", desc: "Charcoal grills, first-come first-served" },
  restrooms: { icon: "restroom", label: "Restrooms", color: "text-black/60", desc: "Public restroom facilities" },
  pool: { icon: "swimming", label: "Swimming Pool", color: "text-cyan", desc: "Lap swim and open swim hours" },
  tennis: { icon: "tennis", label: "Tennis Courts", color: "text-emerald", desc: "Lighted courts available" },
  soccer: { icon: "soccer", label: "Soccer Fields", color: "text-emerald", desc: "Full-size fields for games & practice" },
  baseball: { icon: "trophy", label: "Baseball Diamond", color: "text-gold", desc: "Regulation diamond with backstop" },
  picnic: { icon: "tree", label: "Picnic Area", color: "text-emerald", desc: "Shaded tables and shelters available" },
  walking: { icon: "tree", label: "Walking Trails", color: "text-emerald", desc: "Paved paths through the park" },
  dog_park: { icon: "alert", label: "Dog Park", color: "text-gold", desc: "Off-leash area for dogs" },
  gym: { icon: "trophy", label: "Fitness Center", color: "text-hc-blue", desc: "Indoor gymnasium and equipment" },
  skatepark: { icon: "skateboard", label: "Skatepark", color: "text-gold", desc: "Ramps and rails for skating" },
  splash_pad: { icon: "swimming", label: "Splash Pad", color: "text-cyan", desc: "Water play area for kids" },
};

const DISTRICT_COLORS: Record<number, { text: string; bg: string; border: string }> = {
  1: { text: "text-hc-blue", bg: "bg-hc-blue/10", border: "border-hc-blue/20" },
  2: { text: "text-gold", bg: "bg-hc-purple/10", border: "border-gold/20" },
  3: { text: "text-emerald", bg: "bg-emerald/10", border: "border-emerald/20" },
  4: { text: "text-gold", bg: "bg-gold/10", border: "border-gold/20" },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const isUUID = UUID_RE.test(id);
  let query = supabase.from("parks").select("name, description");
  query = isUUID ? query.or(`id.eq.${id},slug.eq.${id}`) : query.eq("slug", id);
  const { data: park } = await query.single();

  return {
    title: park ? `${park.name} | Parks | Culture` : "Park | Culture",
    description: park?.description || "Park details for Compton, CA",
  };
}

export default async function ParkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const isUUID = UUID_RE.test(id);
  let parkQuery = supabase.from("parks").select("*");
  parkQuery = isUUID ? parkQuery.or(`id.eq.${id},slug.eq.${id}`) : parkQuery.eq("slug", id);
  const { data: park } = await parkQuery.single();

  if (!park) notFound();

  const [programsRes, eventsRes] = await Promise.all([
    supabase
      .from("park_programs")
      .select("*")
      .eq("park_id", park.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("events")
      .select("*")
      .ilike("location", `%${park.name}%`)
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true })
      .limit(6),
  ]);

  const programs = programsRes.data ?? [];
  const events = eventsRes.data ?? [];
  const imageUrl = park.image_urls?.[0];

  // Parse hours
  const hours = park.hours as Record<string, string> | string | null;
  let hoursEntries: { label: string; time: string }[] = [];
  if (hours && typeof hours === "object") {
    hoursEntries = Object.entries(hours).map(([key, val]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      time: val,
    }));
  } else if (typeof hours === "string") {
    hoursEntries = [{ label: "Hours", time: hours }];
  }

  const district = typeof park.district === "number" ? park.district : null;
  const districtStyle = district ? DISTRICT_COLORS[district] || DISTRICT_COLORS[3] : null;
  const amenities = (park.amenities || []) as string[];

  // Categorize amenities for display
  const hasBBQ = amenities.includes("bbq");
  const hasPool = amenities.includes("pool");
  const hasSports = amenities.some(a => ["basketball", "soccer", "baseball", "tennis"].includes(a));
  const hasKids = amenities.some(a => ["playground", "splash_pad"].includes(a));

  return (
    <div className="culture-surface min-h-dvh pb-28">
      {/* Hero Image */}
      <div className="relative w-full aspect-[16/10] overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={park.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald/20 via-black/20 to-emerald/5 flex items-center justify-center">
            <Icon name="tree" size={48} className="text-emerald/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Back button overlay */}
        <div className="absolute top-4 left-4 z-10">
          <Link href="/parks" className="w-8 h-8 rounded-full flex items-center justify-center press" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
            <Icon name="back" size={16} className="text-white" />
          </Link>
        </div>

        {/* Park name overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-5">
          <h1 className="font-heading text-[24px] font-bold text-white leading-tight drop-shadow-lg">{park.name}</h1>
          {park.address && (
            <div className="flex items-center gap-1.5 mt-1">
              <Icon name="map-pin" size={12} className="text-black/60" />
              <p className="text-[12px] text-black/70">{park.address}</p>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2.5">
            {districtStyle && (
              <span className={`text-[10px] font-semibold ${districtStyle.text} ${districtStyle.bg} border ${districtStyle.border} rounded-full px-2.5 py-0.5`}>
                District {district}
              </span>
            )}
            {park.phone && (
              <a href={`tel:${(park.phone as string).replace(/[^0-9]/g, "")}`} className="text-[10px] font-semibold text-gold bg-gold/10 border border-gold/20 rounded-full px-2.5 py-0.5 press">
                {park.phone as string}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 space-y-5 mt-4">
        {/* Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {park.phone && (
            <a href={`tel:${(park.phone as string).replace(/[^0-9]/g, "")}`} className="c-btn c-btn-outline c-btn-sm flex-col gap-1.5 p-3 press">
              <Icon name="phone" size={16} />
              <span>Call</span>
            </a>
          )}
          {park.latitude && park.longitude && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${park.latitude},${park.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="c-btn c-btn-outline c-btn-sm flex-col gap-1.5 p-3 press"
            >
              <Icon name="navigation" size={16} />
              <span>Directions</span>
            </a>
          )}
          <Link href="/parks/programs" className="c-btn c-btn-primary c-btn-sm flex-col gap-1.5 p-3 press">
            <Icon name="calendar" size={16} />
            <span>Programs</span>
          </Link>
        </div>

        {/* About */}
        {park.description && (
          <div>
            <p className="text-[10px] text-black/50 font-semibold uppercase tracking-wider mb-3">About This Park</p>
            <div className="p-4" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
              <p className="c-body">{park.description}</p>
            </div>
          </div>
        )}

        {/* What You Can Do Here - highlight cards */}
        {(hasBBQ || hasPool || hasSports || hasKids) && (
          <div>
            <p className="text-[10px] text-black/50 font-semibold uppercase tracking-wider mb-3">What You Can Do Here</p>
            <div className="grid grid-cols-2 gap-2">
              {hasBBQ && (
                <div className="p-3.5" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon name="bbq" size={16} className="text-orange-400" />
                    <span className="text-[12px] font-semibold" style={{ color: "var(--ink-strong)" }}>BBQ & Cookout</span>
                  </div>
                  <p className="text-[10px] text-black/50 leading-relaxed">Charcoal grills available first-come, first-served. Bring your own charcoal and supplies.</p>
                </div>
              )}
              {hasPool && (
                <div className="p-3.5" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon name="swimming" size={16} className="text-cyan" />
                    <span className="text-[12px] font-semibold" style={{ color: "var(--ink-strong)" }}>Swimming</span>
                  </div>
                  <p className="text-[10px] text-black/50 leading-relaxed">Lap swim and open swim sessions available. Swim lessons for all ages.</p>
                </div>
              )}
              {hasSports && (
                <div className="p-3.5" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon name="basketball" size={16} className="text-emerald" />
                    <span className="text-[12px] font-semibold" style={{ color: "var(--ink-strong)" }}>Sports</span>
                  </div>
                  <p className="text-[10px] text-black/50 leading-relaxed">Courts and fields open for pick-up games, leagues, and practice.</p>
                </div>
              )}
              {hasKids && (
                <div className="p-3.5" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon name="baby" size={16} className="text-pink" />
                    <span className="text-[12px] font-semibold" style={{ color: "var(--ink-strong)" }}>Kids Play</span>
                  </div>
                  <p className="text-[10px] text-black/50 leading-relaxed">Playground equipment and play areas designed for children of all ages.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hours */}
        {hoursEntries.length > 0 && (
          <div>
            <p className="text-[10px] text-black/50 font-semibold uppercase tracking-wider mb-3">Park Hours</p>
            <div className="p-4" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
              <div className="space-y-3">
                {hoursEntries.map((h) => (
                  <div key={h.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 flex items-center justify-center"
                        style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                      >
                        <Icon name="clock" size={13} className="text-emerald" />
                      </div>
                      <span className="text-[12px] text-black/70">{h.label}</span>
                    </div>
                    <span className="text-[13px] font-semibold" style={{ color: "var(--ink-strong)" }}>{h.time}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3" style={{ borderTop: "2px solid var(--rule-strong-c)" }}>
                <p className="text-[10px] text-black/40 leading-relaxed">Hours may vary on holidays. Call ahead to confirm.</p>
              </div>
            </div>
          </div>
        )}

        {/* All Amenities */}
        {amenities.length > 0 && (
          <div>
            <p className="text-[10px] text-black/50 font-semibold uppercase tracking-wider mb-3">Amenities & Facilities</p>
            <div className="space-y-2">
              {amenities.map((amenity: string) => {
                const detail = AMENITY_DETAILS[amenity] || {
                  icon: "check" as IconName,
                  label: amenity.replace(/_/g, " "),
                  color: "text-black/60",
                  desc: "",
                };
                return (
                  <div
                    key={amenity}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
                  >
                    <div
                      className="w-9 h-9 flex items-center justify-center shrink-0"
                      style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                    >
                      <Icon name={detail.icon} size={18} className={detail.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold" style={{ color: "var(--ink-strong)" }}>{detail.label}</p>
                      {detail.desc && (
                        <p className="text-[10px] text-black/50 mt-0.5">{detail.desc}</p>
                      )}
                    </div>
                    <Icon name="check" size={14} className="text-emerald shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Programs */}
        {programs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-black/50 font-semibold uppercase tracking-wider">Programs at This Park</p>
              <Link href="/parks/programs" className="text-[11px] font-semibold text-gold press">See All</Link>
            </div>
            <div className="space-y-2">
              {programs.map((program) => (
                <div key={program.id} className="p-4" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 flex items-center justify-center shrink-0"
                      style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                    >
                      <Icon name="star" size={18} className="text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-semibold" style={{ color: "var(--ink-strong)" }}>{program.name}</h3>
                      {program.description && (
                        <p className="text-[11px] text-black/50 mt-0.5 leading-relaxed line-clamp-2">{program.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {program.schedule && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-cyan bg-cyan/10 rounded-full px-2 py-0.5">
                            <Icon name="clock" size={9} className="text-cyan" />
                            {program.schedule}
                          </span>
                        )}
                        {program.age_range && (
                          <span className="text-[10px] text-gold bg-hc-purple/10 rounded-full px-2 py-0.5">
                            Ages {program.age_range}
                          </span>
                        )}
                        {program.fee && (
                          <span className="text-[10px] text-emerald font-semibold bg-emerald/10 rounded-full px-2 py-0.5">
                            {program.fee}
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

        {/* Events */}
        {events.length > 0 && (
          <div>
            <p className="text-[10px] text-black/50 font-semibold uppercase tracking-wider mb-3">Upcoming Events</p>
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="p-4" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 flex flex-col items-center justify-center shrink-0"
                      style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                    >
                      <span className="text-[14px] font-heading font-bold text-gold leading-none">
                        {new Date(event.start_date).getDate()}
                      </span>
                      <span className="text-[8px] text-gold/60 uppercase font-semibold">
                        {new Date(event.start_date).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[13px] font-semibold text-white truncate">{event.title}</h3>
                      <p className="text-[11px] text-black/50 mt-0.5">
                        {new Date(event.start_date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        {park.latitude && park.longitude && (
          <div>
            <p className="text-[10px] text-black/50 font-semibold uppercase tracking-wider mb-3">Location</p>
            <div className="overflow-hidden" style={{ border: "2px solid var(--rule-strong-c)" }}>
              <iframe
                title={`Map of ${park.name}`}
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ""}&q=${park.latitude},${park.longitude}&zoom=15`}
                className="w-full aspect-[16/9] border-0"
                allowFullScreen
                loading="lazy"
              />
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${park.latitude},${park.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="c-btn c-btn-outline c-btn-sm mt-2 w-full press"
            >
              <Icon name="navigation" size={14} className="text-black/60" />
              <span className="text-[12px] font-semibold text-black/60">Get Directions</span>
            </a>
          </div>
        )}

        {/* Park Tips */}
        <div>
          <p className="text-[10px] text-black/50 font-semibold uppercase tracking-wider mb-3">Good to Know</p>
          <div className="p-4 space-y-3" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
            {[
              { text: "Picnic shelters can be reserved for groups and events", icon: "calendar" as IconName },
              ...(hasBBQ ? [{ text: "BBQ grills are first-come, first-served. Bring your own charcoal", icon: "bbq" as IconName }] : []),
              { text: "All programs at this park are free for Compton residents", icon: "star" as IconName },
              { text: "Report maintenance issues through the Culture app", icon: "megaphone" as IconName },
              { text: "Dogs must be on leash at all times", icon: "alert" as IconName },
            ].map((tip) => (
              <div key={tip.text} className="flex items-start gap-2.5">
                <div className="w-6 h-6 flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}>
                  <Icon name={tip.icon} size={11} className="text-black/40" />
                </div>
                <p className="text-[11px] text-black/50 leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Footer */}
        <div className="p-5 text-center" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
          <div
            className="w-10 h-10 flex items-center justify-center mx-auto mb-3"
            style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
          >
            <Icon name="tree" size={20} className="text-emerald" />
          </div>
          <p className="font-heading text-[14px] font-bold text-white mb-1">{park.name}</p>
          {park.address && <p className="text-[11px] text-black/50 mb-3">{park.address}</p>}
          <div className="flex justify-center gap-2">
            {park.phone && (
              <a href={`tel:${(park.phone as string).replace(/[^0-9]/g, "")}`} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald bg-emerald/10 rounded-full px-3 py-1.5 press">
                <Icon name="phone" size={12} className="text-emerald" />
                Call Park
              </a>
            )}
            {park.latitude && park.longitude && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${park.latitude},${park.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-cyan bg-cyan/10 rounded-full px-3 py-1.5 press"
              >
                <Icon name="navigation" size={12} className="text-cyan" />
                Directions
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
