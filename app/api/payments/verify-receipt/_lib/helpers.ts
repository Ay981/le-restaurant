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

function asObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return null;
}

function extractDigits(value: string): string {
  return value.replace(/\D/g, "");
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

export function extractVerifiedAmount(payload: Record<string, unknown>): number | null {
  const nestedData = asObject(payload.data);

  return toNumeric(
    payload.amount ??
      payload.totalAmount ??
      payload.total_amount ??
      payload.total ??
      nestedData?.amount ??
      nestedData?.totalAmount ??
      nestedData?.total_amount ??
      nestedData?.total ??
      null,
  );
}

export function extractVerifiedCurrency(payload: Record<string, unknown>): string | null {
  const nestedData = asObject(payload.data);

  return firstNonEmptyString([
    payload.currency,
    payload.currencyCode,
    payload.currency_code,
    nestedData?.currency,
    nestedData?.currencyCode,
    nestedData?.currency_code,
  ]);
}

export function extractVerifiedReceiver(payload: Record<string, unknown>): string | null {
  const nestedData = asObject(payload.data);
  const beneficiary = asObject(nestedData?.beneficiary);
  const receiver = asObject(nestedData?.receiver);
  const recipient = asObject(nestedData?.recipient);

  return firstNonEmptyString([
    payload.receiverAccount,
    payload.receiver_account,
    payload.beneficiaryAccount,
    payload.beneficiary_account,
    payload.toAccount,
    payload.to_account,
    payload.to,
    payload.receiver,
    payload.recipient,
    payload.beneficiary,
    nestedData?.receiverAccount,
    nestedData?.receiver_account,
    nestedData?.beneficiaryAccount,
    nestedData?.beneficiary_account,
    beneficiary?.account,
    beneficiary?.accountNumber,
    receiver?.account,
    receiver?.accountNumber,
    recipient?.account,
    recipient?.accountNumber,
    nestedData?.toAccount,
    nestedData?.to_account,
    nestedData?.to,
    nestedData?.receiver,
    nestedData?.recipient,
    nestedData?.beneficiary,
    beneficiary?.name,
    receiver?.name,
    recipient?.name,
  ]);
}

export function amountsMatch(expectedAmount: number | null, verifiedAmount: number | null): boolean {
  if (expectedAmount === null || verifiedAmount === null) {
    return false;
  }

  return verifiedAmount + 0.01 >= expectedAmount;
}

export function receiversMatch(expectedReceiver: string | null, verifiedReceiver: string | null): boolean {
  if (!expectedReceiver || !verifiedReceiver) {
    return false;
  }

  const normalizedExpected = expectedReceiver.trim().toLowerCase();
  const normalizedVerified = verifiedReceiver.trim().toLowerCase();

  if (normalizedExpected.length === 0 || normalizedVerified.length === 0) {
    return false;
  }

  const expectedDigits = extractDigits(normalizedExpected);
  const verifiedDigits = extractDigits(normalizedVerified);

  if (expectedDigits.length >= 4 && verifiedDigits.length >= 4) {
    const expectedTail4 = expectedDigits.slice(-4);
    const verifiedTail4 = verifiedDigits.slice(-4);
    const expectedTail8 = expectedDigits.slice(-8);
    const verifiedTail8 = verifiedDigits.slice(-8);

    const digitMatch =
      verifiedDigits.endsWith(expectedDigits) ||
      expectedDigits.endsWith(verifiedDigits) ||
      (expectedTail8.length === 8 && verifiedTail8.length === 8 && expectedTail8 === verifiedTail8) ||
      expectedTail4 === verifiedTail4;

    return digitMatch || normalizedVerified.includes(normalizedExpected) || normalizedExpected.includes(normalizedVerified);
  }

  return normalizedVerified.includes(normalizedExpected);
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
