import { SUPPORTED_RECEIPT_MIME_TYPES } from "./constants";

export function toNumeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

export function firstNonEmptyString(values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return null;
}

export function resolveVerifiedStatus(payload: Record<string, unknown>): boolean {
  const boolKeys = [
    payload.verified,
    payload.isVerified,
    payload.is_verified,
    payload.valid,
    payload.isValid,
    payload.is_valid,
  ];

  const boolValue = boolKeys.find((item) => typeof item === "boolean");
  if (typeof boolValue === "boolean") {
    return boolValue;
  }

  const status = firstNonEmptyString([payload.status, payload.result, payload.state]);
  if (!status) {
    return false;
  }

  const normalizedStatus = status.toLowerCase();
  return ["verified", "valid", "approved", "ok", "success"].includes(normalizedStatus);
}

export function extractTransactionReference(payload: Record<string, unknown>): string | null {
  const nestedData =
    typeof payload.data === "object" && payload.data !== null
      ? (payload.data as Record<string, unknown>)
      : null;

  return firstNonEmptyString([
    payload.transactionReference,
    payload.transaction_reference,
    payload.reference,
    payload.ref,
    payload.txRef,
    payload.tx_ref,
    payload.receiptNumber,
    payload.receipt_number,
    payload.id,
    nestedData?.reference,
    nestedData?.transactionReference,
    nestedData?.transaction_reference,
    nestedData?.receiptNumber,
    nestedData?.transactionId,
  ]);
}

export function isSupportedReceiptFile(file: File): boolean {
  const mimeType = file.type.toLowerCase();
  if (SUPPORTED_RECEIPT_MIME_TYPES.has(mimeType)) {
    return true;
  }

  return /\.(pdf|png|jpe?g|webp|heic|heif)$/i.test(file.name);
}

export function isPdfFile(file: File): boolean {
  const mimeType = file.type.toLowerCase();
  return mimeType === "application/pdf" || /\.pdf$/i.test(file.name);
}

export function normalizeEndpoint(value: string): string {
  const trimmed = value.trim();
  const withoutQuotes = trimmed.replace(/^['"]|['"]$/g, "");
  return withoutQuotes;
}

export function normalizeSecret(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

export function withAutoVerify(endpoint: string): string {
  if (endpoint.includes("autoVerify=")) {
    return endpoint;
  }

  return `${endpoint}${endpoint.includes("?") ? "&" : "?"}autoVerify=true`;
}

export function uniqueValues(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

export function resolveVerificationApiKey() {
  const candidates: Array<{ name: string; value: string | undefined }> = [
    { name: "RECEIPT_VERIFY_API_KEY", value: process.env.RECEIPT_VERIFY_API_KEY },
    { name: "VERIFY_API_KEY", value: process.env.VERIFY_API_KEY },
    { name: "RECEIPT_API_KEY", value: process.env.RECEIPT_API_KEY },
  ];

  for (const candidate of candidates) {
    if (!candidate.value) {
      continue;
    }

    const normalized = normalizeSecret(candidate.value);
    if (normalized.length > 0) {
      return {
        key: normalized,
        source: candidate.name,
      };
    }
  }

  return {
    key: "",
    source: null as string | null,
  };
}
