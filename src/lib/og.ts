import type { Metadata } from "next";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/branding";

/** OpenGraph type values we actually use across the platform. The
 *  full OG vocabulary is wider, but narrowing it here avoids the
 *  hand-rolled `as` casts the previous version used. */
export type OgType =
  | "website"
  | "article"
  | "profile"
  | "video.other"
  | "music.album"
  | "music.song"
  | "video.tv_show";

export interface OgInput {
  /** Page title (we'll add `— SITE_NAME` automatically). */
  title: string;
  /** ≤200 char description that goes into description + OG/Twitter. */
  description?: string | null;
  /** Hero image URL. When null, we fall through to `/api/og` so the
   *  share card still has a branded fallback instead of nothing. */
  image?: string | null;
  /** OpenGraph type — defaults to 'website'. */
  type?: OgType;
  /** Path-only URL like `/events/foo`; we prefix SITE_DOMAIN. */
  path: string;
  /** Optional alt text for the image. Falls back to title. */
  imageAlt?: string;
  /** Append `— SITE_NAME` to title? Default true. */
  brandSuffix?: boolean;
  /** Kicker label for the programmatic OG fallback (e.g. "EVENT",
   *  "ALBUM", "CREATOR"). Helps the auto-generated card identify
   *  what kind of thing was shared. */
  kicker?: string;
}

/**
 * Build a consistent Next.js Metadata object for any entity page.
 * Drop-in replacement for hand-rolled `generateMetadata` blocks.
 *
 * Image resolution:
 *   1. Caller-supplied `image` (entity hero / cover / poster)
 *   2. /api/og fallback rendered with title + kicker — always gives
 *      shared links a non-blank preview card.
 */
export function buildOg({
  title,
  description,
  image,
  type = "website",
  path,
  imageAlt,
  brandSuffix = true,
  kicker,
}: OgInput): Metadata {
  const url = `${SITE_DOMAIN}${path.startsWith("/") ? path : `/${path}`}`;
  const fullTitle = brandSuffix ? `${title} — ${SITE_NAME}` : title;
  const desc = (description ?? "").trim().slice(0, 200) || undefined;
  const heroAlt = imageAlt || title;

  // Fallback share card — programmatically rendered, always 1200x630.
  // We use the kicker so the auto-card reads "§ EVENT — Saturday Run"
  // instead of the generic platform tagline.
  const fallbackOg = (() => {
    const params = new URLSearchParams({ title });
    if (kicker) params.set("kicker", kicker);
    return `${SITE_DOMAIN}/api/og?${params.toString()}`;
  })();

  const heroImage = image || fallbackOg;

  return {
    title: fullTitle,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url,
      siteName: SITE_NAME,
      type,
      locale: "en_US",
      images: [{ url: heroImage, width: 1200, height: 630, alt: heroAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [heroImage],
    },
    alternates: { canonical: url },
  };
}
