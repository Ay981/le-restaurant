export const DEFAULT_DISH_IMAGE_URL = "/image/pizza.png";

const CONTIGUOUS_REPEAT_PATTERN = /(.)\1{2,}/i;
const DISH_IMAGE_BUCKET_PATH_FRAGMENT = "/dish-images/";

export function validateDishTitle(title: string): string | null {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    return "Dish title is required.";
  }

  if (normalizedTitle.length < 3) {
    return "Dish title must be at least 3 characters.";
  }

  if (CONTIGUOUS_REPEAT_PATTERN.test(normalizedTitle)) {
    return "Dish title must not contain repeated characters like \"aaaa\".";
  }

  return null;
}

export function toSentenceCaseLabel(label: string): string {
  const normalized = label.trim();
  if (!normalized) {
    return "";
  }

  if (/[^\u0000-\u00ff]/.test(normalized)) {
    return normalized;
  }

  const lower = normalized.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function getSafeDishImageUrl(imageUrl: string | null | undefined): string {
  const normalized = typeof imageUrl === "string" ? imageUrl.trim() : "";

  if (!normalized) {
    return DEFAULT_DISH_IMAGE_URL;
  }

  if (normalized.startsWith("blob:") || normalized.startsWith("data:image/")) {
    return normalized;
  }

  if (normalized.startsWith("/image/")) {
    return normalized;
  }

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    if (normalized.includes(DISH_IMAGE_BUCKET_PATH_FRAGMENT)) {
      return normalized;
    }

    return DEFAULT_DISH_IMAGE_URL;
  }

  return DEFAULT_DISH_IMAGE_URL;
}