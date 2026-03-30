import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { FoodTour } from "@/types/database";

export default function TourCard({ tour }: { tour: FoodTour }) {
  const stopCount = tour.stops?.length ?? 0;

  return (
    <Link href={`/food/tours/${tour.slug}`}>
      <Card hover padding={false}>
        <div className="h-[120px] relative overflow-hidden rounded-t-2xl">
          {tour.image_url ? (
            <Image
              src={tour.image_url}
              alt={tour.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-coral/20 to-gold/10 flex items-center justify-center">
              <span className="text-4xl">🍽️</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        </div>
        <div className="p-3">
          <h3 className="font-heading font-bold text-[13px] mb-1.5 truncate">
            {tour.name}
          </h3>
          <div className="flex items-center gap-2">
            <Badge label={`${stopCount} stops`} variant="gold" />
            {tour.estimated_duration != null && (
              <span className="text-[10px] text-txt-secondary">
                ~{tour.estimated_duration} min
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
