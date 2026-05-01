/**
 * Locale config — PRD §6.5 (Localisation).
 * REQ-NFR-11: All UI strings live in th.json / en.json, no hardcoded display strings.
 */
export const locales = ["th", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
