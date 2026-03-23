"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { CategoryRecord } from "../types";

type CreateDishModalProps = {
  isOpen: boolean;
  isSaving: boolean;
  categories: CategoryRecord[];
  title: string;
  price: string;
  availability: string;
  imagePreview: string;
  categoryId: string;
  selectedFileName: string | null;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onTitleChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onAvailabilityChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onImageFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function CreateDishModal({
  isOpen,
  isSaving,
  categories,
  title,
  price,
  availability,
  imagePreview,
  categoryId,
  selectedFileName,
  onClose,
  onSubmit,
  onTitleChange,
  onPriceChange,
  onAvailabilityChange,
  onCategoryChange,
  onImageFileChange,
}: CreateDishModalProps) {
  const { locale } = useI18n();
  const isAmharic = locale === "am";
  const titleInputRef = useRef<HTMLInputElement>(null);
  const titleInputId = useId();
  const priceInputId = useId();
  const availabilityInputId = useId();
  const categorySelectId = useId();
  const imageInputId = useId();
  const headingId = useId();
  const descriptionId = useId();

  const [showValidation, setShowValidation] = useState(false);

  const normalizedTitle = title.trim();
  const parsedPrice = Number(price);
  const parsedAvailability = Number(availability);

  const isTitleValid = normalizedTitle.length > 0;
  const isPriceValid = price.trim().length > 0 && Number.isFinite(parsedPrice) && parsedPrice >= 0;
  const isAvailabilityValid =
    availability.trim().length > 0 && Number.isInteger(parsedAvailability) && parsedAvailability >= 0;

  const isFormValid = isTitleValid && isPriceValid && isAvailabilityValid;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    titleInputRef.current?.focus();

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen && !isSaving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) {
    return null;
  }

  const shouldShowTitleError = showValidation && !isTitleValid;
  const shouldShowPriceError = showValidation && !isPriceValid;
  const shouldShowAvailabilityError = showValidation && !isAvailabilityValid;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!isFormValid) {
      event.preventDefault();
      setShowValidation(true);
      return;
    }

    onSubmit(event);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        className="app-bg-panel w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 shadow-[0_35px_120px_rgba(0,0,0,0.6)]"
        onSubmit={handleSubmit}
      >
        <div className="app-bg-elevated flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h3 id={headingId} className="text-2xl font-semibold text-white">
              {isAmharic ? "አዲስ ምግብ ፍጠር" : "Create New Dish"}
            </h3>
            <p id={descriptionId} className="mt-1 text-sm text-gray-400">
              {isAmharic ? "በምስል ጭነት የተሟላ የሜኑ ንጥል ይፍጠሩ።" : "Craft a beautiful menu item with image upload."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label={isAmharic ? "የምግብ ፍጠር ሞዳልን ዝጋ" : "Close create dish modal"}
            className="rounded-xl border border-white/15 px-3 py-2 text-sm text-gray-200 transition hover:border-white/30"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px] lg:items-stretch">
          <div className="flex h-full flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-gray-300">
                <span className="mb-1.5 block">{isAmharic ? "የምግብ ርዕስ" : "Dish title"}</span>
                <input
                  id={titleInputId}
                  ref={titleInputRef}
                  value={title}
                  onChange={(event) => onTitleChange(event.target.value)}
                  className={`app-bg-elevated h-11 w-full rounded-xl border px-3 text-sm text-gray-100 ${
                    shouldShowTitleError ? "border-red-400/80" : "border-white/10"
                  }`}
                  placeholder={isAmharic ? "ለምሳሌ፡ ፔፐሮኒ ፒዛ" : "e.g. Pepperoni Pizza"}
                  required
                  aria-invalid={shouldShowTitleError}
                  aria-describedby={shouldShowTitleError ? `${titleInputId}-error` : undefined}
                />
                {shouldShowTitleError ? (
                  <span id={`${titleInputId}-error`} className="mt-1 block text-xs text-red-300">
                    {isAmharic ? "የምግብ ርዕስ ያስፈልጋል።" : "Dish title is required."}
                  </span>
                ) : null}
              </label>

              <label className="text-sm text-gray-300">
                <span className="mb-1.5 block">{isAmharic ? "ዋጋ" : "Price"}</span>
                <input
                  id={priceInputId}
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={price}
                  onChange={(event) => onPriceChange(event.target.value)}
                  className={`app-bg-elevated h-11 w-full rounded-xl border px-3 text-sm text-gray-100 ${
                    shouldShowPriceError ? "border-red-400/80" : "border-white/10"
                  }`}
                  placeholder="0.00"
                  required
                  aria-invalid={shouldShowPriceError}
                  aria-describedby={shouldShowPriceError ? `${priceInputId}-error` : undefined}
                />
                {shouldShowPriceError ? (
                  <span id={`${priceInputId}-error`} className="mt-1 block text-xs text-red-300">
                    {isAmharic ? "ዋጋ 0 ወይም ከዚያ በላይ መሆን አለበት።" : "Price must be 0 or greater."}
                  </span>
                ) : null}
              </label>

              <label className="text-sm text-gray-300">
                <span className="mb-1.5 block">{isAmharic ? "ተገኝነት" : "Availability"}</span>
                <input
                  id={availabilityInputId}
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={availability}
                  onChange={(event) => onAvailabilityChange(event.target.value)}
                  className={`app-bg-elevated h-11 w-full rounded-xl border px-3 text-sm text-gray-100 ${
                    shouldShowAvailabilityError ? "border-red-400/80" : "border-white/10"
                  }`}
                  placeholder="0"
                  required
                  aria-invalid={shouldShowAvailabilityError}
                  aria-describedby={shouldShowAvailabilityError ? `${availabilityInputId}-error` : undefined}
                />
                {shouldShowAvailabilityError ? (
                  <span id={`${availabilityInputId}-error`} className="mt-1 block text-xs text-red-300">
                    {isAmharic ? "ተገኝነት 0 ወይም ከዚያ በላይ ሙሉ ቁጥር መሆን አለበት።" : "Availability must be a whole number 0 or greater."}
                  </span>
                ) : null}
              </label>

              <label className="text-sm text-gray-300">
                <span className="mb-1.5 block">{isAmharic ? "ምድብ" : "Category"}</span>
                <select
                  id={categorySelectId}
                  value={categoryId}
                  onChange={(event) => onCategoryChange(event.target.value)}
                  className="app-bg-elevated h-11 w-full rounded-xl border border-white/10 px-3 text-sm text-gray-100"
                >
                  <option value="">{isAmharic ? "ምድብ የለም" : "No category"}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label htmlFor={imageInputId} className="text-sm text-gray-300">
              <span className="mb-1.5 block">{isAmharic ? "የምግብ ምስል" : "Dish image"}</span>
              <span className="app-bg-main flex min-h-40 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/25 px-3 py-4 text-center text-sm text-gray-300 transition hover:border-white/40">
                {selectedFileName ? `${isAmharic ? "የተመረጠ:" : "Selected:"} ${selectedFileName}` : isAmharic ? "ምስል ይጫኑ (JPG, PNG, WEBP, GIF)" : "Upload image (JPG, PNG, WEBP, GIF)"}
              </span>
              <input
                id={imageInputId}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onImageFileChange}
              />
            </label>
          </div>

          <div className="app-bg-main flex h-full flex-col rounded-2xl border border-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">{isAmharic ? "ቅድመ እይታ" : "Preview"}</p>
            <div className="mt-3 h-56 overflow-hidden rounded-xl border border-white/10">
              <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${imagePreview})` }} />
            </div>
            <p className="mt-3 text-xs text-gray-400">
              {selectedFileName ? `${isAmharic ? "የተመረጠ ፋይል:" : "Selected file:"} ${selectedFileName}` : isAmharic ? "ነባሪ ምስል ቅድመ እይታ ተጠቃሚ ነው።" : "Using default image preview."}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="app-bg-elevated rounded-xl px-4 py-2 text-sm font-semibold text-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
              {isAmharic ? "ሰርዝ" : "Cancel"}
          </button>
          <button
            type="submit"
            disabled={isSaving || !isFormValid}
            className="app-bg-accent rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
              {isSaving ? (isAmharic ? "በመፍጠር ላይ..." : "Creating...") : isAmharic ? "ምግብ ፍጠር" : "Create Dish"}
          </button>
        </div>
      </form>
    </div>
  );
}
