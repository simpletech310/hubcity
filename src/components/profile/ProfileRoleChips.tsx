import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import type { Profile, Channel } from "@/types/database";

/**
 * Role descriptors driving the chip colors, icons, and priority order for
 * the "primary CTA" on the profile hero. Priority is lowest-to-highest
 * in the sense that roles earlier in this list are considered "more
 * primary" for the adaptive CTA (e.g. creator outranks business, which
 * outranks regular member). Chips still render for ALL applicable roles.
 */
const ROLE_DESCRIPTORS: Record<
  string,
  { label: string; icon: IconName; accent: "gold" | "emerald" | "coral" | "cyan" | "purple" | "blue" }
> = {
  content_creator: { label: "Creator", icon: "film", accent: "coral" },
  creator: { label: "Creator", icon: "film", accent: "coral" },
  business_owner: { label: "Business", icon: "store", accent: "emerald" },
  resource_provider: { label: "Resource Provider", icon: "briefcase", accent: "cyan" },
  chamber_admin: { label: "Chamber", icon: "landmark", accent: "gold" },
  city_official: { label: "Official", icon: "landmark", accent: "gold" },
  school_trustee: { label: "Trustee", icon: "graduation", accent: "emerald" },
  city_ambassador: { label: "Ambassador", icon: "flag", accent: "purple" },
  school: { label: "School", icon: "graduation", accent: "emerald" },
  admin: { label: "Admin", icon: "settings", accent: "blue" },
};

/**
 * Priority order for choosing which role's CTA wins the primary spot in
 * the hero when a user has multiple roles. Earlier entries win.
 */
export const ROLE_CTA_PRIORITY: string[] = [
  "content_creator",
  "creator",
  "business_owner",
  "resource_provider",
  "chamber_admin",
  "school_trustee",
  "city_official",
  "city_ambassador",
  "school",
];

export type ActiveRole =
  | "content_creator"
  | "business_owner"
  | "resource_provider"
  | "chamber_admin"
  | "city_official"
  | "school_trustee"
  | "city_ambassador"
  | "school"
  | "admin";

/**
 * Resolve the set of "active roles" for a profile based on data presence
 * rather than just the enum value. This lets multi-role users (e.g. a
 * creator who also owns a business) surface BOTH sections on their
 * profile.
 *
 * Creator is derived from is_creator + the presence of a channel (not
 * just the role enum) so that a "citizen" who happens to run a channel
 * still reads as a creator.
 */
export function deriveActiveRoles(
  profile: Pick<Profile, "role" | "is_creator">,
  channel: Channel | null | undefined,
  hasBusiness: boolean,
  resourceCount: number
): ActiveRole[] {
  const set = new Set<ActiveRole>();

  if ((profile.is_creator || !!channel) && channel) set.add("content_creator");
  if (hasBusiness) set.add("business_owner");
  if (resourceCount > 0) set.add("resource_provider");

  const enumRole = profile.role as string;
  if (enumRole === "chamber_admin") set.add("chamber_admin");
  if (enumRole === "city_official") set.add("city_official");
  if (enumRole === "school_trustee") set.add("school_trustee");
  if (enumRole === "city_ambassador") set.add("city_ambassador");
  if (enumRole === "school") set.add("school");
  if (enumRole === "admin") set.add("admin");

  return Array.from(set);
}

/** Pick the single "primary" role that drives the hero CTA. */
export function pickPrimaryRole(activeRoles: ActiveRole[]): ActiveRole | null {
  for (const r of ROLE_CTA_PRIORITY) {
    const match = activeRoles.find((role) => role === r);
    if (match) return match;
  }
  return activeRoles[0] ?? null;
}

/** Tailwind classes per accent color for the chip surface. */
const ACCENT_CLASSES: Record<string, string> = {
  gold: "bg-gold/12 border-gold/35 text-gold",
  emerald: "bg-emerald/12 border-emerald/35 text-emerald",
  coral: "bg-coral/12 border-coral/35 text-coral",
  cyan: "bg-cyan/12 border-cyan/35 text-cyan",
  purple: "bg-purple-500/12 border-purple-500/35 text-purple-300",
  blue: "bg-blue-500/12 border-blue-500/35 text-blue-300",
};

interface ProfileRoleChipsProps {
  roles: ActiveRole[];
  /**
   * Optional per-role sub-label overrides. For example:
   *   { city_official: "District 2", school_trustee: "CUSD" }
   */
  subLabels?: Partial<Record<ActiveRole, string | null>>;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Renders 1-N role chips for a profile hero. Each chip shows an icon +
 * role label + optional sub-label (e.g. district, department, tier).
 */
export default function ProfileRoleChips({
  roles,
  subLabels,
  size = "md",
  className = "",
}: ProfileRoleChipsProps) {
  if (roles.length === 0) return null;

  const padding = size === "sm" ? "px-2 py-[3px]" : "px-2.5 py-1";
  const fontSize = size === "sm" ? "text-[9px]" : "text-[10px]";
  const iconSize = size === "sm" ? 10 : 11;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {roles.map((role) => {
        const desc = ROLE_DESCRIPTORS[role];
        if (!desc) return null;
        const accent = ACCENT_CLASSES[desc.accent] ?? ACCENT_CLASSES.gold;
        const sub = subLabels?.[role];
        return (
          <span
            key={role}
            className={`inline-flex items-center gap-1.5 rounded-full border ${padding} ${fontSize} font-semibold uppercase tracking-[0.12em] ${accent}`}
          >
            <Icon name={desc.icon} size={iconSize} strokeWidth={2.2} />
            {desc.label}
            {sub && (
              <>
                <span className="opacity-50">·</span>
                <span className="opacity-90 normal-case tracking-normal">{sub}</span>
              </>
            )}
          </span>
        );
      })}
    </div>
  );
}
