import type { Metadata } from "next";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/branding";

export interface OgInput {
  /** Page title (we'll add `— SITE_NAME` automatically). */
  title: string;
  /** ≤200 char description that goes into description + OG/Twitter. */
  description?: string | null;
  /** Hero image URL — drives summary_large_image when provided. */
  image?: string | null;
  /** OpenGraph type — defaults to 'website'. Use 'article', 'video.other',
   *  'music.album', etc. for richer cards. */
  type?: string;
  /** Path-only URL like `/events/foo`; we prefix SITE_DOMAIN. */
  path: string;
  /** Optional alt text for the image. Falls back to title. */
  imageAlt?: string;
  /** Append `— SITE_NAME` to title? Default true. */
  brandSuffix?: boolean;
}

/**
 * Build a consistent Next.js Metadata object for any entity page.
 * Drop-in replacement for hand-rolled `generateMetadata` blocks. Pairs
 * with the rich-OG template already in business/[id]/page.tsx.
 */
export function buildOg({
  title,
  description,
  image,
  type = "website",
  path,
  imageAlt,
  brandSuffix = true,
}: OgInput): Metadata {
  const url = `${SITE_DOMAIN}${path.startsWith("/") ? path : `/${path}`}`;
  const fullTitle = brandSuffix ? `${title} — ${SITE_NAME}` : title;
  const desc = (description ?? "").trim().slice(0, 200) || undefined;
  const heroAlt = imageAlt || title;

  return {
    title: fullTitle,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url,
      siteName: SITE_NAME,
      type: type as "website",
      images: image
        ? [{ url: image, width: 1200, height: 630, alt: heroAlt }]
        : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description: desc,
      images: image ? [image] : undefined,
    },
    alternates: { canonical: url },
  };
}
