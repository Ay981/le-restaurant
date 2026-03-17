import type { OrderItem, OrderSummary } from "@/lib/data";
import OrderItemRow from "@/components/homepage/orders/OrderItemRow";
import OrderSummarySection from "@/components/homepage/orders/OrderSummary";
import OrderTypeTabs from "@/components/homepage/orders/OrderTypeTabs";

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
    <aside className="app-bg-panel flex w-full flex-col border-t border-white/8 px-4 py-5 md:px-6 md:py-6 xl:w-98.75 xl:border-l xl:border-t-0">
      <div className="border-b border-white/8 pb-5">
        <h2 className="text-2xl font-semibold text-white">
          Orders {orderSummary.orderNumber}
        </h2>

        <OrderTypeTabs orderTypes={orderTypes} />
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
          <OrderItemRow key={item.title} item={item} />
        ))}
      </div>

      <OrderSummarySection summary={orderSummary} />

      <button className="app-bg-accent mt-6 rounded-xl px-6 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(234,124,105,0.35)]">
        Continue to Payment
      </button>
    </aside>
  );
}
