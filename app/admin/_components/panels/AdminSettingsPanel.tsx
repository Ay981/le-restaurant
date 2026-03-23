"use client";

import { settingsNavItems } from "../types";
import { useI18n } from "@/components/i18n/I18nProvider";

export default function AdminSettingsPanel() {
  const { locale } = useI18n();
  const isAmharic = locale === "am";

  const translated = {
    Appearance: "ቅርጽ",
    "Your Restaurant": "ሬስቶራንትዎ",
    "Products Management": "የምርቶች አስተዳደር",
    Notifications: "ማሳወቂያዎች",
    Security: "ደህንነት",
    About: "ስለ መተግበሪያው",
    "Dark and Light mode, Font size": "ጨለማ/ብርሃን ሁኔታ፣ የፊደል መጠን",
    "Business profile and info": "የንግድ መገለጫ እና መረጃ",
    "Manage your products and pricing": "ምርቶችን እና ዋጋን ያስተዳድሩ",
    "Customize your notifications": "ማሳወቂያዎችዎን ያብጁ",
    "Configure password and PIN": "የይለፍ ቃል እና PIN ያቀናብሩ",
    "Find out more about this app": "ስለዚህ መተግበሪያ ተጨማሪ ይወቁ",
  } as const;

  return (
    <section className="app-bg-panel rounded-2xl p-4">
      <h1 className="text-3xl font-semibold">{isAmharic ? "ቅንብሮች" : "Settings"}</h1>
      <div className="mt-4 space-y-2">
        {settingsNavItems.map((item) => {
          const isActive = item.label === "Products Management";

          return (
            <div
              key={item.label}
              className={`rounded-xl border px-3 py-3 ${
                isActive ? "app-bg-elevated app-border-accent border" : "border-white/10 bg-transparent"
              }`}
            >
              <p className={`text-sm font-medium ${isActive ? "app-text-accent" : "text-gray-200"}`}>
                {isAmharic ? translated[item.label] : item.label}
              </p>
              <p className="mt-1 text-xs text-gray-400">{isAmharic ? translated[item.description] : item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
