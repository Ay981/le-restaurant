import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "My Restaurant v2",
    template: "%s | My Restaurant v2",
  },
  description:
    "Discover fresh dishes, get AI-powered recommendations, place orders online, upload payment receipts, and track every order live from kitchen to delivery.",
  applicationName: "My Restaurant v2",
  keywords: [
    "restaurant",
    "online food ordering",
    "menu",
    "AI dish recommendations",
    "delivery tracking",
    "restaurant dashboard",
    "payment receipt verification",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "My Restaurant v2 | Smart Ordering & Live Tracking",
    description:
      "Browse the menu, get personalized dish recommendations, place orders, verify payments, and track status updates in real time.",
    url: "/",
    siteName: "My Restaurant v2",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Restaurant v2 | Smart Ordering & Live Tracking",
    description:
      "AI-powered food recommendations, seamless online ordering, payment verification, and live order tracking.",
  },
  category: "food",
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
          <Toaster richColors closeButton position="top-right" />
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
