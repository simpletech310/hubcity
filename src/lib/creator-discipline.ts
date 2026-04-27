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
  /** Combined exhibits + gallery items / artworks. Visual artists rank
   *  here when they have published creative works on /culture. */
  artwork?: number;
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

  const artwork = counts.artwork ?? 0;
  const top = Math.max(
    counts.tracks,
    counts.videos,
    counts.image_posts,
    counts.reels,
    artwork,
  );
  if (top === 0) return "Creator";
  // Artwork wins ties over image_posts because it's a stronger signal
  // (curated portfolio vs casual feed posts).
  if (top === artwork && artwork > 0) return "Artist";
  if (top === counts.tracks) return "Musician";
  if (top === counts.videos) return "Filmmaker";
  if (top === counts.image_posts) return "Artist";
  return "Storyteller"; // reels-leading
}
