"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { MapPoint } from "@/types/map";
import { MAP_POINT_COLORS, MAP_POINT_LABELS } from "@/types/map";

interface MapPointCardProps {
  point: MapPoint;
  onClose: () => void;
}

function getDetailLink(point: MapPoint): string {
  switch (point.type) {
    case "business":
      return `/business/${point.id}`;
    case "event":
      return `/events/${point.id}`;
    case "health":
      return `/health/${point.id}`;
    case "issue":
      return `/issues/${point.id}`;
    case "school":
      return `/schools/${point.id}`;
    case "transit":
      return `/transit/${point.id}`;
    case "park":
      return `/parks/${point.id}`;
    case "mural":
      return `/murals/${point.id}`;
    default:
      return "#";
  }
}

export default function MapPointCard({ point, onClose }: MapPointCardProps) {
  const color = point.color || MAP_POINT_COLORS[point.type];
  const address =
    point.metadata?.address ??
    point.metadata?.location_name ??
    point.metadata?.address_line1 ??
    null;
  const description = point.metadata?.description ?? null;

  return (
    <AnimatePresence>
      <motion.div
        key={point.id}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 z-30 bg-deep border-t border-border-subtle rounded-t-2xl shadow-2xl"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/10" />
        </div>

        <div className="px-4 pb-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-txt-primary font-heading font-semibold text-base leading-tight truncate">
                {point.name}
              </h3>

              {/* Type badge */}
              <span
                className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: `${color}20`,
                  color,
                  border: `1px solid ${color}33`,
                }}
              >
                {MAP_POINT_LABELS[point.type]}
              </span>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-txt-secondary"
              >
                <path
                  d="M1 1l12 12M13 1L1 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Address / description preview */}
          {(address || description) && (
            <p className="mt-2 text-txt-secondary text-xs leading-relaxed line-clamp-2">
              {(address as string) || (description as string)}
            </p>
          )}

          {/* View Details link */}
          <Link
            href={getDetailLink(point)}
            className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{
              backgroundColor: `${color}18`,
              color,
              border: `1px solid ${color}25`,
            }}
          >
            View Details
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M5 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
