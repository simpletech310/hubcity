"use client";

import { useRouter, usePathname } from "next/navigation";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function BookingFilters({
  currentFilter,
}: {
  currentFilter: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function setFilter(key: string) {
    const params = new URLSearchParams();
    if (key !== "all") params.set("filter", key);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4">
      {FILTERS.map((f) => {
        const isActive = currentFilter === f.key;
        return (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors
              ${
                isActive
                  ? "bg-gold/15 text-gold border border-gold/30"
                  : "bg-white/[0.03] text-txt-secondary border border-border-subtle hover:text-white"
              }
            `}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
