import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import RouteLanguageSwitcher from "@/components/i18n/RouteLanguageSwitcher";
import MobileHamburgerSidebar from "@/components/navigation/MobileHamburgerSidebar";
import { t } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Restaurant",
  description: "Restaurant dashboard for menu and order management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} app-bg-main text-white antialiased`}
      >
        <I18nProvider locale={locale}>
          <MobileHamburgerSidebar
            locale={locale}
            languageLabel={t(locale, "common", "languageLabel")}
            englishLabel={t(locale, "common", "languageEnglish")}
            amharicLabel={t(locale, "common", "languageAmharic")}
          />
          <div className="h-14 md:hidden" aria-hidden="true" />
          {children}
          <RouteLanguageSwitcher
            locale={locale}
            label={t(locale, "common", "languageLabel")}
            englishLabel={t(locale, "common", "languageEnglish")}
            amharicLabel={t(locale, "common", "languageAmharic")}
          />
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
