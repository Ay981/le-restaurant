import { formatCurrency } from "@/lib/currency";
import type { OrderSummary as OrderSummaryData } from "@/lib/data";
import { useI18n } from "@/components/i18n/I18nProvider";

type OrderSummaryProps = {
  summary: OrderSummaryData;
};

export default function OrderSummary({ summary }: OrderSummaryProps) {
  const { locale } = useI18n();
  const isAmharic = locale === "am";

  return (
    <div className="mt-5 border-t border-white/8 pt-5 text-base text-gray-300">
      <div className="flex items-center justify-between">
        <span>{isAmharic ? "ቅናሽ" : "Discount"}</span>
        <span>{formatCurrency(summary.discount)}</span>
      </div>
      <div className="mt-4 flex items-center justify-between text-lg text-gray-200">
        <span>{isAmharic ? "ንዑስ ጠቅላላ" : "Sub total"}</span>
        <span>{formatCurrency(summary.subtotal)}</span>
      </div>
    </div>
  );
}
