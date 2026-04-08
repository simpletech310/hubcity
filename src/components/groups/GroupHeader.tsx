"use client";

import { useState } from "react";
import Image from "next/image";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";

interface GroupInfo {
  id: string;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  avatar_url: string | null;
  member_count: number;
  is_public: boolean;
  created_by: string;
  created_at: string;
  creator: { display_name: string; avatar_url: string | null } | null;
}

const CATEGORY_GRADIENT_COLORS: Record<string, string> = {
  neighborhood: "#06B6D4", interest: "#8B5CF6", school: "#3B82F6",
  faith: "#EC4899", sports: "#10B981", business: "#F2A900", other: "#F87171",
};

const CATEGORY_BADGE: Record<string, "gold" | "emerald" | "cyan" | "purple" | "coral" | "blue" | "pink"> = {
  neighborhood: "cyan", interest: "purple", school: "blue",
  faith: "pink", sports: "emerald", business: "gold", other: "coral",
};

interface GroupHeaderProps {
  group: GroupInfo;
  isMember: boolean;
  myRole: string | null;
  joining: boolean;
  onJoin: () => void;
  onEdit: () => void;
  onShare: () => void;
}

export default function GroupHeader({ group, isMember, myRole, joining, onJoin, onEdit, onShare }: GroupHeaderProps) {
  const [descExpanded, setDescExpanded] = useState(false);
  const isAdmin = myRole === "admin";

  function formatCreatedDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  return (
    <div className="relative overflow-hidden">
      {/* Cover image or gradient */}
      {group.image_url ? (
        <div className="h-[160px] relative">
          <Image src={group.image_url} alt="" width={430} height={160} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/60 to-transparent" />
        </div>
      ) : (
        <div
          className="h-[130px]"
          style={{
            background: `linear-gradient(135deg, ${CATEGORY_GRADIENT_COLORS[group.category] || "#8B5CF6"}25 0%, var(--color-midnight) 60%, ${CATEGORY_GRADIENT_COLORS[group.category] || "#8B5CF6"}10 100%)`,
          }}
        />
      )}

      <div className="relative px-5 -mt-10 pb-4">
        {/* Avatar + title row */}
        <div className="flex items-end gap-3">
          <div className="w-20 h-20 rounded-2xl bg-deep border-2 border-border-subtle flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
            {group.avatar_url ? (
              <Image src={group.avatar_url} alt="" width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${CATEGORY_GRADIENT_COLORS[group.category] || "#8B5CF6"} 15%, transparent)` }}
              >
                <span className="text-2xl font-heading font-bold text-white/60">{group.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl font-bold truncate">{group.name}</h1>
              {isAdmin && (
                <button onClick={onEdit} className="p-1 text-txt-secondary hover:text-gold transition-colors">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {group.description && (
          <div className="mt-2">
            <p className={`text-xs text-txt-secondary leading-relaxed ${!descExpanded ? "line-clamp-2" : ""}`}>
              {group.description}
            </p>
            {group.description.length > 100 && (
              <button onClick={() => setDescExpanded(!descExpanded)} className="text-[10px] text-gold mt-0.5">
                {descExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge label={group.category} variant={CATEGORY_BADGE[group.category] || "gold"} />
          <Badge label={group.is_public ? "Public" : "Private"} variant={group.is_public ? "emerald" : "coral"} />
          <span className="text-[10px] text-txt-secondary">Created {formatCreatedDate(group.created_at)}</span>
          {group.creator && (
            <span className="text-[10px] text-txt-secondary">by {group.creator.display_name}</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-txt-secondary">
            <Icon name="users" size={14} />
            {group.member_count} member{group.member_count !== 1 ? "s" : ""}
          </span>
          <button
            onClick={onJoin}
            disabled={joining}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all press ${
              isMember ? "bg-emerald/20 text-emerald border border-emerald/30" : "bg-gold text-midnight"
            }`}
          >
            {joining ? "..." : isMember ? "Joined" : "Join"}
          </button>
          <button onClick={onShare} className="p-1.5 rounded-lg bg-white/5 text-txt-secondary hover:text-white transition-colors">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
