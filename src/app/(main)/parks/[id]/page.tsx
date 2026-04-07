import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

const AMENITY_DETAILS: Record<string, { icon: string; label: string }> = {
  playground: { icon: "sparkle", label: "Playground" },
  basketball: { icon: "trophy", label: "Basketball Courts" },
  bbq: { icon: "flame", label: "BBQ Grills" },
  restrooms: { icon: "building", label: "Restrooms" },
  pool: { icon: "heart-pulse", label: "Swimming Pool" },
  tennis: { icon: "trophy", label: "Tennis Courts" },
  soccer: { icon: "trophy", label: "Soccer Fields" },
  baseball: { icon: "trophy", label: "Baseball Diamond" },
  picnic: { icon: "theater", label: "Picnic Area" },
  walking: { icon: "person", label: "Walking Trail" },
  dog_park: { icon: "alert", label: "Dog Park" },
  gym: { icon: "trophy", label: "Fitness Area" },
  skatepark: { icon: "sparkle", label: "Skatepark" },
  splash_pad: { icon: "heart-pulse", label: "Splash Pad" },
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

  return (
    <div className="space-y-8 pb-20">
      {/* Hero */}
      <div className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-b-3xl bg-gradient-to-br from-emerald-900/60 via-black to-emerald-600/10">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={park.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-30"><Icon name="tree" size={16} /></span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
          <h1 className="font-display text-3xl md:text-5xl text-text-primary">
            {park.name}
          </h1>
          {park.address && (
            <p className="text-text-secondary text-sm mt-1">{park.address}</p>
          )}
          {park.district && (
            <span className="inline-block mt-2 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {park.district}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {park.description && (
        <section className="px-5">
          <p className="text-text-secondary leading-relaxed">
            {park.description}
          </p>
        </section>
      )}

      {/* Hours */}
      {park.hours && (
        <section className="px-5">
          <Card hover={false} padding>
            <div className="flex items-center gap-3">
              <span className="text-lg"><Icon name="clock" size={20} /></span>
              <div>
                <h3 className="font-heading font-bold text-sm text-text-primary">
                  Hours
                </h3>
                <p className="text-sm text-text-secondary">{park.hours}</p>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Amenities */}
      {park.amenities && park.amenities.length > 0 && (
        <section className="px-5">
          <h2 className="font-heading font-bold text-lg text-text-primary mb-3">
            Amenities
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {park.amenities.map((amenity: string) => {
              const detail = AMENITY_DETAILS[amenity] || {
                icon: "check",
                label: amenity.replace(/_/g, " "),
              };
              return (
                <div
                  key={amenity}
                  className="flex items-center gap-2 bg-card rounded-xl border border-border-subtle px-3 py-2.5"
                >
                  <Icon name={detail.icon as IconName} size={20} />
                  <span className="text-sm text-text-primary capitalize">
                    {detail.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Programs */}
      {programs.length > 0 && (
        <section className="px-5">
          <h2 className="font-heading font-bold text-lg text-text-primary mb-3">
            Programs
          </h2>
          <div className="space-y-2">
            {programs.map((program) => (
              <Card key={program.id} hover padding>
                <h3 className="font-heading font-bold text-sm text-text-primary">
                  {program.name}
                </h3>
                {program.schedule && (
                  <p className="text-xs text-warm-gray mt-1">
                    {program.schedule}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                  {program.age_range && <span>{program.age_range}</span>}
                  {program.fee && (
                    <span className="text-gold font-semibold">
                      {program.fee}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Map Embed */}
      {park.latitude && park.longitude && (
        <section className="px-5">
          <h2 className="font-heading font-bold text-lg text-text-primary mb-3">
            Location
          </h2>
          <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden border border-border-subtle bg-card">
            <iframe
              title={`Map of ${park.name}`}
              src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ""}&q=${park.latitude},${park.longitude}&zoom=15`}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </section>
      )}

      {/* Events at this park */}
      {events.length > 0 && (
        <section className="px-5">
          <h2 className="font-heading font-bold text-lg text-text-primary mb-3">
            Upcoming Events
          </h2>
          <div className="space-y-2">
            {events.map((event) => (
              <Card key={event.id} hover padding>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-gold/10 flex flex-col items-center justify-center border border-gold/20">
                    <span className="text-xs font-bold text-gold">
                      {new Date(event.start_date).getDate()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-sm text-text-primary">
                      {event.title}
                    </h3>
                    <p className="text-xs text-warm-gray mt-0.5">
                      {new Date(event.start_date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
