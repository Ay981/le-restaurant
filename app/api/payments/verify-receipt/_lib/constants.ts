export const MAX_RECEIPT_FILE_SIZE_BYTES = 8 * 1024 * 1024;
export const VERIFICATION_RETRY_ATTEMPTS = 2;
export const SUPPORTED_RECEIPT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
export const DEFAULT_IMAGE_VERIFICATION_ENDPOINT = "https://verifyapi.leulzenebe.pro/verify-image";
export const DEFAULT_UNIVERSAL_VERIFICATION_ENDPOINT = "https://verifyapi.leulzenebe.pro/verify";
