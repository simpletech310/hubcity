/**
 * Single source of truth for platform branding. Every component, email, and
 * metadata string should import from here rather than hardcoding a name.
 *
 * Defaults land on "Culture" — the editorial rebrand. Override via env for
 * white-label or staging deploys.
 */

export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Culture";

export const SITE_TAGLINE =
  process.env.NEXT_PUBLIC_SITE_TAGLINE?.trim() || "Your city, curated.";

export const SITE_DOMAIN =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://hubcity.4everforward.net";

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "hello@culture.app";

export const EMAIL_FROM_NAME =
  process.env.SENDGRID_FROM_NAME?.trim() || SITE_NAME;

export const EMAIL_FROM_ADDRESS =
  process.env.SENDGRID_FROM_EMAIL?.trim() || SUPPORT_EMAIL;
