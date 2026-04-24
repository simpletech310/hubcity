import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import type { FoodTour } from "@/types/database";
import Icon from "@/components/ui/Icon";

interface TourStopRow {
  id: string;
  tour_id: string;
  business_id: string;
  stop_order: number;
  note: string | null;
  business?: {
    id: string;
    name: string;
    slug: string;
    image_urls: string[];
    address: string;
    rating_avg: number;
    description: string;
    category: string;
  };
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: tour } = await supabase
    .from("food_tours")
    .select(
      "*, stops:food_tour_stops(*, business:businesses(id, name, slug, image_urls, address, rating_avg, description, category))"
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!tour) notFound();

  const typedTour = tour as FoodTour & { stops?: TourStopRow[] };
  const stops = (typedTour.stops ?? []).sort(
    (a: TourStopRow, b: TourStopRow) => a.stop_order - b.stop_order
  );

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-20">
      {/* Back */}
      <div className="px-5 pt-4 mb-3">
        <Link
          href="/food/tours"
          className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          Tours
        </Link>
      </div>

      {/* Hero */}
      <div className="mx-5 h-48 relative overflow-hidden mb-5 c-frame-strong">
        {typedTour.image_url ? (
          <Image
            src={typedTour.image_url}
            alt={typedTour.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-coral/20 to-gold/10 flex items-center justify-center">
            <span className="text-6xl"><Icon name="utensils" size={16} /></span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2">
            <Badge label={`${stops.length} stops`} variant="gold" size="md" />
            {typedTour.estimated_duration && (
              <Badge
                label={`~${typedTour.estimated_duration}`}
                variant="emerald"
                size="md"
              />
            )}
          </div>
        </div>
      </div>

      <div className="px-5">
        <span className="c-kicker block mb-2">Food Tour</span>
        <h1 className="c-hero mb-2" style={{ color: "var(--ink-strong)" }}>
          {typedTour.name}
        </h1>
        {typedTour.description && (
          <p className="c-serif-it text-[15px] mb-5 leading-relaxed">
            {typedTour.description}
          </p>
        )}
        <div style={{ height: 3, background: "var(--rule-strong-c, var(--ink-strong))", marginBottom: 24 }} />

        {/* Stops */}
        <h2 className="c-card-t mb-4" style={{ color: "var(--ink-strong)" }}>Tour Stops</h2>
        <div className="space-y-4 mb-8">
          {stops.map((stop: TourStopRow, index: number) => {
            const biz = stop.business;
            return (
              <div key={stop.id} className="flex gap-3">
                {/* Number circle */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-light text-midnight flex items-center justify-center font-heading font-bold text-sm">
                    {index + 1}
                  </div>
                  {index < stops.length - 1 && (
                    <div className="w-0.5 flex-1 bg-border-subtle mt-2" />
                  )}
                </div>

                {/* Business card */}
                <Link
                  href={`/business/${biz?.slug || biz?.id}`}
                  className="flex-1 min-w-0"
                >
                  <Card hover>
                    <div className="flex gap-3">
                      <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden relative">
                        {biz?.image_urls?.[0] ? (
                          <Image
                            src={biz.image_urls[0]}
                            alt={biz.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full art-food" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-bold text-[13px] mb-0.5 truncate">
                          {biz?.name ?? "Business"}
                        </h3>
                        {biz?.address && (
                          <p className="text-[10px] text-txt-secondary mb-1 truncate">
                            <Icon name="pin" size={16} /> {biz.address.split(",")[0]}
                          </p>
                        )}
                        {stop.note && (
                          <p className="text-[11px] text-gold italic">
                            {stop.note}
                          </p>
                        )}
                      </div>
                      {(biz?.rating_avg ?? 0) > 0 && (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-gold text-xs"><Icon name="star" size={14} className="text-gold" /></span>
                          <span className="text-xs font-bold">
                            {Number(biz?.rating_avg ?? 0).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
