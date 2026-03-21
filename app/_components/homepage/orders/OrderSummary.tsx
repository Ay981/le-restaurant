import { formatCurrency } from "@/lib/currency";
import type { OrderSummary as OrderSummaryData } from "@/lib/data";

type OrderSummaryProps = {
  summary: OrderSummaryData;
};

export default function OrderSummary({ summary }: OrderSummaryProps) {
  return (
    <div className="mt-5 border-t border-white/8 pt-5 text-base text-gray-300">
      <div className="flex items-center justify-between">
        <span>Discount</span>
        <span>{formatCurrency(summary.discount)}</span>
      </div>
      <div className="mt-4 flex items-center justify-between text-lg text-gray-200">
        <span>Sub total</span>
        <span>{formatCurrency(summary.subtotal)}</span>
      </div>
    </div>
  );
}
