"use client";

import { useEffect, useRef } from "react";

const EMOJI = [
  "❤️","🔥","👏","💯","🙏","😂","🥲","😍",
  "🤔","👀","✨","🎉","🙌","💪","🤝","☕",
  "🌮","🌶️","🎶","🎬","📸","💃","🕺","🏀",
  "⚽","🏈","🌴","🌅","🌃","🚀","⚡","👑",
];

interface EmojiPickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
}

export default function EmojiPicker({ open, onClose, onPick }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => document.addEventListener("mousedown", onDown), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Pick an emoji"
      className="panel-editorial absolute bottom-full left-0 mb-2 w-[264px] p-2 rounded-xl shadow-xl z-50"
    >
      <div className="grid grid-cols-8 gap-1">
        {EMOJI.map((e) => (
          <button
            key={e}
            onClick={() => {
              onPick(e);
              onClose();
            }}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gold/10 press text-lg"
            aria-label={`Insert ${e}`}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
