import { cookies, headers } from "next/headers";
import { defaultLocale, localeCookieName, resolveLocale, type Locale } from "./config";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const localeFromCookie = cookieStore.get(localeCookieName)?.value;
  if (localeFromCookie) {
    return resolveLocale(localeFromCookie);
  }

  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") ?? "";
  const preferred = acceptLanguage.split(",")[0]?.trim().toLowerCase() ?? "";
  if (preferred.startsWith("am")) {
    return "am";
  }

  return defaultLocale;
}
