"use client";

import { useMemo, useState } from "react";

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
    onVerificationChange({ verified: false, message: "Verifying receipt..." });

    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      formData.append("orderNumber", orderNumber);
      formData.append("expectedAmount", expectedAmount.toString());
      if (accountSuffix.trim().length > 0) {
        formData.append("accountSuffix", accountSuffix.trim());
      }
      if (manualReference.trim().length > 0) {
        formData.append("transactionReference", manualReference.trim().toUpperCase());
      }

      const response = await fetch("/api/payments/verify-receipt", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        verified?: boolean;
        message?: string;
        transactionReference?: string | null;
        alreadyUsed?: boolean;
      };

      const message = payload.message ?? (response.ok ? "Receipt verified." : "Verification failed.");
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
      const message = "Could not verify the receipt. Please try again.";
      setStatusMessage(message);
      setVerifiedReference(null);
      onVerificationChange({ verified: false, message });
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 p-4 md:p-5">
      <h3 className="text-lg font-semibold text-white">Upload your receipt file</h3>
      <p className="mt-1 text-sm text-gray-400">
        Add your payment receipt (image or PDF) and we will verify it before payment confirmation.
      </p>

      <label className="app-bg-elevated mt-4 block cursor-pointer rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-200 hover:border-white/20">
        <span>{file ? "Change File" : "Choose File"}</span>
        <input
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setStatusMessage(null);
            setVerifiedReference(null);
            onVerificationChange({ verified: false, message: "Upload a receipt and verify it." });
          }}
        />
      </label>

      <button
        type="button"
        disabled={!file || isVerifying || (isPdf && manualReference.trim().length === 0)}
        onClick={handleVerifyReceipt}
        className="app-bg-accent mt-3 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isVerifying ? "Verifying..." : "Verify Receipt"}
      </button>

      <label className="mt-3 block text-xs text-gray-400">
        Transaction reference {isPdf ? "(required for PDF)" : "(optional)"}
        <input
          value={manualReference}
          onChange={(event) => setManualReference(event.target.value)}
          placeholder="e.g. FT2513001V2G or CE2513001XYT"
          className="app-bg-elevated mt-2 h-10 w-full rounded-xl border border-white/10 px-3 text-sm text-gray-100"
          autoCapitalize="characters"
        />
      </label>

      <label className="mt-3 block text-xs text-gray-400">
        CBE account suffix (optional, 8 digits)
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
          <p className="text-gray-400">File Name</p>
          <p className="truncate text-gray-100">{file?.name ?? "No screenshot uploaded"}</p>
        </div>
        <div className="app-bg-elevated rounded-xl border border-white/10 px-3 py-2">
          <p className="text-gray-400">File Size</p>
          <p className="text-gray-100">{file ? formatBytes(file.size) : "N/A"}</p>
        </div>
        <div className="app-bg-elevated rounded-xl border border-white/10 px-3 py-2">
          <p className="text-gray-400">Captured Date</p>
          <p className="text-gray-100">
            {file ? new Date(file.lastModified).toLocaleString() : "N/A"}
          </p>
        </div>
        <div className="app-bg-elevated rounded-xl border border-white/10 px-3 py-2">
          <p className="text-gray-400">Transaction Reference</p>
          <p className="truncate text-gray-100">{transactionReference}</p>
        </div>
      </div>
    </div>
  );
}
