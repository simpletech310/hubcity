"use client";

import { useState, type ReactNode } from "react";

type TabId = "work" | "reviews" | "hours";

interface Props {
  work: ReactNode;
  reviews: ReactNode;
  hours: ReactNode;
  /** Drop the REVIEWS tab if there are no reviews to show. */
  showReviews?: boolean;
  /** Drop the HOURS tab if the business hasn't published hours. */
  showHours?: boolean;
}

/**
 * Three-tab strip + active-slot renderer for the business detail page.
 * Server component renders all three slots (cheap), this client wrapper
 * just toggles which one is visible. WORK is the default landing tab.
 */
export default function BusinessTabs({
  work,
  reviews,
  hours,
  showReviews = true,
  showHours = true,
}: Props) {
  const [active, setActive] = useState<TabId>("work");

  const tabs: { id: TabId; label: string; visible: boolean }[] = [
    { id: "work", label: "WORK", visible: true },
    { id: "reviews", label: "REVIEWS", visible: showReviews },
    { id: "hours", label: "HOURS", visible: showHours },
  ];

  return (
    <>
      <div style={{ padding: "0 18px", borderTop: "3px solid var(--rule-strong-c)" }}>
        <div style={{ display: "flex" }}>
          {tabs
            .filter((t) => t.visible)
            .map((t) => {
              const isActive = active === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActive(t.id)}
                  className="c-ui press"
                  style={{
                    padding: "12px 14px",
                    fontSize: 11,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    borderBottom: isActive
                      ? "4px solid var(--rule-strong-c)"
                      : "4px solid transparent",
                    color: isActive ? "var(--ink-strong)" : "var(--ink-mute)",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
        </div>
      </div>

      {active === "work" && work}
      {active === "reviews" && reviews}
      {active === "hours" && hours}
    </>
  );
}
