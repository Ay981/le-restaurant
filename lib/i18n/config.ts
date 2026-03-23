export const locales = ["en", "am"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "am";
}

export function resolveLocale(value: string | null | undefined): Locale {
  if (isLocale(value)) {
    return value;
  }

  return defaultLocale;
}
