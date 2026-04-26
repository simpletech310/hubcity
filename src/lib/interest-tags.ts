// ─────────────────────────────────────────────────────────
// Canonical interest-tag vocabulary shared across events,
// community groups, and (eventually) other content surfaces.
// Each tag has a stable `value` (snake_case, used in DB), a
// human label, an Icon name, and an accent color.
// ─────────────────────────────────────────────────────────

import type { IconName } from "@/components/ui/Icon";

export interface InterestTag {
  value: string;
  label: string;
  icon: IconName;
  color: string;
}

export const INTEREST_TAGS: InterestTag[] = [
  { value: "health",        label: "Health & Wellness", icon: "heart-pulse", color: "#EF4444" },
  { value: "mental_health", label: "Mental Health",     icon: "brain",       color: "#A855F7" },
  { value: "fitness",       label: "Fitness",           icon: "pulse",       color: "#FF6B6B" },
  { value: "youth",         label: "Youth",             icon: "baby",        color: "#8B5CF6" },
  { value: "seniors",       label: "Seniors",           icon: "elder",       color: "#F59E0B" },
  { value: "family",        label: "Family",            icon: "family",      color: "#F59E0B" },
  { value: "education",     label: "Education",         icon: "education",   color: "#06B6D4" },
  { value: "business",      label: "Business",          icon: "briefcase",   color: "#22C55E" },
  { value: "finance",       label: "Finance",           icon: "dollar",      color: "#06B6D4" },
  { value: "tech",          label: "Tech",              icon: "bolt",        color: "#3B82F6" },
  { value: "food",          label: "Food",              icon: "apple",       color: "#FF6B6B" },
  { value: "arts",          label: "Arts",              icon: "palette",     color: "#8B5CF6" },
  { value: "music",         label: "Music",             icon: "music",       color: "#EC4899" },
  { value: "civic",         label: "Civic",             icon: "landmark",    color: "#06B6D4" },
  { value: "community",     label: "Community",         icon: "users",       color: "#22C55E" },
  { value: "faith",         label: "Faith",             icon: "shield",      color: "#8B5CF6" },
  { value: "sports",        label: "Sports",            icon: "trophy",      color: "#3B82F6" },
];

export const INTEREST_TAG_VALUES = INTEREST_TAGS.map((t) => t.value);

export function interestTagByValue(v: string): InterestTag | undefined {
  return INTEREST_TAGS.find((t) => t.value === v);
}

export function isInterestTagValue(v: string): boolean {
  return INTEREST_TAG_VALUES.includes(v);
}
