"use client";

import { useState } from "react";
import type { OrderItem, OrderSummary } from "@/lib/data";
import OrderItemRow from "@/app/_components/homepage/orders/OrderItemRow";
import OrderSummarySection from "@/app/_components/homepage/orders/OrderSummary";
import OrderTypeTabs from "@/app/_components/homepage/orders/OrderTypeTabs";
import PaymentModal from "@/app/_components/payments/PaymentModal";
import { useI18n } from "@/components/i18n/I18nProvider";

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

function isDeliveryType(orderType: string) {
  const normalized = orderType.trim().toLowerCase();
  return normalized === "delivery" || normalized === "ዴሊቨሪ";
}

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
  const { locale } = useI18n();
  const isAmharic = locale === "am";
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [locationError, setLocationError] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const hasItems = orderItems.length > 0;
  const selectedIsDelivery = isDeliveryType(selectedOrderType);

  const handleUseCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationError(isAmharic ? "በዚህ መሣሪያ ላይ አካባቢ መለያ አይደገፍም።" : "Location is not supported on this device.");
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
        setLocationError(isAmharic ? "የአሁኑን አካባቢዎን ማግኘት አልተቻለም።" : "Unable to get your current location.");
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
            {isAmharic ? "ትዕዛዞች" : "Orders"}
            {orderSummary.orderNumber ? ` ${orderSummary.orderNumber}` : ""}
          </h2>

          <OrderTypeTabs
            orderTypes={orderTypes}
            activeType={selectedOrderType}
            onChange={onOrderTypeChange}
          />
        </div>

        <div className="mt-6 flex items-center justify-between border-b border-white/8 pb-4 text-sm font-semibold text-gray-300">
          <span>{isAmharic ? "ንጥል" : "Item"}</span>
          <div className="flex items-center gap-7 pr-1 sm:gap-11">
            <span>{isAmharic ? "ብዛት" : "Qty"}</span>
            <span>{isAmharic ? "ዋጋ" : "Price"}</span>
          </div>
        </div>

        {selectedIsDelivery ? (
          <div className="mt-4 rounded-xl border border-white/8 p-3">
            <label className="text-sm font-medium text-gray-200" htmlFor="delivery-customer-name">
              {isAmharic ? "የደንበኛ ስም" : "Customer Name"}
            </label>
            <input
              id="delivery-customer-name"
              type="text"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder={isAmharic ? "የደንበኛ ስም ያስገቡ" : "Enter customer name"}
              className="app-bg-elevated mt-2 h-11 w-full rounded-lg border border-white/10 px-3 text-sm text-gray-100 outline-none placeholder:text-gray-500"
            />

            <label className="mt-3 block text-sm font-medium text-gray-200" htmlFor="delivery-customer-phone">
              {isAmharic ? "የደንበኛ ስልክ" : "Customer Phone"}
            </label>
            <input
              id="delivery-customer-phone"
              type="tel"
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              placeholder={isAmharic ? "የደንበኛ ስልክ ያስገቡ" : "Enter customer phone"}
              className="app-bg-elevated mt-2 h-11 w-full rounded-lg border border-white/10 px-3 text-sm text-gray-100 outline-none placeholder:text-gray-500"
            />

            <label className="text-sm font-medium text-gray-200" htmlFor="delivery-destination">
              {isAmharic ? "መድረሻ" : "Destination"}
            </label>
            <input
              id="delivery-destination"
              type="text"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder={isAmharic ? "የመድረሻ አድራሻ ያስገቡ" : "Enter destination address"}
              className="app-bg-elevated mt-2 h-11 w-full rounded-lg border border-white/10 px-3 text-sm text-gray-100 outline-none placeholder:text-gray-500"
            />
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="app-hover-accent-soft mt-3 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLocating ? (isAmharic ? "አካባቢ በመፈለግ ላይ..." : "Getting location...") : isAmharic ? "የእኔን አካባቢ ተጠቀም" : "Use my location"}
            </button>
            {locationError ? <p className="mt-2 text-xs text-red-300">{locationError}</p> : null}
          </div>
        ) : null}

        <div className="mt-4 flex-1 min-h-0 space-y-5 overflow-y-auto pr-1">
          {orderItems.length === 0 ? (
            <p className="pt-2 text-sm text-gray-400">{isAmharic ? "እስካሁን ንጥል የለም። ወደ ትዕዛዝዎ ለመጨመር ምግብ ይምረጡ።" : "No items yet. Select a dish to add it to your order."}</p>
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
            {isAmharic ? "ወደ ክፍያ ቀጥል" : "Continue to Payment"}
          </button>
        </div>
      </aside>

      {isPaymentOpen && (
        <PaymentModal
          orderItems={orderItems}
          orderSummary={orderSummary}
          selectedOrderType={selectedOrderType}
          deliveryDetails={{
            destination,
            customerName,
            customerPhone,
          }}
          onClose={() => setIsPaymentOpen(false)}
        />
      )}
    </>
  );
}
