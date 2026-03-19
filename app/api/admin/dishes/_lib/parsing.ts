import type { DishPayload } from "./types";

export function toNonNegativeNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return value;
}

export function toNonNegativeInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return null;
  }

  return value;
}

function toNonNegativeNumberFromUnknown(value: unknown): number | null {
  if (typeof value === "number") {
    return toNonNegativeNumber(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return toNonNegativeNumber(parsed);
  }

  return null;
}

function toNonNegativeIntegerFromUnknown(value: unknown): number | null {
  if (typeof value === "number") {
    return toNonNegativeInteger(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return toNonNegativeInteger(parsed);
  }

  return null;
}

function toBooleanFromUnknown(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return null;
}

export async function parseDishPayload(
  request: Request,
  options?: { includeIsActive?: boolean },
): Promise<DishPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const fileValue = formData.get("imageFile");
    const imageFile = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;

    const payload: DishPayload = {
      title: typeof formData.get("title") === "string" ? (formData.get("title") as string) : undefined,
      price: toNonNegativeNumberFromUnknown(formData.get("price")) ?? undefined,
      availabilityCount: toNonNegativeIntegerFromUnknown(formData.get("availabilityCount")) ?? undefined,
      imageUrl:
        typeof formData.get("imageUrl") === "string" ? (formData.get("imageUrl") as string) : undefined,
      categoryId: toNonNegativeIntegerFromUnknown(formData.get("categoryId")),
      imageFile,
    };

    if (options?.includeIsActive) {
      payload.isActive = toBooleanFromUnknown(formData.get("isActive")) ?? undefined;
    }

    return payload;
  }

  return (await request.json()) as DishPayload;
}
