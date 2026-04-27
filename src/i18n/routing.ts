/**
 * i18n routing config — staged for the eventual next-intl integration.
 * The package is installed (next-intl@4.9) but the [locale] segment +
 * NextIntlClientProvider haven't been wired yet to avoid churning every
 * route at once. This file holds the canonical list of supported locales
 * + default so the LangToggle, profile preference, and a future
 * createIntlMiddleware all read from one place.
 */

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * Strategy: `'as-needed'` once next-intl is fully wired — `/` stays
 * English, `/es/...` is Spanish. Until then the cookie + profile pref
 * are advisory only.
 */
export const LOCALE_PREFIX: "as-needed" | "always" | "never" = "as-needed";
