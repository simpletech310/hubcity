"use client";

import { useState, useEffect } from "react";

interface SaveButtonProps {
  itemType: "business" | "event" | "resource";
  itemId: string;
  size?: "sm" | "md";
}

export default function SaveButton({
  itemType,
  itemId,
  size = "md",
}: SaveButtonProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  // Check initial saved state
  useEffect(() => {
    async function check() {
      try {
        const res = await fetch(
          `/api/saved?item_type=${itemType}&item_id=${itemId}`
        );
        if (res.ok) {
          const data = await res.json();
          setSaved(data.saved);
        }
      } catch {
        // ignore
      } finally {
        setChecked(true);
      }
    }
    check();
  }, [itemType, itemId]);

  const toggleSave = async () => {
    if (loading) return;
    setLoading(true);

    const wasSaved = saved;
    setSaved(!wasSaved); // Optimistic

    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_type: itemType, item_id: itemId }),
      });

      if (res.ok) {
        const data = await res.json();
        setSaved(data.saved);
      } else {
        setSaved(wasSaved); // Rollback
      }
    } catch {
      setSaved(wasSaved); // Rollback
    } finally {
      setLoading(false);
    }
  };

  if (!checked) return null;

  const sizeClasses =
    size === "sm"
      ? "w-9 h-9 rounded-xl text-base"
      : "w-12 h-12 rounded-2xl text-lg";

  return (
    <button
      onClick={toggleSave}
      disabled={loading}
      className={`${sizeClasses} shrink-0 border flex items-center justify-center press transition-all ${
        saved
          ? "bg-gold/15 border-gold/30 text-gold shadow-sm shadow-gold/10"
          : "bg-card border-border-subtle text-txt-secondary hover:border-gold/20 hover:text-gold"
      } ${loading ? "opacity-60" : ""}`}
      title={saved ? "Unsave" : "Save"}
    >
      {saved ? "🔖" : "🏷️"}
    </button>
  );
}
