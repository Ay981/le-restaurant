"use client";

import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import LanguageSwitcher from "./LanguageSwitcher";

type RouteLanguageSwitcherProps = {
  locale: Locale;
  label: string;
  englishLabel: string;
  amharicLabel: string;
};

const standaloneRoutes = new Set(["/", "/about-us", "/contact-us", "/sign-in", "/create-account"]);

export default function RouteLanguageSwitcher({ locale, label, englishLabel, amharicLabel }: RouteLanguageSwitcherProps) {
  const pathname = usePathname();

  if (!pathname || !standaloneRoutes.has(pathname)) {
    return null;
  }

  return (
    <div className="fixed right-3 top-3 z-70 md:right-4 md:top-4">
      <LanguageSwitcher locale={locale} label={label} englishLabel={englishLabel} amharicLabel={amharicLabel} />
    </div>
  );
}
