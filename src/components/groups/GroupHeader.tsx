"use client";

import { useState } from "react";
import Image from "next/image";
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

const CATEGORY_LABELS: Record<string, string> = {
  neighborhood: "Scene",
  interest: "Interest",
  school: "School",
  faith: "Faith",
  sports: "Sports",
  business: "Business",
  other: "Other",
};

interface GroupHeaderProps {
  group: GroupInfo;
  isMember: boolean;
  myRole: string | null;
  /** "active" | "pending" | null — undefined falls back to legacy isMember-only behavior */
  myStatus?: "active" | "pending" | null;
  joining: boolean;
  onJoin: () => void;
  onEdit: () => void;
  onShare: () => void;
}

export default function GroupHeader({ group, isMember, myRole, myStatus, joining, onJoin, onEdit, onShare }: GroupHeaderProps) {
  const [descExpanded, setDescExpanded] = useState(false);
  const isAdmin = myRole === "admin";

  function formatCreatedDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
    >
      {/* Cover image or paper slab */}
      {group.image_url ? (
        <div
          className="h-[140px] relative"
          style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
        >
          <Image src={group.image_url} alt="" width={430} height={160} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div
          className="h-[80px]"
          style={{
            background: "var(--paper-soft)",
            borderBottom: "2px solid var(--rule-strong-c)",
          }}
        />
      )}

      <div className="relative px-5 -mt-10 pb-4">
        {/* Avatar + title row */}
        <div className="flex items-end gap-3">
          <div
            className="w-20 h-20 flex items-center justify-center shrink-0 overflow-hidden"
            style={{
              background: "var(--paper)",
              border: "3px solid var(--rule-strong-c)",
            }}
          >
            {group.avatar_url ? (
              <Image src={group.avatar_url} alt="" width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "var(--gold-c)" }}
              >
                <span
                  className="c-hero"
                  style={{ fontSize: 32, lineHeight: 1, color: "var(--ink-strong)" }}
                >
                  {group.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="c-hero truncate" style={{ fontSize: 26, lineHeight: 1, color: "var(--ink-strong)" }}>
                {group.name}
              </h1>
              {isAdmin && (
                <button
                  onClick={onEdit}
                  className="p-1 press"
                  style={{ color: "var(--ink-strong)" }}
                  aria-label="Edit group"
                >
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
          <div className="mt-3">
            <p
              className={`c-body ${!descExpanded ? "line-clamp-2" : ""}`}
              style={{ fontSize: 13, color: "var(--ink-strong)", lineHeight: 1.45 }}
            >
              {group.description}
            </p>
            {group.description.length > 100 && (
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="c-kicker mt-1"
                style={{ fontSize: 10, color: "var(--ink-strong)" }}
              >
                {descExpanded ? "SHOW LESS" : "SHOW MORE"}
              </button>
            )}
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="c-badge-gold">
            {(CATEGORY_LABELS[group.category] ?? group.category).toUpperCase()}
          </span>
          <span className={group.is_public ? "c-badge-ok" : "c-badge-ink"}>
            {group.is_public ? "PUBLIC" : "PRIVATE"}
          </span>
          <span className="c-kicker" style={{ fontSize: 10, opacity: 0.65 }}>
            EST · {formatCreatedDate(group.created_at).toUpperCase()}
          </span>
          {group.creator && (
            <span className="c-serif-it" style={{ fontSize: 12 }}>
              by {group.creator.display_name}
            </span>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 mt-4">
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 c-kicker"
            style={{
              fontSize: 10,
              background: "var(--paper-soft)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
            }}
          >
            <Icon name="users" size={14} />
            {group.member_count} MEMBER{group.member_count !== 1 ? "S" : ""}
          </span>
          <button
            onClick={onJoin}
            disabled={joining}
            className={`c-btn c-btn-sm press ${
              isMember || myStatus === "pending" ? "c-btn-outline" : "c-btn-primary"
            }`}
            title={myStatus === "pending" ? "Tap to cancel your request" : undefined}
          >
            {joining
              ? "…"
              : myStatus === "pending"
              ? "PENDING"
              : isMember
              ? "JOINED"
              : "JOIN"}
          </button>
          <button
            onClick={onShare}
            className="p-2 press"
            style={{
              background: "var(--paper-soft)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
            }}
            aria-label="Share group"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
