import Image from "next/image";
import { FiTrash2 } from "react-icons/fi";
import { formatCurrency } from "@/lib/currency";
import type { OrderItem } from "@/lib/data";

type OrderItemRowProps = {
  item: OrderItem;
};

export default function OrderItemRow({ item }: OrderItemRowProps) {
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
          <div className="app-bg-elevated flex h-10 w-11 items-center justify-center rounded-lg border border-white/8 text-base text-gray-100">
            {item.quantity}
          </div>
          <div className="w-14 text-right text-lg font-medium text-gray-100">
            {formatCurrency(item.total)}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <input
          readOnly
          value={item.note}
          className="app-bg-elevated h-12 flex-1 rounded-lg border border-white/8 px-4 text-sm text-gray-300 outline-none placeholder:text-gray-500"
        />
        <button className="app-border-accent app-text-accent app-hover-accent-soft flex h-12 w-12 items-center justify-center rounded-lg border transition-colors">
          <FiTrash2 className="text-lg" />
        </button>
      </div>
    </div>
  );
}
