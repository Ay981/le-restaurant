"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

type OrderTypeTabsProps = {
  orderTypes: string[];
  activeType: string;
  onChange: (type: string) => void;
};

export default function OrderTypeTabs({ orderTypes, activeType, onChange }: OrderTypeTabsProps) {
  const { locale } = useI18n();
  const isAmharic = locale === "am";

  const labelMap: Record<string, string> = {
    "Dine In": "በሬስቶራንት",
    "To Go": "ለመውሰድ",
    Delivery: "ዴሊቨሪ",
  };

  return (
    <div className="mt-5 flex flex-wrap gap-3">
      {orderTypes.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            activeType === type
              ? "app-border-accent app-bg-accent text-white"
              : "border-white/10 bg-transparent app-text-accent"
          }`}
        >
          {isAmharic ? (labelMap[type] ?? type) : type}
        </button>
      ))}
    </div>
  );
}
