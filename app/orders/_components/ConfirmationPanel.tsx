"use client";

import Image from "next/image";
import { formatCurrency } from "@/lib/currency";
import type { OrderItem, OrderSummary } from "@/lib/data";
import { useI18n } from "@/components/i18n/I18nProvider";

type ConfirmationPanelProps = {
  orderItems?: OrderItem[];
  orderSummary?: OrderSummary;
};

const DEFAULT_SUMMARY: OrderSummary = {
  orderNumber: "",
  discount: 0,
  subtotal: 0,
};

export function ConfirmationPanel({ orderItems = [], orderSummary = DEFAULT_SUMMARY }: ConfirmationPanelProps) {
  const { locale } = useI18n();
  const isAmharic = locale === "am";

  return (
    <section className="border-b border-white/10 p-5 xl:border-b-0 xl:border-r xl:border-white/10 xl:p-6">
      <h2 className="text-2xl font-semibold">{isAmharic ? "ማረጋገጫ" : "Confirmation"}</h2>
      {orderSummary.orderNumber ? (
        <p className="mt-1 text-sm text-gray-400">{isAmharic ? "ትዕዛዝ" : "Orders"} {orderSummary.orderNumber}</p>
      ) : null}

      <div className="mt-6 space-y-4">
        {orderItems.length === 0 ? (
          <p className="text-sm text-gray-400">{isAmharic ? "እስካሁን የሚታይ ትዕዛዝ የለም።" : "No order items yet."}</p>
        ) : (
          orderItems.map((item) => (
            <div key={item.title} className="border-b border-white/10 pb-4 last:border-b-0">
              <div className="flex items-center gap-3">
                <Image
                  src={item.image}
                  alt={item.title}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-100">{item.shortTitle}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(item.price)}</p>
                </div>
                <div className="app-bg-elevated flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-xs">
                  {item.quantity}
                </div>
                <p className="w-14 text-right text-sm text-gray-100">{formatCurrency(item.total)}</p>
              </div>
              <input
                readOnly
                value={item.note}
                className="app-bg-elevated mt-3 h-9 w-full rounded-lg border border-white/10 px-3 text-xs text-gray-300"
              />
            </div>
          ))
        )}
      </div>

      <div className="mt-6 border-t border-white/10 pt-4 text-sm text-gray-300">
        <div className="flex items-center justify-between">
          <span>{isAmharic ? "ቅናሽ" : "Discount"}</span>
          <span>{formatCurrency(orderSummary.discount)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-base text-gray-100">
          <span>{isAmharic ? "ንዑስ ጠቅላላ" : "Sub total"}</span>
          <span>{formatCurrency(orderSummary.subtotal)}</span>
        </div>
      </div>
    </section>
  );
}
