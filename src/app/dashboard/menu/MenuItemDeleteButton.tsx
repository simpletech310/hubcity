"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MenuItemDeleteButton({ itemId }: { itemId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/menu-items/${itemId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      }
    } catch {
      // Silent fail — item stays in list
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-coral">Delete?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-[10px] px-2 py-0.5 rounded-md bg-coral/20 text-coral hover:bg-coral/30 transition-colors disabled:opacity-50"
        >
          {deleting ? "..." : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-txt-secondary hover:bg-white/10 transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setConfirming(true);
      }}
      className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center hover:bg-coral/20 transition-colors"
      title="Delete item"
    >
      <svg
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-coral"
      >
        <path d="M2 3h10M5 3V2a1 1 0 011-1h2a1 1 0 011 1v1M4 5v6a1 1 0 001 1h4a1 1 0 001-1V5" />
      </svg>
    </button>
  );
}
