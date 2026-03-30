"use client";

import { useState } from "react";

type RSVPStatus = "going" | "interested" | "not_going";

interface RSVPButtonProps {
  eventId: string;
  initialStatus: RSVPStatus | null;
  rsvpCount: number;
}

const buttons: { status: RSVPStatus; label: string; color: string; selectedClass: string }[] = [
  {
    status: "going",
    label: "Going",
    color: "emerald",
    selectedClass: "bg-emerald/20 border-emerald/40 text-emerald shadow-sm shadow-emerald/10",
  },
  {
    status: "interested",
    label: "Interested",
    color: "cyan",
    selectedClass: "bg-cyan/20 border-cyan/40 text-cyan shadow-sm shadow-cyan/10",
  },
  {
    status: "not_going",
    label: "Can't Go",
    color: "coral",
    selectedClass: "bg-coral/20 border-coral/40 text-coral shadow-sm shadow-coral/10",
  },
];

export default function RSVPButton({
  eventId,
  initialStatus,
  rsvpCount,
}: RSVPButtonProps) {
  const [currentStatus, setCurrentStatus] = useState<RSVPStatus | null>(initialStatus);
  const [count, setCount] = useState(rsvpCount);
  const [loading, setLoading] = useState(false);

  const handleRSVP = async (status: RSVPStatus) => {
    if (loading) return;
    setLoading(true);

    const prevStatus = currentStatus;
    const prevCount = count;

    // Optimistic update
    if (currentStatus === status) {
      // Toggle off
      setCurrentStatus(null);
      setCount((c) => Math.max(0, c - 1));
    } else if (currentStatus === null) {
      // New RSVP
      setCurrentStatus(status);
      setCount((c) => c + 1);
    } else {
      // Changing status (count stays the same)
      setCurrentStatus(status);
    }

    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        // Rollback
        setCurrentStatus(prevStatus);
        setCount(prevCount);
      }
    } catch {
      // Rollback
      setCurrentStatus(prevStatus);
      setCount(prevCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-2">
        {buttons.map((btn) => {
          const isSelected = currentStatus === btn.status;
          return (
            <button
              key={btn.status}
              onClick={() => handleRSVP(btn.status)}
              disabled={loading}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl border transition-all duration-200 press ${
                isSelected
                  ? btn.selectedClass
                  : "bg-card border-border-subtle text-txt-secondary hover:border-white/20"
              } ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {btn.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-txt-secondary text-center mt-2">
        {count > 0
          ? `${count.toLocaleString()} ${count === 1 ? "person" : "people"} going`
          : "Be the first to RSVP"}
      </p>
    </div>
  );
}
