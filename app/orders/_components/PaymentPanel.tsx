"use client";

import TransactionUpload from "@/app/_components/payments/TransactionUpload";
import { usePaymentForm } from "../_hooks/usePaymentForm";
import { useI18n } from "@/components/i18n/I18nProvider";

export function PaymentPanel() {
  const { locale } = useI18n();
  const isAmharic = locale === "am";
  const {
    form,
    fieldErrors,
    submitMessage,
    isCardPayment,
    isPaymentReady,
    showError,
    setField,
    setVerificationState,
    setSubmitMessage,
    markTouched,
    handleCancel,
    handleConfirm,
    maskCardNumber,
    maskExpiration,
    normalizeCvv,
  } = usePaymentForm();

  return (
    <section className="p-5 xl:p-6">
      <h2 className="text-2xl font-semibold">{isAmharic ? "ክፍያ" : "Payment"}</h2>
      <p className="mt-1 text-sm text-gray-400">{isAmharic ? "3 የክፍያ ዘዴዎች አሉ" : "3 payment methods available"}</p>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-200">{isAmharic ? "የክፍያ ዘዴ" : "Payment Method"}</h3>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setField("paymentMethod", "card")}
            className={`${form.paymentMethod === "card" ? "app-bg-elevated text-gray-100" : "text-gray-300"} rounded-xl border border-white/10 px-3 py-3 text-xs`}
          >
            {isAmharic ? "ክሬዲት ካርድ" : "Credit Card"}
          </button>
          <button
            type="button"
            onClick={() => setField("paymentMethod", "paypal")}
            className={`${form.paymentMethod === "paypal" ? "app-bg-elevated text-gray-100" : "text-gray-300"} rounded-xl border border-white/10 px-3 py-3 text-xs`}
          >
            {isAmharic ? "ፔይፓል" : "Paypal"}
          </button>
          <button
            type="button"
            onClick={() => setField("paymentMethod", "cash")}
            className={`${form.paymentMethod === "cash" ? "app-bg-elevated text-gray-100" : "text-gray-300"} rounded-xl border border-white/10 px-3 py-3 text-xs`}
          >
            {isAmharic ? "ጥሬ" : "Cash"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="text-sm text-gray-300">
          {isAmharic ? "የካርድ ባለቤት ስም" : "Cardholder Name"}
          <input
            className={`app-bg-elevated mt-2 h-11 w-full rounded-xl border px-3 text-gray-100 ${showError("cardholderName") ? "border-red-400/80" : "border-white/10"}`}
            value={form.cardholderName}
            onChange={(event) => setField("cardholderName", event.target.value)}
            onBlur={() => markTouched("cardholderName")}
            placeholder={isAmharic ? "የካርድ ባለቤት ስም ያስገቡ" : "Enter cardholder name"}
            autoComplete="cc-name"
            disabled={!isCardPayment}
          />
          {showError("cardholderName") ? <span className="mt-1 block text-xs text-red-300">{fieldErrors.cardholderName}</span> : null}
        </label>

        <label className="text-sm text-gray-300">
          {isAmharic ? "የካርድ ቁጥር" : "Card Number"}
          <input
            className={`app-bg-elevated mt-2 h-11 w-full rounded-xl border px-3 text-gray-100 ${showError("cardNumber") ? "border-red-400/80" : "border-white/10"}`}
            value={form.cardNumber}
            onChange={(event) => setField("cardNumber", maskCardNumber(event.target.value))}
            onBlur={() => markTouched("cardNumber")}
            placeholder="0000 0000 0000 0000"
            inputMode="numeric"
            autoComplete="cc-number"
            disabled={!isCardPayment}
          />
          {showError("cardNumber") ? <span className="mt-1 block text-xs text-red-300">{fieldErrors.cardNumber}</span> : null}
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-gray-300">
            {isAmharic ? "የሚያበቃበት ቀን" : "Expiration Date"}
            <input
              className={`app-bg-elevated mt-2 h-11 w-full rounded-xl border px-3 text-gray-100 ${showError("expirationDate") ? "border-red-400/80" : "border-white/10"}`}
              value={form.expirationDate}
              onChange={(event) => setField("expirationDate", maskExpiration(event.target.value))}
              onBlur={() => markTouched("expirationDate")}
              placeholder="MM/YY"
              inputMode="numeric"
              autoComplete="cc-exp"
              disabled={!isCardPayment}
            />
            {showError("expirationDate") ? <span className="mt-1 block text-xs text-red-300">{fieldErrors.expirationDate}</span> : null}
          </label>
          <label className="text-sm text-gray-300">
            CVV
            <input
              className={`app-bg-elevated mt-2 h-11 w-full rounded-xl border px-3 text-gray-100 ${showError("cvv") ? "border-red-400/80" : "border-white/10"}`}
              value={form.cvv}
              onChange={(event) => setField("cvv", normalizeCvv(event.target.value))}
              onBlur={() => markTouched("cvv")}
              placeholder="***"
              type="password"
              inputMode="numeric"
              autoComplete="cc-csc"
              disabled={!isCardPayment}
            />
            {showError("cvv") ? <span className="mt-1 block text-xs text-red-300">{fieldErrors.cvv}</span> : null}
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-gray-300">
            {isAmharic ? "የትዕዛዝ አይነት" : "Order Type"}
            <select
              className="app-bg-elevated mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-gray-100"
              value={form.orderType}
              onChange={(event) => setField("orderType", event.target.value as "dine_in" | "to_go")}
            >
              <option value="dine_in">{isAmharic ? "በሬስቶራንት" : "Dine In"}</option>
              <option value="to_go">{isAmharic ? "ለመውሰድ" : "To Go"}</option>
            </select>
          </label>
          <label className="text-sm text-gray-300">
            {isAmharic ? "የጠረጴዛ ቁጥር" : "Table no."}
            <input
              className={`app-bg-elevated mt-2 h-11 w-full rounded-xl border px-3 text-gray-100 ${showError("tableNo") ? "border-red-400/80" : "border-white/10"}`}
              value={form.tableNo}
              onChange={(event) => setField("tableNo", event.target.value.replace(/\D/g, "").slice(0, 4))}
              onBlur={() => markTouched("tableNo")}
              placeholder={form.orderType === "dine_in" ? (isAmharic ? "የጠረጴዛ ቁጥር ያስገቡ" : "Enter table number") : isAmharic ? "ለመውሰድ አይደለም" : "N/A for To Go"}
              inputMode="numeric"
              disabled={form.orderType !== "dine_in"}
            />
            {showError("tableNo") ? <span className="mt-1 block text-xs text-red-300">{fieldErrors.tableNo}</span> : null}
          </label>
        </div>
      </div>

      <TransactionUpload
        onVerificationChange={(state) => {
          setVerificationState(state);
          setSubmitMessage(state.message ?? null);
        }}
      />

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleCancel}
          className="app-hover-accent-soft rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-gray-200"
        >
          {isAmharic ? "ሰርዝ" : "Cancel"}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isPaymentReady}
          className="app-bg-accent rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAmharic ? "ክፍያ አረጋግጥ" : "Confirm Payment"}
        </button>
      </div>

      {submitMessage ? <p className="mt-3 text-xs text-gray-300">{submitMessage}</p> : null}
    </section>
  );
}
