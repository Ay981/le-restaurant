"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { defaultLocale, localeCookieName, type Locale } from "@/lib/i18n/config";

type LanguageSwitcherProps = {
  locale: Locale;
  label: string;
  englishLabel: string;
  amharicLabel: string;
};

export default function LanguageSwitcher({ locale, label, englishLabel, amharicLabel }: LanguageSwitcherProps) {
  const [selected, setSelected] = useState<Locale>(locale);
  const router = useRouter();

  useEffect(() => {
    setSelected(locale);
  }, [locale]);

  return (
    <label className="flex items-center gap-2 text-xs text-gray-300">
      <span>{label}</span>
      <select
        value={selected}
        onChange={(event) => {
          const nextLocale = (event.target.value === "am" ? "am" : defaultLocale) as Locale;
          setSelected(nextLocale);
          document.cookie = `${localeCookieName}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
          router.refresh();
        }}
        className="app-bg-elevated rounded-lg border border-white/15 px-2 py-1 text-xs text-gray-100 outline-none"
      >
        <option value="en">{englishLabel}</option>
        <option value="am">{amharicLabel}</option>
      </select>
    </label>
  );
}
