import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

const AMENITY_DETAILS: Record<string, { icon: IconName; label: string; color: string }> = {
  playground: { icon: "baby", label: "Playground", color: "text-pink" },
  basketball: { icon: "basketball", label: "Basketball Courts", color: "text-orange-400" },
  bbq: { icon: "bbq", label: "BBQ Grills & Pits", color: "text-orange-400" },
  restrooms: { icon: "restroom", label: "Restrooms", color: "text-white/50" },
  pool: { icon: "swimming", label: "Swimming Pool", color: "text-cyan" },
  tennis: { icon: "tennis", label: "Tennis Courts", color: "text-emerald" },
  soccer: { icon: "soccer", label: "Soccer Fields", color: "text-emerald" },
  baseball: { icon: "trophy", label: "Baseball Diamond", color: "text-gold" },
  picnic: { icon: "tree", label: "Picnic Area", color: "text-emerald" },
  walking: { icon: "tree", label: "Walking Trails", color: "text-emerald" },
  dog_park: { icon: "alert", label: "Dog Park", color: "text-gold" },
  gym: { icon: "trophy", label: "Fitness Center", color: "text-hc-blue" },
  skatepark: { icon: "skateboard", label: "Skatepark", color: "text-hc-purple" },
  splash_pad: { icon: "swimming", label: "Splash Pad", color: "text-cyan" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: park } = await supabase
    .from("parks")
    .select("name")
    .or(`id.eq.${id},slug.eq.${id}`)
    .single();

  return {
    title: park ? `${park.name} | Parks | Hub City` : "Park | Hub City",
  };
}

export default async function ParkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: park } = await supabase
    .from("parks")
    .select("*")
    .or(`id.eq.${id},slug.eq.${id}`)
    .single();

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

  // Parse hours
  const hours = park.hours as Record<string, string> | string | null;
  let hoursEntries: { label: string; time: string }[] = [];
  if (hours && typeof hours === "object") {
    hoursEntries = Object.entries(hours).map(([key, val]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      time: val,
    }));
  }

  const district = typeof park.district === "number" ? park.district : null;

  return (
    <div className="min-h-screen bg-midnight text-white pb-28">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald/10 via-midnight to-midnight" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald/40 to-transparent" />
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-emerald/5 blur-3xl" />

        <div className="relative z-10 px-5 pt-6 pb-5">
          {/* Back link */}
          <Link href="/parks" className="inline-flex items-center gap-1.5 text-[12px] text-white/40 mb-4 press">
            <Icon name="back" size={14} className="text-white/40" />
            All Parks
          </Link>

          <div className="flex items-start gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald/20 to-emerald/5 border border-emerald/15 flex items-center justify-center shrink-0">
              <Icon name="tree" size={28} className="text-emerald" />
            </div>
            <div>
              <h1 className="font-heading text-[22px] font-bold text-white leading-tight">{park.name}</h1>
              {park.address && (
                <p className="text-[12px] text-white/40 mt-1">{park.address}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {district && (
                  <span className="text-[10px] font-semibold text-emerald bg-emerald/10 border border-emerald/20 rounded-full px-2 py-0.5">
                    District {district}
                  </span>
                )}
                {park.phone && (
                  <a href={`tel:${park.phone.replace(/[^0-9]/g, "")}`} className="text-[10px] font-semibold text-gold bg-gold/10 border border-gold/20 rounded-full px-2 py-0.5 press">
                    {park.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Description */}
        {park.description && (
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4">
            <p className="text-[13px] text-white/60 leading-relaxed">{park.description}</p>
          </div>
        )}

        {/* Hours */}
        {hoursEntries.length > 0 && (
          <div>
            <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-3">Hours</p>
            <div className="glass-card-elevated rounded-2xl p-4">
              <div className="space-y-2.5">
                {hoursEntries.map((h) => (
                  <div key={h.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald/10 flex items-center justify-center">
                        <Icon name="clock" size={13} className="text-emerald" />
                      </div>
                      <span className="text-[12px] text-white/60">{h.label}</span>
                    </div>
                    <span className="text-[12px] font-semibold text-white">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Amenities */}
        {park.amenities && park.amenities.length > 0 && (
          <div>
            <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-3">Amenities & Facilities</p>
            <div className="grid grid-cols-2 gap-2">
              {(park.amenities as string[]).map((amenity: string) => {
                const detail = AMENITY_DETAILS[amenity] || {
                  icon: "check" as IconName,
                  label: amenity.replace(/_/g, " "),
                  color: "text-white/50",
                };
                return (
                  <div
                    key={amenity}
                    className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                      <Icon name={detail.icon} size={16} className={detail.color} />
                    </div>
                    <span className="text-[12px] text-white/70 font-medium">{detail.label}</span>
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
              <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Programs</p>
              <Link href="/parks/programs" className="text-[11px] font-semibold text-gold press">See All</Link>
            </div>
            <div className="space-y-2">
              {programs.map((program) => (
                <div key={program.id} className="glass-card-elevated rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                      <Icon name="calendar" size={16} className="text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-semibold text-white">{program.name}</h3>
                      {program.description && (
                        <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed line-clamp-2">{program.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {program.schedule && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-cyan bg-cyan/10 rounded-full px-2 py-0.5">
                            <Icon name="clock" size={9} className="text-cyan" />
                            {program.schedule}
                          </span>
                        )}
                        {program.age_range && (
                          <span className="text-[10px] text-hc-purple bg-hc-purple/10 rounded-full px-2 py-0.5">
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

        {/* Map */}
        {park.latitude && park.longitude && (
          <div>
            <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-3">Location</p>
            <div className="rounded-2xl overflow-hidden border border-white/[0.06]">
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
              className="mt-2 flex items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl py-2.5 press"
            >
              <Icon name="navigation" size={14} className="text-white/50" />
              <span className="text-[12px] font-semibold text-white/50">Get Directions</span>
            </a>
          </div>
        )}

        {/* Events */}
        {events.length > 0 && (
          <div>
            <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-3">Upcoming Events</p>
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="glass-card-elevated rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/15 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[14px] font-heading font-bold text-gold leading-none">
                        {new Date(event.start_date).getDate()}
                      </span>
                      <span className="text-[8px] text-gold/60 uppercase font-semibold">
                        {new Date(event.start_date).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[13px] font-semibold text-white truncate">{event.title}</h3>
                      <p className="text-[11px] text-white/40 mt-0.5">
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

        {/* Contact */}
        {park.phone && (
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4 text-center">
            <p className="text-[11px] text-white/30 mb-2">Questions about this park?</p>
            <a
              href={`tel:${park.phone.replace(/[^0-9]/g, "")}`}
              className="inline-flex items-center gap-2 bg-emerald/10 border border-emerald/20 rounded-xl px-4 py-2.5 press"
            >
              <Icon name="phone" size={14} className="text-emerald" />
              <span className="text-[12px] font-semibold text-emerald">Call {park.phone}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
