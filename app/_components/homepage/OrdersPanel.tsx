"use client";

import { useState } from "react";
import type { OrderItem, OrderSummary } from "@/lib/data";
import OrderItemRow from "@/app/_components/homepage/orders/OrderItemRow";
import OrderSummarySection from "@/app/_components/homepage/orders/OrderSummary";
import OrderTypeTabs from "@/app/_components/homepage/orders/OrderTypeTabs";
import PaymentModal from "@/app/_components/payments/PaymentModal";

type OrdersPanelProps = {
  orderTypes: string[];
  selectedOrderType: string;
  orderItems: OrderItem[];
  orderSummary: OrderSummary;
  onRemoveItem: (title: string) => void;
  onNoteChange: (title: string, note: string) => void;
  onQuantityChange: (title: string, delta: number) => void;
  onOrderTypeChange: (type: string) => void;
};

export default function OrdersPanel({
  orderTypes,
  selectedOrderType,
  orderItems,
  orderSummary,
  onRemoveItem,
  onNoteChange,
  onQuantityChange,
  onOrderTypeChange,
}: OrdersPanelProps) {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [locationError, setLocationError] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const hasItems = orderItems.length > 0;

  const handleUseCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationError("Location is not supported on this device.");
      return;
    }

    setIsLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setDestination(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
        setIsLocating(false);
      },
      () => {
        setLocationError("Unable to get your current location.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <>
      <aside className="app-bg-panel flex w-full flex-col border-t border-white/8 px-4 py-5 md:px-6 md:py-6 xl:h-screen xl:w-98.75 xl:border-l xl:border-t-0">
        <div className="border-b border-white/8 pb-5">
          <h2 className="text-2xl font-semibold text-white">
            Orders {orderSummary.orderNumber}
          </h2>

          <OrderTypeTabs
            orderTypes={orderTypes}
            activeType={selectedOrderType}
            onChange={onOrderTypeChange}
          />
        </div>

        <div className="mt-6 flex items-center justify-between border-b border-white/8 pb-4 text-sm font-semibold text-gray-300">
          <span>Item</span>
          <div className="flex items-center gap-7 pr-1 sm:gap-11">
            <span>Qty</span>
            <span>Price</span>
          </div>
        </div>

        {selectedOrderType === "Delivery" ? (
          <div className="mt-4 rounded-xl border border-white/8 p-3">
            <label className="text-sm font-medium text-gray-200" htmlFor="delivery-destination">
              Destination
            </label>
            <input
              id="delivery-destination"
              type="text"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Enter destination address"
              className="app-bg-elevated mt-2 h-11 w-full rounded-lg border border-white/10 px-3 text-sm text-gray-100 outline-none placeholder:text-gray-500"
            />
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="app-hover-accent-soft mt-3 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLocating ? "Getting location..." : "Use my location"}
            </button>
            {locationError ? <p className="mt-2 text-xs text-red-300">{locationError}</p> : null}
          </div>
        ) : null}

        <div className="mt-4 flex-1 min-h-0 space-y-5 overflow-y-auto pr-1">
          {orderItems.length === 0 ? (
            <p className="pt-2 text-sm text-gray-400">No items yet. Select a dish to add it to your order.</p>
          ) : (
            orderItems.map((item) => (
              <OrderItemRow
                key={item.title}
                item={item}
                onRemove={() => onRemoveItem(item.title)}
                onNoteChange={(note) => onNoteChange(item.title, note)}
                onDecrease={() => onQuantityChange(item.title, -1)}
                onIncrease={() => onQuantityChange(item.title, 1)}
              />
            ))
          )}
        </div>

        <div className="app-bg-panel sticky bottom-0 border-t border-white/8 pt-4">
          <OrderSummarySection summary={orderSummary} />

          <button
            type="button"
            disabled={!hasItems}
            onClick={() => {
              if (hasItems) {
                setIsPaymentOpen(true);
              }
            }}
            className="app-bg-accent mt-5 w-full rounded-xl px-6 py-4 text-center text-base font-semibold text-white shadow-[0_12px_30px_rgba(234,124,105,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to Payment
          </button>
        </div>
      </aside>

      {isPaymentOpen && (
        <PaymentModal
          orderItems={orderItems}
          orderSummary={orderSummary}
          selectedOrderType={selectedOrderType}
          onClose={() => setIsPaymentOpen(false)}
        />
      )}
    </>
  );
}
