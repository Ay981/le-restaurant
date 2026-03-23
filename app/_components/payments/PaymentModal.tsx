"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import TransactionUpload from "@/app/_components/payments/TransactionUpload";
import { formatCurrency } from "@/lib/currency";
import type { OrderItem, OrderSummary } from "@/lib/data";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n/I18nProvider";

type PaymentModalProps = {
  orderItems: OrderItem[];
  orderSummary: OrderSummary;
  selectedOrderType: string;
  deliveryDetails: {
    destination: string;
    customerName: string;
    customerPhone: string;
  };
  onClose: () => void;
};

type PaymentMethod = "bankTransfer" | "cash" | "teleBirr" | "mpesa";

export default function PaymentModal({
  orderItems,
  orderSummary,
  selectedOrderType,
  deliveryDetails,
  onClose,
}: PaymentModalProps) {
  const { locale } = useI18n();
  const isAmharic = locale === "am";
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bankTransfer");
  const [receiptVerified, setReceiptVerified] = useState(false);
  const [receiptMessage, setReceiptMessage] = useState(isAmharic ? "ደረሰኝ ይጫኑ እና ያረጋግጡ።" : "Upload a receipt and verify it.");
  const [receiptReference, setReceiptReference] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

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

  const handleConfirmPayment = async () => {
    if (paymentMethod === "bankTransfer" && !receiptVerified) {
      return;
    }

    const isDelivery = selectedOrderType.trim().toLowerCase() === "delivery";
    if (
      isDelivery &&
      (!deliveryDetails.destination.trim() || !deliveryDetails.customerName.trim() || !deliveryDetails.customerPhone.trim())
    ) {
      setSubmitError(
        isAmharic
          ? "የዴሊቨሪ ትዕዛዝ መድረሻ፣ የደንበኛ ስም እና ስልክ ይፈልጋል።"
          : "Delivery orders require destination, customer name, and customer phone.",
      );
      return;
    }

    setSubmitError(null);
    setSubmitMessage(null);
    setIsSavingOrder(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          selectedOrderType,
          discount: orderSummary.discount,
          items: orderItems.map((item) => ({
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            note: item.note,
          })),
          deliveryDetails,
        }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? (isAmharic ? "የትዕዛዝ መዝገብ መፍጠር አልተቻለም።" : "Could not create order record."));
      }

      setSubmitMessage(
        session?.user?.id
          ? isAmharic
            ? "ክፍያው ተረጋግጧል። ይህ ትዕዛዝ ወደ ታሪክዎ ታክሏል።"
            : "Payment confirmed. This order has been added to your history."
          : isAmharic
            ? "ክፍያው ተረጋግጧል። በሚቀጥለው ጊዜ በመግባት የትዕዛዝ ታሪክና የግል ምክሮች ያግኙ።"
            : "Payment confirmed. Sign in next time to unlock order history and personalized suggestions.",
      );

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : isAmharic ? "ክፍያን ማረጋገጥ አልተቻለም።" : "Failed to confirm payment.");
    } finally {
      setIsSavingOrder(false);
    }
  };

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
        <div className="app-bg-panel grid h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] w-full max-w-6xl min-h-0 overflow-hidden rounded-2xl border border-white/10 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="min-h-0 overflow-y-auto overscroll-y-contain border-b border-white/10 p-5 xl:border-b-0 xl:border-r xl:border-white/10 xl:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-3xl font-semibold text-white">{isAmharic ? "ማረጋገጫ" : "Confirmation"}</h2>
              <p className="mt-1 text-sm text-gray-400">{isAmharic ? "ትዕዛዝ" : "Orders"} {orderSummary.orderNumber}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="app-bg-accent h-10 w-10 rounded-xl text-xl leading-none text-white"
              aria-label={isAmharic ? "የክፍያ ሞዳልን ዝጋ" : "Close payment modal"}
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
              <span>{isAmharic ? "ቅናሽ" : "Discount"}</span>
              <span>{formatCurrency(orderSummary.discount)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-base text-gray-100">
              <span>{isAmharic ? "ንዑስ ጠቅላላ" : "Sub total"}</span>
              <span>{formatCurrency(orderSummary.subtotal)}</span>
            </div>
          </div>
        </section>

        <section className="min-h-0 overflow-y-auto overscroll-y-contain p-5 xl:p-6">
          <h2 className="text-3xl font-semibold text-white">{isAmharic ? "ክፍያ" : "Payment"}</h2>
          <p className="mt-1 text-sm text-gray-400">{isAmharic ? "4 የክፍያ ዘዴዎች አሉ" : "4 payment methods available"}</p>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-200">{isAmharic ? "የክፍያ ዘዴ" : "Payment Method"}</h3>
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
                        if (option.id !== "bankTransfer") {
                          setReceiptVerified(true);
                          setReceiptMessage(isAmharic ? "ማረጋገጫ ለባንክ ዝውውር ብቻ ያስፈልጋል።" : "Verification is only required for bank transfer.");
                          setReceiptReference(null);
                        } else {
                          setReceiptVerified(false);
                          setReceiptMessage(isAmharic ? "ደረሰኝ ይጫኑ እና ያረጋግጡ።" : "Upload a receipt and verify it.");
                          setReceiptReference(null);
                        }
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
                    {isAmharic
                      ? option.id === "bankTransfer"
                        ? "የባንክ ዝውውር"
                        : option.id === "cash"
                          ? "ጥሬ ገንዘብ"
                          : option.id === "teleBirr"
                            ? "ቴሌ ብር"
                            : "ኤም-ፔሳ"
                      : option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-gray-300">
                {isAmharic ? "የትዕዛዝ አይነት" : "Order Type"}
                <input
                  readOnly
                  className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100"
                  value={selectedOrderType}
                />
              </label>
              <label className="text-sm text-gray-300">
                {isAmharic ? "የጠረጴዛ ቁጥር" : "Table no."}
                <input className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100" defaultValue="140" />
              </label>
            </div>
          </div>

          {paymentMethod === "bankTransfer" ? (
            <>
              <TransactionUpload
                orderNumber={orderSummary.orderNumber}
                expectedAmount={orderSummary.subtotal}
                onVerificationChange={(verification) => {
                  setReceiptVerified(verification.verified);
                  setReceiptMessage(verification.message ?? (isAmharic ? "የማረጋገጫ ሁኔታ ተዘምኗል።" : "Verification state updated."));
                  setReceiptReference(verification.transactionReference ?? null);
                }}
              />
              <p className="mt-3 text-xs text-gray-400">
                {receiptMessage}
                {receiptReference ? ` (${receiptReference})` : ""}
              </p>
            </>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isSavingOrder}
              onClick={onClose}
              className="app-hover-accent-soft rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAmharic ? "ሰርዝ" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={() => {
                void handleConfirmPayment();
              }}
              disabled={(paymentMethod === "bankTransfer" && !receiptVerified) || isSavingOrder}
              className="app-bg-accent rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingOrder ? (isAmharic ? "በማረጋገጥ ላይ..." : "Confirming...") : isAmharic ? "ክፍያ አረጋግጥ" : "Confirm Payment"}
            </button>
          </div>

          {submitError ? <p className="mt-3 text-xs text-red-300">{submitError}</p> : null}
          {submitMessage ? <p className="mt-3 text-xs text-green-300">{submitMessage}</p> : null}
        </section>
        </div>
      </div>
    </div>
  );
}
