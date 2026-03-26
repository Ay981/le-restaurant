import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireRoleAccess } from "@/lib/supabase/admin-route-auth";
import { uploadPaymentReceipt } from "@/lib/supabase/payment-receipt-upload";
import {
  DEFAULT_IMAGE_VERIFICATION_ENDPOINT,
  DEFAULT_UNIVERSAL_VERIFICATION_ENDPOINT,
  MAX_RECEIPT_FILE_SIZE_BYTES,
  VERIFICATION_RETRY_ATTEMPTS,
} from "./_lib/constants";
import {
  amountsMatch,
  extractTransactionReference,
  extractVerifiedAmount,
  extractVerifiedCurrency,
  extractVerifiedReceiver,
  firstNonEmptyString,
  isPdfFile,
  isSupportedReceiptFile,
  normalizeEndpoint,
  receiversMatch,
  resolveVerificationApiKey,
  resolveVerifiedStatus,
  toNumeric,
  uniqueValues,
  withAutoVerify,
} from "./_lib/helpers";
import type { VerifyResponse } from "./_lib/types";

type OrderLookupRow = {
  id: string;
  order_number: string;
  customer_user_id: string | null;
  total: number | null;
};

export async function POST(request: Request) {
  const authResult = await requireRoleAccess(request, ["customer", "admin", "staff"]);
  if (!authResult.ok) {
    return NextResponse.json(
      {
        verified: false,
        message: authResult.message,
        transactionReference: null,
      } satisfies VerifyResponse,
      { status: authResult.status },
    );
  }

  const { key: verificationApiKey } = resolveVerificationApiKey();
  const configuredImageEndpoint = normalizeEndpoint(
    process.env.RECEIPT_VERIFY_URL ?? DEFAULT_IMAGE_VERIFICATION_ENDPOINT,
  );
  const configuredUniversalEndpoint = normalizeEndpoint(
    process.env.RECEIPT_VERIFY_UNIVERSAL_URL ?? DEFAULT_UNIVERSAL_VERIFICATION_ENDPOINT,
  );

  if (!verificationApiKey) {
    const deploymentEnvironment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown";

    return NextResponse.json(
      {
        verified: false,
        message:
          `Receipt verification API key is missing on the server (env: ${deploymentEnvironment}). Set RECEIPT_VERIFY_API_KEY in the active deployment environment and redeploy.`,
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

    const orderNumber = typeof orderNumberValue === "string" ? orderNumberValue.trim() : "";

    const expectedAmount = toNumeric(expectedAmountValue);
    const accountSuffix =
      typeof accountSuffixValue === "string" && accountSuffixValue.trim().length > 0
        ? accountSuffixValue.trim()
        : null;
    const expectedReceiverFromEnv = firstNonEmptyString([
      process.env.RECEIPT_VERIFY_EXPECTED_RECEIVER,
      process.env.RECEIPT_EXPECTED_RECEIVER,
    ]);
    const trustedReceivers = (expectedReceiverFromEnv ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    const manualReference =
      typeof manualReferenceValue === "string" && manualReferenceValue.trim().length > 0
        ? manualReferenceValue.trim().toUpperCase()
        : null;

    if (expectedAmount === null) {
      return NextResponse.json(
        {
          verified: false,
          message: "Expected payment amount is required for verification.",
          transactionReference: null,
        } satisfies VerifyResponse,
        { status: 400 },
      );
    }

    if (!orderNumber) {
      return NextResponse.json(
        {
          verified: false,
          message: "Order number is required for verification.",
          transactionReference: null,
        } satisfies VerifyResponse,
        { status: 400 },
      );
    }

    if (trustedReceivers.length === 0) {
      return NextResponse.json(
        {
          verified: false,
          message: "Expected receiver is required. Set RECEIPT_VERIFY_EXPECTED_RECEIVER on the server.",
          transactionReference: null,
        } satisfies VerifyResponse,
        { status: 400 },
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();

    const { data: orderData, error: orderLookupError } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, customer_user_id, total")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (orderLookupError) {
      return NextResponse.json(
        {
          verified: false,
          message: "Failed to validate order details.",
          transactionReference: null,
        } satisfies VerifyResponse,
        { status: 500 },
      );
    }

    if (!orderData) {
      return NextResponse.json(
        {
          verified: false,
          message: "Order not found.",
          transactionReference: null,
        } satisfies VerifyResponse,
        { status: 404 },
      );
    }

    const order = orderData as OrderLookupRow;

    if (authResult.role === "customer" && order.customer_user_id !== authResult.userId) {
      return NextResponse.json(
        {
          verified: false,
          message: "You can verify receipts only for your own orders.",
          transactionReference: null,
        } satisfies VerifyResponse,
        { status: 403 },
      );
    }

    if (typeof order.total === "number" && Number.isFinite(order.total)) {
      if (expectedAmount + 0.009 < order.total) {
        return NextResponse.json(
          {
            verified: false,
            message: "Expected amount cannot be less than the order total.",
            transactionReference: null,
          } satisfies VerifyResponse,
          { status: 400 },
        );
      }
    }

    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);
    const receiptHash = createHash("sha256").update(fileBuffer).digest("hex");

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
        universalPayload.accountSuffix = accountSuffix;
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
            attemptPayload.append("accountSuffix", accountSuffix);
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

    const verifiedAmount = extractVerifiedAmount(parsedPayload);
    const verifiedCurrency = extractVerifiedCurrency(parsedPayload);
    const verifiedReceiver = extractVerifiedReceiver(parsedPayload);
    const amountMatchesExpected = amountsMatch(expectedAmount, verifiedAmount);
    const matchedTrustedReceiverFromPayload =
      verifiedReceiver === null
        ? null
        : trustedReceivers.find((receiver) => receiversMatch(receiver, verifiedReceiver)) ?? null;
    const normalizedAccountSuffix = (accountSuffix ?? "").replace(/\D/g, "");
    const matchedTrustedReceiverFromSuffix =
      normalizedAccountSuffix.length >= 4
        ? trustedReceivers.find((receiver) => {
            const configuredDigits = receiver.replace(/\D/g, "");
            if (configuredDigits.length < 4) {
              return false;
            }

            return configuredDigits.endsWith(normalizedAccountSuffix) || normalizedAccountSuffix.endsWith(configuredDigits);
          }) ?? null
        : null;
    const matchedTrustedReceiver = matchedTrustedReceiverFromPayload ?? matchedTrustedReceiverFromSuffix;
    const receiverMatchesExpected = matchedTrustedReceiver !== null;
    const shouldReturnReceiverDebug = process.env.NODE_ENV !== "production";

    if (amountMatchesExpected !== true) {
      return NextResponse.json(
        {
          verified: false,
          message:
            verifiedAmount === null
              ? "Could not validate payment amount from the receipt."
              : `Receipt amount is below the required minimum. Expected at least ${expectedAmount.toFixed(2)}, but receipt shows ${verifiedAmount.toFixed(2)}.`,
          transactionReference,
        } satisfies VerifyResponse,
        { status: 400 },
      );
    }

    if (receiverMatchesExpected !== true) {
      const verifiedReceiverDigits = verifiedReceiver ? verifiedReceiver.replace(/\D/g, "") : null;
      const verifiedReceiverLast4 = verifiedReceiverDigits && verifiedReceiverDigits.length >= 4
        ? verifiedReceiverDigits.slice(-4)
        : null;

      return NextResponse.json(
        {
          verified: false,
          message:
            verifiedReceiver === null
              ? "Could not validate payment receiver from the receipt."
              : "Receipt receiver mismatch. The receipt does not target any configured business account.",
          transactionReference,
          receiverDebug: shouldReturnReceiverDebug
            ? {
                extractedReceiver: verifiedReceiver,
                extractedReceiverDigits: verifiedReceiverDigits,
                extractedReceiverLast4: verifiedReceiverLast4,
                configuredReceivers: trustedReceivers,
                configuredReceiverLast4: trustedReceivers
                  .map((receiver) => receiver.replace(/\D/g, ""))
                  .filter((digits) => digits.length >= 4)
                  .map((digits) => digits.slice(-4)),
                providedAccountSuffix: normalizedAccountSuffix || null,
                matchedViaSuffix: matchedTrustedReceiverFromSuffix !== null,
              }
            : undefined,
        } satisfies VerifyResponse,
        { status: 400 },
      );
    }

    const uploadedReceipt = await uploadPaymentReceipt(file, orderNumber);

    const { data: savedVerification, error: insertError } = await supabaseAdmin
      .from("payment_receipt_verifications")
      .insert({
        order_number: order.order_number,
        provider: "verify.leul.et",
        transaction_reference: transactionReference,
        receipt_hash: receiptHash,
        receipt_file_path: uploadedReceipt.path,
        receipt_file_name: uploadedReceipt.fileName,
        receipt_mime_type: uploadedReceipt.mimeType,
        expected_amount: expectedAmount,
        verified_amount: verifiedAmount,
        verified_currency: verifiedCurrency,
        amount_matches_expected: amountMatchesExpected,
        expected_receiver: matchedTrustedReceiver,
        verified_receiver: verifiedReceiver,
        receiver_matches_expected: receiverMatchesExpected,
        raw_response: parsedPayload,
      })
      .select("id")
      .single();

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

    if (savedVerification?.id) {
      const { error: staffNotificationError } = await supabaseAdmin.from("staff_order_notifications").insert({
        order_id: order.id,
        receipt_verification_id: savedVerification.id,
        title: "Receipt review required",
        message: `Order ${order.order_number} has a newly uploaded receipt waiting for review.`,
      });

      if (staffNotificationError) {
        console.error("Non-fatal staff notification insertion failure in receipt verification", {
          orderId: order.id,
          receiptVerificationId: savedVerification.id,
          staffNotificationError,
        });
      }
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
