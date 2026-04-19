/**
import Icon from "@/components/ui/Icon";
 * Knect Hashtag Parser
 * Extracts hashtags from post text and determines if any trigger actions
 */

export interface ParsedHashtag {
  tag: string; // without #
  original: string; // with #
  position: number;
}

/**
 * Parse all hashtags from text
 */
export function parseHashtags(text: string): ParsedHashtag[] {
  const regex = /#([a-zA-Z][a-zA-Z0-9_]{1,29})/g;
  const hashtags: ParsedHashtag[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    hashtags.push({
      tag: match[1].toLowerCase(),
      original: match[0],
      position: match.index,
    });
  }

  return hashtags;
}

/**
 * Extract location context from text near a hashtag
 * Looks for patterns like "on [Street] near [Street]", "at [Location]", etc.
 */
export function extractLocationFromText(text: string): string | null {
  // Common patterns for location mentions
  const patterns = [
    /(?:on|at|near|by)\s+([A-Z][a-zA-Z\s]+(?:Blvd|St|Ave|Rd|Dr|Ln|Way|Ct|Pl|Hwy|Boulevard|Street|Avenue|Road|Drive|Lane|Court|Place|Highway)(?:\s+(?:near|and|&|at)\s+[A-Z][a-zA-Z\s]+(?:Blvd|St|Ave|Rd|Dr|Ln|Way|Ct|Pl|Hwy|Boulevard|Street|Avenue|Road|Drive|Lane|Court|Place|Highway))?)/i,
    /(\d+\s+[A-Z][a-zA-Z\s]+(?:Blvd|St|Ave|Rd|Dr|Ln|Way|Ct|Pl|Hwy|Boulevard|Street|Avenue|Road|Drive|Lane|Court|Place|Highway))/i,
    /(?:📍|location:|loc:)\s*(.+?)(?:\.|$|\n)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Generate an issue title from the post body
 */
export function generateIssueTitle(
  issueType: string,
  locationText: string | null
): string {
  const typeLabels: Record<string, string> = {
    pothole: "Pothole",
    streetlight: "Broken Streetlight",
    graffiti: "Graffiti",
    trash: "Illegal Dumping",
    flooding: "Flooding",
    parking: "Parking Issue",
    noise: "Noise Complaint",
    sidewalk: "Sidewalk Damage",
    tree: "Tree Issue",
    parks: "Park Maintenance",
    water: "Water Issue",
    stray: "Stray Animal",
    safety: "Safety Concern",
    other: "City Issue",
  };

  const label = typeLabels[issueType] || "City Issue";
  if (locationText) {
    return `${label} — ${locationText}`;
  }
  return `${label} Report`;
}

/**
 * SLA hours per issue type (expected resolution time)
 */
export const ISSUE_SLA_HOURS: Record<string, number> = {
  pothole: 72,        // 3 days
  streetlight: 48,    // 2 days
  graffiti: 120,      // 5 days
  trash: 48,          // 2 days
  flooding: 24,       // 1 day (urgent)
  parking: 72,        // 3 days
  noise: 48,          // 2 days
  sidewalk: 168,      // 7 days
  tree: 168,          // 7 days
  parks: 120,         // 5 days
  water: 24,          // 1 day (urgent)
  stray: 24,          // 1 day (urgent)
  safety: 12,         // 12 hours (critical)
  other: 120,         // 5 days
};

/**
 * Department email mapping for issue types
 */
export const ISSUE_DEPARTMENT_MAP: Record<
  string,
  { department: string; email: string }
> = {
  pothole: {
    department: "Public Works",
    email: "publicworks@comptoncity.org",
  },
  streetlight: {
    department: "Public Works",
    email: "publicworks@comptoncity.org",
  },
  sidewalk: {
    department: "Public Works",
    email: "publicworks@comptoncity.org",
  },
  flooding: {
    department: "Public Works",
    email: "publicworks@comptoncity.org",
  },
  graffiti: {
    department: "Sanitation",
    email: "sanitation@comptoncity.org",
  },
  trash: { department: "Sanitation", email: "sanitation@comptoncity.org" },
  parking: {
    department: "Code Enforcement",
    email: "codeenforcement@comptoncity.org",
  },
  noise: {
    department: "Code Enforcement",
    email: "codeenforcement@comptoncity.org",
  },
  tree: {
    department: "Parks & Recreation",
    email: "parks@comptoncity.org",
  },
  parks: {
    department: "Parks & Recreation",
    email: "parks@comptoncity.org",
  },
  water: { department: "Utilities", email: "utilities@comptoncity.org" },
  stray: {
    department: "Animal Control",
    email: "animalcontrol@comptoncity.org",
  },
  safety: {
    department: "Public Safety",
    email: "publicsafety@comptoncity.org",
  },
};
