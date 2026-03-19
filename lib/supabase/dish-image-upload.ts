import "server-only";

import { randomUUID } from "node:crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const DISH_IMAGES_BUCKET = "dish-images";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionFromFile(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

async function ensureBucket() {
  const supabase = createSupabaseAdminClient();

  const { error: getBucketError } = await supabase.storage.getBucket(DISH_IMAGES_BUCKET);
  if (!getBucketError) {
    return;
  }

  await supabase.storage.createBucket(DISH_IMAGES_BUCKET, {
    public: true,
    fileSizeLimit: MAX_IMAGE_SIZE_BYTES,
    allowedMimeTypes: [...ALLOWED_MIME_TYPES],
  });
}

export async function uploadDishImage(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Unsupported image format. Use JPG, PNG, WEBP, or GIF.");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Image must be smaller than 5MB.");
  }

  await ensureBucket();

  const supabase = createSupabaseAdminClient();
  const extension = extensionFromFile(file);
  const filePath = `dishes/${Date.now()}-${randomUUID()}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(DISH_IMAGES_BUCKET)
    .upload(filePath, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(DISH_IMAGES_BUCKET).getPublicUrl(filePath);

  if (!publicUrl) {
    throw new Error("Image upload succeeded but failed to resolve public URL.");
  }

  return publicUrl;
}
