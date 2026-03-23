import "server-only";

import { randomUUID } from "node:crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const PAYMENT_RECEIPTS_BUCKET = "payment-receipts";
const MAX_RECEIPT_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function extensionFromFile(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  switch (file.type) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    default:
      return "bin";
  }
}

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

async function ensureBucket() {
  const supabase = createSupabaseAdminClient();

  const { error: getBucketError } = await supabase.storage.getBucket(PAYMENT_RECEIPTS_BUCKET);
  if (!getBucketError) {
    return;
  }

  await supabase.storage.createBucket(PAYMENT_RECEIPTS_BUCKET, {
    public: false,
    fileSizeLimit: MAX_RECEIPT_SIZE_BYTES,
    allowedMimeTypes: [...ALLOWED_MIME_TYPES],
  });
}

export async function uploadPaymentReceipt(file: File, orderNumber: string) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Unsupported receipt format. Use PDF, JPG, PNG, WEBP, HEIC, or HEIF.");
  }

  if (file.size > MAX_RECEIPT_SIZE_BYTES) {
    throw new Error("Receipt must be smaller than 8MB.");
  }

  await ensureBucket();

  const supabase = createSupabaseAdminClient();
  const extension = extensionFromFile(file);
  const safeOrderNumber = sanitizeSegment(orderNumber || "unknown-order");
  const filePath = `receipts/${safeOrderNumber}/${Date.now()}-${randomUUID()}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(PAYMENT_RECEIPTS_BUCKET)
    .upload(filePath, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  return {
    bucket: PAYMENT_RECEIPTS_BUCKET,
    path: filePath,
    fileName: file.name,
    mimeType: file.type,
  };
}

export { PAYMENT_RECEIPTS_BUCKET };
