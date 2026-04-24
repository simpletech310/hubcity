import Link from "next/link";
import Image from "next/image";
import type { FoodTour } from "@/types/database";
import Icon from "@/components/ui/Icon";

export default function TourCard({ tour }: { tour: FoodTour }) {
  const stopCount = tour.stops?.length ?? 0;

  return (
    <Link
      href={`/food/tours/${tour.slug}`}
      className="block press"
      style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
    >
      <div
        className="h-[120px] relative overflow-hidden"
        style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
      >
        {tour.image_url ? (
          <Image src={tour.image_url} alt={tour.name} fill className="object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "var(--ink-strong)" }}
          >
            <Icon name="utensils" size={32} style={{ color: "var(--gold-c)" }} />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3
          className="c-card-t truncate"
          style={{ fontSize: 14, color: "var(--ink-strong)" }}
        >
          {tour.name}
        </h3>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="c-badge c-badge-gold" style={{ fontSize: 9 }}>
            {stopCount} STOPS
          </span>
          {tour.estimated_duration != null && (
            <span className="c-kicker" style={{ fontSize: 9, opacity: 0.7 }}>
              ~{tour.estimated_duration} MIN
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
