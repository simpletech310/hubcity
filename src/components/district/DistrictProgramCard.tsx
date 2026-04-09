"use client";

import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

// ─── Types ──────────────────────────────────────────

interface DistrictProgram {
  id: string;
  title: string;
  description: string | null;
  category: string;
  location_name: string | null;
  schedule: string | null;
  start_date: string | null;
  end_date: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface DistrictProgramCardProps {
  program: DistrictProgram;
}

// ─── Category Config ────────────────────────────────

const categoryConfig: Record<string, { color: string; label: string; icon: IconName }> = {
  community: { color: "#F2A900", label: "Community", icon: "users" },
  youth: { color: "#06B6D4", label: "Youth", icon: "baby" },
  sports: { color: "#10B981", label: "Sports", icon: "basketball" },
  education: { color: "#3B82F6", label: "Education", icon: "education" },
  health: { color: "#F87171", label: "Health", icon: "heart-pulse" },
  senior: { color: "#8B5CF6", label: "Senior", icon: "elder" },
  arts: { color: "#EC4899", label: "Arts", icon: "palette" },
};

// ─── Helpers ────────────────────────────────────────

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start) return null;
  const fmt = (d: string) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  if (end) return `${fmt(start)} - ${fmt(end)}`;
  return `Starts ${fmt(start)}`;
}

// ─── Component ──────────────────────────────────────

export default function DistrictProgramCard({ program }: DistrictProgramCardProps) {
  const config = categoryConfig[program.category] || categoryConfig.community;
  const dateRange = formatDateRange(program.start_date, program.end_date);
  const isEnded =
    !program.is_active ||
    (program.end_date && new Date(program.end_date + "T23:59:59") < new Date());

  const hasContact = program.contact_name || program.contact_phone || program.contact_email;

  return (
    <div className="glass-card-elevated rounded-2xl p-4 relative">
      {/* Category badge */}
      <div className="absolute top-4 right-4">
        <span
          className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5"
          style={{ background: `${config.color}18`, color: config.color }}
        >
          <Icon name={config.icon} size={10} />
          {config.label}
        </span>
      </div>

      {/* Active / Ended indicator */}
      {isEnded && (
        <div className="absolute top-4 left-4">
          <span className="text-[10px] font-semibold text-white/30 bg-white/[0.06] rounded-full px-2 py-0.5">
            Ended
          </span>
        </div>
      )}

      {/* Title */}
      <h3 className="text-[14px] font-semibold pr-20 mt-0.5">{program.title}</h3>

      {/* Description */}
      {program.description && (
        <p className="text-[12px] text-white/60 line-clamp-3 mt-1.5">{program.description}</p>
      )}

      {/* Info rows */}
      <div className="mt-3 space-y-1.5">
        {program.schedule && (
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <Icon name="clock" size={12} className="shrink-0 text-white/30" />
            <span>{program.schedule}</span>
          </div>
        )}
        {program.location_name && (
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <Icon name="map-pin" size={12} className="shrink-0 text-white/30" />
            <span>{program.location_name}</span>
          </div>
        )}
        {dateRange && (
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <Icon name="calendar" size={12} className="shrink-0 text-white/30" />
            <span>{dateRange}</span>
          </div>
        )}
      </div>

      {/* Contact row */}
      {hasContact && (
        <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/30">
            {program.contact_name && (
              <span className="flex items-center gap-1">
                <Icon name="person" size={10} className="text-white/20" />
                {program.contact_name}
              </span>
            )}
            {program.contact_phone && (
              <span className="flex items-center gap-1">
                <Icon name="phone" size={10} className="text-white/20" />
                {program.contact_phone}
              </span>
            )}
            {program.contact_email && (
              <span className="flex items-center gap-1">
                <Icon name="mail" size={10} className="text-white/20" />
                {program.contact_email}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
