import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_RECEIPT_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const VERIFICATION_RETRY_ATTEMPTS = 2;
const SUPPORTED_RECEIPT_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const DEFAULT_IMAGE_VERIFICATION_ENDPOINT = "https://verifyapi.leulzenebe.pro/verify-image";
const DEFAULT_UNIVERSAL_VERIFICATION_ENDPOINT = "https://verifyapi.leulzenebe.pro/verify";

type VerifyResponse = {
  verified: boolean;
  message: string;
  transactionReference: string | null;
  alreadyUsed?: boolean;
};

function toNumeric(value: unknown): number | null {
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

function firstNonEmptyString(values: unknown[]): string | null {
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

function resolveVerifiedStatus(payload: Record<string, unknown>): boolean {
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

function extractTransactionReference(payload: Record<string, unknown>): string | null {
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

function isSupportedReceiptFile(file: File): boolean {
  const mimeType = file.type.toLowerCase();
  if (SUPPORTED_RECEIPT_MIME_TYPES.has(mimeType)) {
    return true;
  }

  return /\.(pdf|png|jpe?g|webp|heic|heif)$/i.test(file.name);
}

function isPdfFile(file: File): boolean {
  const mimeType = file.type.toLowerCase();
  return mimeType === "application/pdf" || /\.pdf$/i.test(file.name);
}

function normalizeEndpoint(value: string): string {
  const trimmed = value.trim();
  const withoutQuotes = trimmed.replace(/^['"]|['"]$/g, "");
  return withoutQuotes;
}

function normalizeSecret(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

function withAutoVerify(endpoint: string): string {
  if (endpoint.includes("autoVerify=")) {
    return endpoint;
  }

  return `${endpoint}${endpoint.includes("?") ? "&" : "?"}autoVerify=true`;
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

export async function POST(request: Request) {
  const verificationApiKey = normalizeSecret(
    process.env.RECEIPT_VERIFY_API_KEY ??
      process.env.VERIFY_API_KEY ??
      process.env.RECEIPT_API_KEY ??
      "",
  );
  const configuredImageEndpoint = normalizeEndpoint(
    process.env.RECEIPT_VERIFY_URL ?? DEFAULT_IMAGE_VERIFICATION_ENDPOINT,
  );
  const configuredUniversalEndpoint = normalizeEndpoint(
    process.env.RECEIPT_VERIFY_UNIVERSAL_URL ?? DEFAULT_UNIVERSAL_VERIFICATION_ENDPOINT,
  );

  if (!verificationApiKey) {
    return NextResponse.json(
      {
        verified: false,
        message:
          "Receipt verification API key is missing on the server. Set RECEIPT_VERIFY_API_KEY in the active deployment environment.",
        transactionReference: null,
      } satisfies VerifyResponse,
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const orderNumberValue = formData.get("orderNumber");
    const expectedAmountValue = formData.get("expectedAmount");
    const accountSuffixValue = formData.get("accountSuffix");
    const manualReferenceValue = formData.get("transactionReference");

    const imageEndpointCandidates = uniqueValues([
      withAutoVerify(configuredImageEndpoint),
      withAutoVerify(DEFAULT_IMAGE_VERIFICATION_ENDPOINT),
    ]);
    const universalEndpointCandidates = uniqueValues([
      configuredUniversalEndpoint,
      DEFAULT_UNIVERSAL_VERIFICATION_ENDPOINT,
    ]);

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          verified: false,
          message: "Receipt file is required.",
          transactionReference: null,
        } satisfies VerifyResponse,
        { status: 400 },
      );
    }

    if (!isSupportedReceiptFile(file)) {
      return NextResponse.json(
        {
          verified: false,
          message: "Unsupported file type. Upload a PDF or receipt image.",
          transactionReference: null,
        } satisfies VerifyResponse,
        { status: 400 },
      );
    }

    if (file.size > MAX_RECEIPT_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          verified: false,
          message: "Receipt file must be smaller than 8MB.",
          transactionReference: null,
        } satisfies VerifyResponse,
        { status: 400 },
      );
    }

    const orderNumber =
      typeof orderNumberValue === "string" && orderNumberValue.trim().length > 0
        ? orderNumberValue.trim()
        : "UNKNOWN";

    const expectedAmount = toNumeric(expectedAmountValue);
    const accountSuffix =
      typeof accountSuffixValue === "string" && accountSuffixValue.trim().length > 0
        ? accountSuffixValue.trim()
        : null;
    const manualReference =
      typeof manualReferenceValue === "string" && manualReferenceValue.trim().length > 0
        ? manualReferenceValue.trim().toUpperCase()
        : null;

    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);
    const receiptHash = createHash("sha256").update(fileBuffer).digest("hex");

    const supabaseAdmin = createSupabaseAdminClient();

    const { data: existingByHash, error: existingByHashError } = await supabaseAdmin
      .from("payment_receipt_verifications")
      .select("id, order_number, transaction_reference")
      .eq("receipt_hash", receiptHash)
      .maybeSingle();

    if (existingByHashError) {
      return NextResponse.json(
        {
          verified: false,
          message: "Failed to validate receipt uniqueness.",
          transactionReference: null,
        } satisfies VerifyResponse,
        { status: 500 },
      );
    }

    if (existingByHash) {
      return NextResponse.json(
        {
          verified: false,
          message: "This payment receipt has already been used.",
          transactionReference: existingByHash.transaction_reference,
          alreadyUsed: true,
        } satisfies VerifyResponse,
        { status: 409 },
      );
    }

    let verificationResponse: Response | null = null;
    let parsedPayload: Record<string, unknown> = {};
    let lastTransportError: string | null = null;

    if (isPdfFile(file)) {
      if (!manualReference) {
        return NextResponse.json(
          {
            verified: false,
            message:
              "For PDF receipts, enter the transaction reference (e.g. FT..., CE...) before verifying.",
            transactionReference: null,
          } satisfies VerifyResponse,
          { status: 400 },
        );
      }

      const universalPayload: Record<string, string> = {
        reference: manualReference,
      };

      if (manualReference.startsWith("FT") && accountSuffix) {
        universalPayload.suffix = accountSuffix;
      }

      for (const endpoint of universalEndpointCandidates) {
        try {
          verificationResponse = await fetch(endpoint, {
            method: "POST",
            headers: {
              "x-api-key": verificationApiKey,
              "api-key": verificationApiKey,
              Authorization: `Bearer ${verificationApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(universalPayload),
            cache: "no-store",
          });

          const universalResponseText = await verificationResponse.text();
          parsedPayload = {};
          if (universalResponseText.trim().length > 0) {
            try {
              parsedPayload = JSON.parse(universalResponseText) as Record<string, unknown>;
            } catch {
              parsedPayload = { raw: universalResponseText };
            }
          }

          break;
        } catch (error) {
          lastTransportError = error instanceof Error ? error.message : "Unknown network error";
        }
      }
    } else {
      for (const endpoint of imageEndpointCandidates) {
        for (let attempt = 0; attempt <= VERIFICATION_RETRY_ATTEMPTS; attempt += 1) {
          const attemptPayload = new FormData();
          attemptPayload.append("file", file, file.name);
          attemptPayload.append("orderNumber", orderNumber);
          if (expectedAmount !== null) {
            attemptPayload.append("expectedAmount", expectedAmount.toString());
          }
          if (accountSuffix) {
            attemptPayload.append("suffix", accountSuffix);
          }

          try {
            verificationResponse = await fetch(endpoint, {
              method: "POST",
              headers: {
                "x-api-key": verificationApiKey,
                "api-key": verificationApiKey,
                Authorization: `Bearer ${verificationApiKey}`,
              },
              body: attemptPayload,
              cache: "no-store",
            });

            const responseText = await verificationResponse.text();
            parsedPayload = {};

            if (responseText.trim().length > 0) {
              try {
                parsedPayload = JSON.parse(responseText) as Record<string, unknown>;
              } catch {
                parsedPayload = { raw: responseText };
              }
            }
          } catch (error) {
            lastTransportError = error instanceof Error ? error.message : "Unknown network error";
            if (attempt === VERIFICATION_RETRY_ATTEMPTS) {
              break;
            }

            await new Promise((resolve) => setTimeout(resolve, 700));
            continue;
          }

          const upstreamMessage =
            firstNonEmptyString([parsedPayload.message, parsedPayload.error])?.toLowerCase() ?? "";
          const retryableConnectionError =
            verificationResponse.status >= 500 ||
            upstreamMessage.includes("failed to connect to verification server") ||
            upstreamMessage.includes("timeout");

          if (!retryableConnectionError || attempt === VERIFICATION_RETRY_ATTEMPTS) {
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, 700));
        }

        if (verificationResponse) {
          break;
        }
      }
    }

    if (!verificationResponse) {
      return NextResponse.json(
        {
          verified: false,
          message: lastTransportError
            ? `Failed to reach verification provider: ${lastTransportError}`
            : "Verification provider did not return a response.",
          transactionReference: null,
        } satisfies VerifyResponse,
        { status: 502 },
      );
    }

    const universalSuccess =
      parsedPayload.success === true ||
      (typeof parsedPayload.data === "object" && parsedPayload.data !== null);
    const verified =
      verificationResponse.ok &&
      (isPdfFile(file) ? universalSuccess : resolveVerifiedStatus(parsedPayload));
    const transactionReference =
      extractTransactionReference(parsedPayload) ?? receiptHash.slice(0, 24).toUpperCase();

    if (!verified) {
      const upstreamErrorMessage =
        firstNonEmptyString([parsedPayload.message, parsedPayload.error]) ??
        "Receipt could not be verified.";

      const normalizedUpstreamError = upstreamErrorMessage.toLowerCase();
      const looksLikeProviderImageFailure = normalizedUpstreamError.includes(
        "something went wrong processing the image",
      );

      return NextResponse.json(
        {
          verified: false,
          message: looksLikeProviderImageFailure
            ? `Verification provider could not process this receipt image. ${upstreamErrorMessage}`
            : upstreamErrorMessage,
          transactionReference,
        } satisfies VerifyResponse,
        { status: 400 },
      );
    }

    const { data: existingByReference, error: existingByReferenceError } = await supabaseAdmin
      .from("payment_receipt_verifications")
      .select("id, order_number, transaction_reference")
      .eq("transaction_reference", transactionReference)
      .maybeSingle();

    if (existingByReferenceError) {
      return NextResponse.json(
        {
          verified: false,
          message: "Failed to validate transaction uniqueness.",
          transactionReference,
        } satisfies VerifyResponse,
        { status: 500 },
      );
    }

    if (existingByReference) {
      return NextResponse.json(
        {
          verified: false,
          message: "This transaction has already been used for another payment.",
          transactionReference,
          alreadyUsed: true,
        } satisfies VerifyResponse,
        { status: 409 },
      );
    }

    const verifiedAmount = toNumeric(
      parsedPayload.amount ?? parsedPayload.totalAmount ?? parsedPayload.total ?? null,
    );
    const verifiedCurrency = firstNonEmptyString([
      parsedPayload.currency,
      parsedPayload.currencyCode,
      parsedPayload.currency_code,
    ]);

    const { error: insertError } = await supabaseAdmin
      .from("payment_receipt_verifications")
      .insert({
        order_number: orderNumber,
        provider: "verify.leul.et",
        transaction_reference: transactionReference,
        receipt_hash: receiptHash,
        verified_amount: verifiedAmount,
        verified_currency: verifiedCurrency,
        raw_response: parsedPayload,
      });

    if (insertError) {
      const message = insertError.message.toLowerCase();
      const duplicateConflict =
        insertError.code === "23505" || message.includes("duplicate") || message.includes("unique");

      if (duplicateConflict) {
        return NextResponse.json(
          {
            verified: false,
            message: "This payment receipt was already consumed.",
            transactionReference,
            alreadyUsed: true,
          } satisfies VerifyResponse,
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          verified: false,
          message: "Receipt verification record could not be saved.",
          transactionReference,
        } satisfies VerifyResponse,
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        verified: true,
        message: "Receipt verified successfully.",
        transactionReference,
      } satisfies VerifyResponse,
      { status: 200 },
    );
  } catch (error) {
    const fallbackMessage =
      error instanceof Error ? error.message : "Unknown internal verification error";

    return NextResponse.json(
      {
        verified: false,
        message: `Verification failed before provider response: ${fallbackMessage}`,
        transactionReference: null,
      } satisfies VerifyResponse,
      { status: 500 },
    );
  }
}
