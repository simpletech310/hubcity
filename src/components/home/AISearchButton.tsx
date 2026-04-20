"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import AISearchModal from "@/components/ai/AISearchModal";

export default function AISearchButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 bg-white/[0.04] border border-border-subtle rounded-2xl px-4 py-4 text-left press group hover:border-gold/20 transition-all relative overflow-hidden"
      >
        {/* Subtle gradient sweep */}
        <div className="absolute inset-0 bg-gradient-to-r from-gold/[0.03] via-transparent to-hc-purple/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center shrink-0 group-hover:from-gold/30 transition-colors">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold" strokeLinecap="round">
            <circle cx="8" cy="8" r="5" />
            <path d="M12 12l4 4" />
          </svg>
        </div>
        <div className="relative flex-1">
          <span className="text-sm text-txt-secondary">
            Ask Culture AI anything...
          </span>
          <span className="block text-[10px] text-txt-secondary/60 mt-0.5">
            &ldquo;Best food near Rosecrans&rdquo; &ldquo;Youth programs&rdquo;
          </span>
        </div>
        <Badge label="AI" variant="gold" size="sm" shine />
      </button>

      <AISearchModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
