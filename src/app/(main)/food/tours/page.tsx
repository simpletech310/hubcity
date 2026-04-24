import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TourCard from "@/components/food/TourCard";
import type { FoodTour } from "@/types/database";
import Icon from "@/components/ui/Icon";

export default async function FoodToursPage() {
  const supabase = await createClient();

  const { data: tours } = await supabase
    .from("food_tours")
    .select(
      "*, stops:food_tour_stops(*, business:businesses(id, name, slug, image_urls, address, rating_avg))"
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-4 mb-5">
        <Link
          href="/food"
          className="inline-flex items-center gap-1.5 press mb-3 c-kicker"
          style={{ color: "var(--ink-strong)" }}
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
          Food
        </Link>
        <h1 className="c-hero mb-1" style={{ fontSize: "1.75rem", color: "var(--ink-strong)" }}>Food Tours</h1>
        <p className="c-body" style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.7 }}>
          Curated culinary journeys through Compton
        </p>
      </div>

      {/* Tours Grid */}
      <div className="px-5 space-y-4">
        {(tours as FoodTour[] | null)?.length ? (
          (tours as FoodTour[]).map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))
        ) : (
          <div
            className="text-center py-16 px-6"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <span className="block mb-3" style={{ color: "var(--ink-strong)" }}><Icon name="globe" size={28} /></span>
            <p className="c-card-t mb-1" style={{ fontSize: 14, color: "var(--ink-strong)" }}>No tours yet</p>
            <p className="c-body" style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.7 }}>
              Food tours are coming soon. Check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
