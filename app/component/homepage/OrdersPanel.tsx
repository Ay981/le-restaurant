import Image from "next/image";
import { FiTrash2 } from "react-icons/fi";
import type { OrderItem, OrderSummary } from "../../lib/data";

type OrdersPanelProps = {
  orderTypes: string[];
  orderItems: OrderItem[];
  orderSummary: OrderSummary;
};

export default function OrdersPanel({
  orderTypes,
  orderItems,
  orderSummary,
}: OrdersPanelProps) {
  return (
    <aside className="flex w-full flex-col border-t border-white/8 bg-[#1f1d2b] px-4 py-5 md:px-6 md:py-6 xl:w-98.75 xl:border-l xl:border-t-0">
      <div className="border-b border-white/8 pb-5">
        <h2 className="text-2xl font-semibold text-white">
          Orders {orderSummary.orderNumber}
        </h2>

        <div className="mt-5 flex flex-wrap gap-3">
          {orderTypes.map((type, index) => (
            <button
              key={type}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                index === 0
                  ? "border-[#ea7c69] bg-[#ea7c69] text-white"
                  : "border-white/10 bg-transparent text-[#ea7c69]"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-b border-white/8 pb-4 text-sm font-semibold text-gray-300">
        <span>Item</span>
        <div className="flex items-center gap-7 pr-1 sm:gap-11">
          <span>Qty</span>
          <span>Price</span>
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-5 overflow-y-auto pr-1">
        {orderItems.map((item) => (
          <div key={item.title}>
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
                  <p className="text-sm text-gray-400">{item.price}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-11 items-center justify-center rounded-lg border border-white/8 bg-[#2d303e] text-base text-gray-100">
                  {item.quantity}
                </div>
                <div className="w-14 text-right text-lg font-medium text-gray-100">
                  {item.total}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <input
                readOnly
                value={item.note}
                className="h-12 flex-1 rounded-lg border border-white/8 bg-[#2d303e] px-4 text-sm text-gray-300 outline-none placeholder:text-gray-500"
              />
              <button className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#ea7c69] text-[#ea7c69] transition-colors hover:bg-[#ea7c6910]">
                <FiTrash2 className="text-lg" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-white/8 pt-5 text-base text-gray-300">
        <div className="flex items-center justify-between">
          <span>Discount</span>
          <span>{orderSummary.discount}</span>
        </div>
        <div className="mt-4 flex items-center justify-between text-lg text-gray-200">
          <span>Sub total</span>
          <span>{orderSummary.subtotal}</span>
        </div>
      </div>

      <button className="mt-6 rounded-xl bg-[#ea7c69] px-6 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(234,124,105,0.35)]">
        Continue to Payment
      </button>
    </aside>
  );
}
