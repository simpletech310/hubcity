"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function BookingViewToggle({ currentView }: { currentView: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setView(view: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "list") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    router.push(`/dashboard/bookings?${params.toString()}`);
  }

  return (
    <div className="flex rounded-lg bg-white/[0.03] border border-border-subtle p-0.5">
      <button
        onClick={() => setView("list")}
        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
          currentView !== "calendar"
            ? "bg-gold/15 text-gold"
            : "text-txt-secondary hover:text-white"
        }`}
      >
        List
      </button>
      <button
        onClick={() => setView("calendar")}
        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
          currentView === "calendar"
            ? "bg-gold/15 text-gold"
            : "text-txt-secondary hover:text-white"
        }`}
      >
        Calendar
      </button>
    </div>
  );
}
