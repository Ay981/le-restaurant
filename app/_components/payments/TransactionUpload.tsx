"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type VerificationState = {
  verified: boolean;
  message?: string;
  transactionReference?: string | null;
  alreadyUsed?: boolean;
};

type TransactionUploadProps = {
  orderNumber?: string;
  expectedAmount?: number;
  onVerificationChange?: (state: VerificationState) => void;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** index;
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[index]}`;
}

export default function TransactionUpload({
  orderNumber = "UNKNOWN",
  expectedAmount = 0,
  onVerificationChange = () => {},
}: TransactionUploadProps) {
  const { locale } = useI18n();
  const isAmharic = locale === "am";
  const [file, setFile] = useState<File | null>(null);
  const [accountSuffix, setAccountSuffix] = useState("");
  const [manualReference, setManualReference] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [verifiedReference, setVerifiedReference] = useState<string | null>(null);

  const isPdf = file ? file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf") : false;

  const transactionReference = useMemo(() => {
    if (!file) return "N/A";
    return file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "-").toUpperCase();
  }, [file]);

  async function handleVerifyReceipt() {
    if (!file || isVerifying) {
      return;
    }

    setIsVerifying(true);
    setStatusMessage(null);
    setVerifiedReference(null);
    onVerificationChange({ verified: false, message: isAmharic ? "ደረሰኝን በማረጋገጥ ላይ..." : "Verifying receipt..." });

    const normalizedOrderNumber = orderNumber.trim();
    if (!normalizedOrderNumber || normalizedOrderNumber === "UNKNOWN") {
      const message = isAmharic
        ? "እባክዎ መጀመሪያ ትክክለኛ ትዕዛዝ እንዲፈጠር ይጠብቁ።"
        : "Please wait until a valid order is created before verifying the receipt.";

      setStatusMessage(message);
      onVerificationChange({ verified: false, message });
      setIsVerifying(false);
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        const message = isAmharic
          ? "ደረሰኝ ለማረጋገጥ እባክዎ መጀመሪያ ይግቡ።"
          : "Please sign in before verifying a receipt.";

        setStatusMessage(message);
        onVerificationChange({ verified: false, message });
        return;
      }

      const formData = new FormData();
      formData.append("file", file, file.name);
      formData.append("orderNumber", normalizedOrderNumber);
      formData.append("expectedAmount", expectedAmount.toString());
      if (accountSuffix.trim().length > 0) {
        formData.append("accountSuffix", accountSuffix.trim());
      }
      if (manualReference.trim().length > 0) {
        formData.append("transactionReference", manualReference.trim().toUpperCase());
      }

      const response = await fetch("/api/payments/verify-receipt", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const payload = (await response.json()) as {
        verified?: boolean;
        message?: string;
        transactionReference?: string | null;
        alreadyUsed?: boolean;
        receiverDebug?: {
          extractedReceiver: string | null;
          extractedReceiverDigits: string | null;
          extractedReceiverLast4: string | null;
          configuredReceivers: string[];
          configuredReceiverLast4: string[];
        };
      };

      const baseMessage = payload.message ?? (response.ok ? "Receipt verified." : "Verification failed.");
      const debugSuffix = payload.receiverDebug
        ? ` [debug: extractedLast4=${payload.receiverDebug.extractedReceiverLast4 ?? "n/a"}; configuredLast4=${payload.receiverDebug.configuredReceiverLast4.join(",") || "n/a"}]`
        : "";
      const message = `${baseMessage}${debugSuffix}`;
      const transactionRef = payload.transactionReference ?? null;

      if (!response.ok || !payload.verified) {
        setStatusMessage(message);
        setVerifiedReference(transactionRef);
        onVerificationChange({
          verified: false,
          message,
          transactionReference: transactionRef,
          alreadyUsed: payload.alreadyUsed,
        });
        return;
      }

      setStatusMessage(message);
      setVerifiedReference(transactionRef);
      onVerificationChange({
        verified: true,
        message,
        transactionReference: transactionRef,
      });
    } catch {
      const message = isAmharic ? "ደረሰኙን ማረጋገጥ አልተቻለም። እባክዎ ደግመው ይሞክሩ።" : "Could not verify the receipt. Please try again.";
      setStatusMessage(message);
      setVerifiedReference(null);
      onVerificationChange({ verified: false, message });
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 p-4 md:p-5">
      <h3 className="text-lg font-semibold text-white">{isAmharic ? "የደረሰኝ ፋይል ይጫኑ" : "Upload your receipt file"}</h3>
      <p className="mt-1 text-sm text-gray-400">
        {isAmharic
          ? "የክፍያ ደረሰኝዎን (ምስል ወይም PDF) ያክሉ እና ከክፍያ ማረጋገጫ በፊት እናረጋግጣለን።"
          : "Add your payment receipt (image or PDF) and we will verify it before payment confirmation."}
      </p>

      <label className="app-bg-elevated mt-4 block cursor-pointer rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-200 hover:border-white/20">
        <span>{file ? (isAmharic ? "ፋይል ቀይር" : "Change File") : isAmharic ? "ፋይል ምረጥ" : "Choose File"}</span>
        <input
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setStatusMessage(null);
            setVerifiedReference(null);
            onVerificationChange({ verified: false, message: isAmharic ? "ደረሰኝ ይጫኑ እና ያረጋግጡ።" : "Upload a receipt and verify it." });
          }}
        />
      </label>

      <button
        type="button"
        disabled={!file || isVerifying || (isPdf && manualReference.trim().length === 0)}
        onClick={handleVerifyReceipt}
        className="app-bg-accent mt-3 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isVerifying ? (isAmharic ? "በማረጋገጥ ላይ..." : "Verifying...") : isAmharic ? "ደረሰኝን አረጋግጥ" : "Verify Receipt"}
      </button>

      <label className="mt-3 block text-xs text-gray-400">
        {isAmharic
          ? `የግብይት ማጣቀሻ ${isPdf ? "(ለ PDF ያስፈልጋል)" : "(አማራጭ)"}`
          : `Transaction reference ${isPdf ? "(required for PDF)" : "(optional)"}`}
        <input
          value={manualReference}
          onChange={(event) => setManualReference(event.target.value)}
          placeholder="e.g. FT2513001V2G or CE2513001XYT"
          className="app-bg-elevated mt-2 h-10 w-full rounded-xl border border-white/10 px-3 text-sm text-gray-100"
          autoCapitalize="characters"
        />
      </label>

      <label className="mt-3 block text-xs text-gray-400">
        {isAmharic ? "የCBE መለያ መጨረሻ (አማራጭ፣ 8 አሃዞች)" : "CBE account suffix (optional, 8 digits)"}
        <input
          value={accountSuffix}
          onChange={(event) => setAccountSuffix(event.target.value)}
          placeholder="e.g. 39003377"
          className="app-bg-elevated mt-2 h-10 w-full rounded-xl border border-white/10 px-3 text-sm text-gray-100"
          inputMode="numeric"
        />
      </label>

      {statusMessage ? (
        <p className="mt-3 text-xs text-gray-300">
          {statusMessage}
          {verifiedReference ? ` (${verifiedReference})` : ""}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div className="app-bg-elevated rounded-xl border border-white/10 px-3 py-2">
          <p className="text-gray-400">{isAmharic ? "የፋይል ስም" : "File Name"}</p>
          <p className="truncate text-gray-100">{file?.name ?? (isAmharic ? "ምንም ፋይል አልተጫነም" : "No screenshot uploaded")}</p>
        </div>
        <div className="app-bg-elevated rounded-xl border border-white/10 px-3 py-2">
          <p className="text-gray-400">{isAmharic ? "የፋይል መጠን" : "File Size"}</p>
          <p className="text-gray-100">{file ? formatBytes(file.size) : "N/A"}</p>
        </div>
        <div className="app-bg-elevated rounded-xl border border-white/10 px-3 py-2">
          <p className="text-gray-400">{isAmharic ? "የተነሳበት ቀን" : "Captured Date"}</p>
          <p className="text-gray-100">
            {file ? new Date(file.lastModified).toLocaleString() : "N/A"}
          </p>
        </div>
        <div className="app-bg-elevated rounded-xl border border-white/10 px-3 py-2">
          <p className="text-gray-400">{isAmharic ? "የግብይት ማጣቀሻ" : "Transaction Reference"}</p>
          <p className="truncate text-gray-100">{transactionReference}</p>
        </div>
      </div>
    </div>
  );
}
