"use client";

import Image from "next/image";
import { FiTrash2 } from "react-icons/fi";
import { formatCurrency } from "@/lib/currency";
import type { OrderItem } from "@/lib/data";
import { useI18n } from "@/components/i18n/I18nProvider";

type OrderItemRowProps = {
  item: OrderItem;
  onRemove: () => void;
  onNoteChange: (note: string) => void;
  onDecrease: () => void;
  onIncrease: () => void;
};

export default function OrderItemRow({
  item,
  onRemove,
  onNoteChange,
  onDecrease,
  onIncrease,
}: OrderItemRowProps) {
  const { locale } = useI18n();
  const isAmharic = locale === "am";

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Image
            src={item.image}
            alt={item.title}
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-cover"
          />

          <div className="min-w-0">
            <p className="truncate text-base font-medium text-gray-100">
              {item.shortTitle}
            </p>
            <p className="text-sm text-gray-400">{formatCurrency(item.price)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="app-bg-elevated flex h-10 items-center rounded-lg border border-white/8 text-base text-gray-100">
            <button
              type="button"
              onClick={onDecrease}
              className="h-10 w-8 text-lg text-gray-300 transition-colors hover:text-white"
              aria-label={isAmharic ? `${item.title} ብዛት ቀንስ` : `Decrease quantity for ${item.title}`}
            >
              -
            </button>
            <span className="w-8 text-center">{item.quantity}</span>
            <button
              type="button"
              onClick={onIncrease}
              className="h-10 w-8 text-lg text-gray-300 transition-colors hover:text-white"
              aria-label={isAmharic ? `${item.title} ብዛት ጨምር` : `Increase quantity for ${item.title}`}
            >
              +
            </button>
          </div>
          <div className="w-14 text-right text-lg font-medium text-gray-100">
            {formatCurrency(item.total)}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <input
          type="text"
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder={isAmharic ? "የትዕዛዝ ማስታወሻ..." : "Order Note..."}
          className="app-bg-elevated h-12 flex-1 rounded-lg border border-white/8 px-4 text-sm text-gray-300 outline-none"
        />
        <button
          type="button"
          onClick={onRemove}
          className="app-border-accent app-text-accent app-hover-accent-soft flex h-12 w-12 items-center justify-center rounded-lg border transition-colors"
        >
          <FiTrash2 className="text-lg" />
        </button>
      </div>
    </div>
  );
}
