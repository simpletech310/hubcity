import type { ReactionEmoji } from "@/types/database";

export const REACTION_EMOJI_MAP: Record<ReactionEmoji, string> = {
  heart: "\u2764\uFE0F",
  fire: "\uD83D\uDD25",
  clap: "\uD83D\uDC4F",
  hundred: "\uD83D\uDCAF",
  pray: "\uD83D\uDE4F",
};

export const REACTION_COLORS: Record<ReactionEmoji, { bg: string; text: string }> = {
  heart: { bg: "bg-coral/15", text: "text-coral" },
  fire: { bg: "bg-orange-500/15", text: "text-orange-400" },
  clap: { bg: "bg-gold/15", text: "text-gold" },
  hundred: { bg: "bg-emerald/15", text: "text-emerald" },
  pray: { bg: "bg-cyan/15", text: "text-cyan" },
};

export const ROLE_BADGE_MAP: Record<string, { label: string; variant: "gold" | "blue" | "coral" | "emerald" | "cyan" | "purple" }> = {
  city_official: { label: "Official", variant: "gold" },
  city_ambassador: { label: "Ambassador", variant: "purple" },
  admin: { label: "Admin", variant: "blue" },
  business_owner: { label: "Business", variant: "emerald" },
  citizen: { label: "Citizen", variant: "cyan" },
};

/** Roles that have admin panel access + elevated privileges */
export const ELEVATED_ROLES = ["admin", "city_official", "city_ambassador"];
