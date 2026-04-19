/**
 * Single source of truth for platform branding. Every component, email, and
 * metadata string should import from here rather than hardcoding a name.
 *
 * Defaults are set to "Knect" — the rebrand target. Override via env during
 * transition periods where both names need to coexist (e.g. a staging deploy
 * still branded Knect).
 */

export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Knect";

export const SITE_TAGLINE =
  process.env.NEXT_PUBLIC_SITE_TAGLINE?.trim() || "Connect with your city.";

export const SITE_DOMAIN =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://knect.app";

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@knect.app";

export const EMAIL_FROM_NAME =
  process.env.SENDGRID_FROM_NAME?.trim() || SITE_NAME;

export const EMAIL_FROM_ADDRESS =
  process.env.SENDGRID_FROM_EMAIL?.trim() || SUPPORT_EMAIL;
