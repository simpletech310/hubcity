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
          className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press mb-3"
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
        <h1 className="font-heading text-2xl font-bold mb-1">Food Tours</h1>
        <p className="text-sm text-txt-secondary">
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
          <div className="text-center py-16">
            <span className="text-5xl block mb-3"><Icon name="globe" size={28} /></span>
            <p className="text-sm font-medium mb-1">No tours yet</p>
            <p className="text-xs text-txt-secondary">
              Food tours are coming soon. Check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
