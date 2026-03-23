"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";

type PaymentMethod = "card" | "paypal" | "cash";
type OrderType = "dine_in" | "to_go";

type PaymentFormState = {
  paymentMethod: PaymentMethod;
  cardholderName: string;
  cardNumber: string;
  expirationDate: string;
  cvv: string;
  orderType: OrderType;
  tableNo: string;
};

type FieldKey = "cardholderName" | "cardNumber" | "expirationDate" | "cvv" | "tableNo";

type VerificationState = {
  verified: boolean;
  message?: string;
  transactionReference?: string | null;
  alreadyUsed?: boolean;
};

const INITIAL_FORM: PaymentFormState = {
  paymentMethod: "card",
  cardholderName: "",
  cardNumber: "",
  expirationDate: "",
  cvv: "",
  orderType: "dine_in",
  tableNo: "",
};

function maskCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function maskExpiration(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function normalizeCvv(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

function isExpirationValid(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})$/);
  if (!match) {
    return false;
  }

  const month = Number(match[1]);
  const year = Number(match[2]);

  if (month < 1 || month > 12) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) {
    return false;
  }

  if (year === currentYear && month < currentMonth) {
    return false;
  }

  return true;
}

export function usePaymentForm() {
  const { locale } = useI18n();
  const isAmharic = locale === "am";
  const [form, setForm] = useState<PaymentFormState>(INITIAL_FORM);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [verificationState, setVerificationState] = useState<VerificationState>({ verified: false });
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const isCardPayment = form.paymentMethod === "card";

  const fieldErrors = useMemo(() => {
    const errors: Partial<Record<FieldKey, string>> = {};

    if (isCardPayment) {
      if (!form.cardholderName.trim()) {
        errors.cardholderName = isAmharic ? "የካርድ ባለቤት ስም ያስፈልጋል።" : "Cardholder name is required.";
      }

      if (form.cardNumber.replace(/\s/g, "").length !== 16) {
        errors.cardNumber = isAmharic ? "የካርድ ቁጥር 16 አሃዝ መሆን አለበት።" : "Card number must be 16 digits.";
      }

      if (!isExpirationValid(form.expirationDate)) {
        errors.expirationDate = isAmharic
          ? "የሚያበቃበት ቀን የሚመጣ ወር (MM/YY) መሆን አለበት።"
          : "Expiration must be a valid future month (MM/YY).";
      }

      if (form.cvv.length < 3) {
        errors.cvv = isAmharic ? "CVV ቢያንስ 3 አሃዝ መሆን አለበት።" : "CVV must be at least 3 digits.";
      }
    }

    if (form.orderType === "dine_in" && !form.tableNo.trim()) {
      errors.tableNo = isAmharic ? "ለበሬስቶራንት ትዕዛዝ የጠረጴዛ ቁጥር ያስፈልጋል።" : "Table number is required for dine in orders.";
    }

    return errors;
  }, [form, isAmharic, isCardPayment]);

  const hasFormErrors = Object.keys(fieldErrors).length > 0;
  const isPaymentReady = verificationState.verified && !hasFormErrors;

  const showError = (field: FieldKey) => touched[field] && fieldErrors[field];

  const setField = <K extends keyof PaymentFormState>(key: K, value: PaymentFormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const markTouched = (field: FieldKey) => {
    setTouched((previous) => ({ ...previous, [field]: true }));
  };

  const handleCancel = () => {
    setForm(INITIAL_FORM);
    setTouched({});
    setVerificationState({ verified: false });
    setSubmitMessage(null);
  };

  const handleConfirm = () => {
    setTouched({
      cardholderName: true,
      cardNumber: true,
      expirationDate: true,
      cvv: true,
      tableNo: true,
    });

    if (!verificationState.verified) {
      setSubmitMessage(isAmharic ? "ክፍያ ከማረጋገጥዎ በፊት ደረሰኝን ያረጋግጡ።" : "Verify a receipt before confirming payment.");
      return;
    }

    if (hasFormErrors) {
      setSubmitMessage(isAmharic ? "እባክዎ የተለዩትን የክፍያ መስኮች ያስተካክሉ።" : "Please correct the highlighted payment fields.");
      return;
    }

    setSubmitMessage(isAmharic ? "የክፍያ ዝርዝሮች ትክክል ናቸው እና ለማረጋገጫ ዝግጁ ናቸው።" : "Payment details look valid and are ready for confirmation.");
  };

  return {
    form,
    fieldErrors,
    verificationState,
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
  };
}
