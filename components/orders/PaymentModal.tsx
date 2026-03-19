"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import TransactionUpload from "@/components/orders/TransactionUpload";
import { formatCurrency } from "@/lib/currency";
import type { OrderItem, OrderSummary } from "@/lib/data";

type PaymentModalProps = {
  orderItems: OrderItem[];
  orderSummary: OrderSummary;
  onClose: () => void;
};

type PaymentMethod = "bankTransfer" | "cash" | "teleBirr" | "mpesa";

export default function PaymentModal({
  orderItems,
  orderSummary,
  onClose,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bankTransfer");

  const paymentOptions: Array<{ id: PaymentMethod; label: string; disabled?: boolean }> = [
    { id: "bankTransfer", label: "Bank Transfer" },
    { id: "cash", label: "Cash" },
    { id: "teleBirr", label: "Tele Birr", disabled: true },
    { id: "mpesa", label: "M-Pesa", disabled: true },
  ];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/65 px-4 py-4 backdrop-blur-[2px] md:py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="mx-auto flex min-h-full items-start justify-center py-2 md:items-center">
        <div className="app-bg-panel grid w-full max-w-6xl overflow-y-auto rounded-2xl border border-white/10 max-h-[calc(100dvh-2rem)] xl:grid-cols-[0.95fr_1.05fr] xl:overflow-hidden">
        <section className="border-b border-white/10 p-5 xl:overflow-y-auto xl:border-b-0 xl:border-r xl:border-white/10 xl:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-3xl font-semibold text-white">Confirmation</h2>
              <p className="mt-1 text-sm text-gray-400">Orders {orderSummary.orderNumber}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="app-bg-accent h-10 w-10 rounded-xl text-xl leading-none text-white"
              aria-label="Close payment modal"
            >
              +
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {orderItems.map((item) => (
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
                  <div className="app-bg-elevated flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-xs text-gray-100">
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
            ))}
          </div>

          <div className="mt-6 border-t border-white/10 pt-4 text-sm text-gray-300">
            <div className="flex items-center justify-between">
              <span>Discount</span>
              <span>{formatCurrency(orderSummary.discount)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-base text-gray-100">
              <span>Sub total</span>
              <span>{formatCurrency(orderSummary.subtotal)}</span>
            </div>
          </div>
        </section>

        <section className="p-5 xl:overflow-y-auto xl:p-6">
          <h2 className="text-3xl font-semibold text-white">Payment</h2>
          <p className="mt-1 text-sm text-gray-400">4 payment methods available</p>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-200">Payment Method</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
              {paymentOptions.map((option) => {
                const isActive = paymentMethod === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={option.disabled}
                    aria-disabled={option.disabled}
                    onClick={() => {
                      if (!option.disabled) {
                        setPaymentMethod(option.id);
                      }
                    }}
                    className={[
                      "rounded-xl border px-3 py-3 text-xs transition",
                      option.disabled
                        ? "cursor-not-allowed border-white/10 text-gray-500 opacity-60"
                        : isActive
                          ? "app-bg-elevated border-white/15 text-gray-100"
                          : "border-white/10 text-gray-300 hover:border-white/20",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-gray-300">
                Order Type
                <input className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100" defaultValue="Dine In" />
              </label>
              <label className="text-sm text-gray-300">
                Table no.
                <input className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100" defaultValue="140" />
              </label>
            </div>
          </div>

          {paymentMethod === "bankTransfer" ? <TransactionUpload /> : null}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="app-hover-accent-soft rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-gray-200"
            >
              Cancel
            </button>
            <button type="button" className="app-bg-accent rounded-xl px-4 py-3 text-sm font-semibold text-white">
              Confirm Payment
            </button>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}
