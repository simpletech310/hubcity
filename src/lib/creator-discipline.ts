// ─────────────────────────────────────────────────────────
// Heuristic "what they do" label for a creator.
// Drives the discipline line on /creators cards and
// (eventually) the profile hero. Pure server-friendly fn.
// ─────────────────────────────────────────────────────────

interface DisciplineCounts {
  reels: number;
  videos: number;
  tracks: number;
  image_posts: number;
}

export function deriveDiscipline(
  p: { role: string | null },
  counts: DisciplineCounts
): string {
  const r = p.role ?? "citizen";

  // Identity-driven labels first — these aren't really creators.
  if (r === "city_ambassador") return "City Ambassador";
  if (r === "chamber_admin") return "Chamber";
  if (r === "resource_provider") return "Community";

  if (r !== "content_creator" && r !== "creator") return "Creator";

  const top = Math.max(
    counts.tracks,
    counts.videos,
    counts.image_posts,
    counts.reels
  );
  if (top === 0) return "Creator";
  if (top === counts.tracks) return "Musician";
  if (top === counts.videos) return "Filmmaker";
  if (top === counts.image_posts) return "Artist";
  return "Storyteller"; // reels-leading
}
