"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "@/lib/i18n/config";
import { t, type TranslationNamespace } from "@/lib/i18n/messages";

type I18nContextValue = {
  locale: Locale;
  translate: (namespace: TranslationNamespace, key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  locale: Locale;
  children: React.ReactNode;
};

export function I18nProvider({ locale, children }: I18nProviderProps) {
  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      translate: (namespace, key) => t(locale, namespace, key),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider.");
  }

  return context;
}
