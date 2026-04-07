"use client";

import Image from "next/image";

interface HighlightCardProps {
  id: string;
  authorName: string;
  authorAvatar: string | null;
  isViewed: boolean;
  onClick: () => void;
}

export default function HighlightCard({
  authorName,
  authorAvatar,
  isViewed,
  onClick,
}: HighlightCardProps) {
  const initial = authorName.charAt(0).toUpperCase();

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] press">
      <div
        className={`w-[60px] h-[60px] rounded-full p-[2.5px] ${
          isViewed
            ? "bg-white/10"
            : "bg-gradient-to-br from-gold via-gold-light to-gold"
        }`}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-card border-2 border-card">
          {authorAvatar ? (
            <Image
              src={authorAvatar}
              alt={authorName}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-royal to-hc-purple text-gold font-heading font-bold text-lg">
              {initial}
            </div>
          )}
        </div>
      </div>
      <span className={`text-[10px] font-medium truncate w-full text-center ${isViewed ? "text-white/30" : "text-white/70"}`}>
        {authorName.split(" ")[0]}
      </span>
    </button>
  );
}
