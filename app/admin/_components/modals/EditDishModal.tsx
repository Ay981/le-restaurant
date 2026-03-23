"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { CategoryRecord, EditableDish } from "../types";

type EditDishModalProps = {
  isOpen: boolean;
  isSaving: boolean;
  categories: CategoryRecord[];
  draft: EditableDish | null;
  imagePreview: string;
  selectedFileName: string | null;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onDraftChange: (draftUpdater: (current: EditableDish) => EditableDish) => void;
  onImageFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function EditDishModal({
  isOpen,
  isSaving,
  categories,
  draft,
  imagePreview,
  selectedFileName,
  onClose,
  onSubmit,
  onDraftChange,
  onImageFileChange,
}: EditDishModalProps) {
  const { locale } = useI18n();
  const isAmharic = locale === "am";
  const titleInputRef = useRef<HTMLInputElement>(null);
  const titleInputId = useId();
  const priceInputId = useId();
  const availabilityInputId = useId();
  const categorySelectId = useId();
  const imageUrlInputId = useId();
  const imageInputId = useId();
  const headingId = useId();
  const descriptionId = useId();

  const [showValidation, setShowValidation] = useState(false);

  const draftTitle = draft?.title ?? "";
  const draftPrice = draft?.price ?? "";
  const draftAvailability = draft?.availabilityCount ?? "";

  const normalizedTitle = draftTitle.trim();
  const parsedPrice = Number(draftPrice);
  const parsedAvailability = Number(draftAvailability);

  const isTitleValid = normalizedTitle.length > 0;
  const isPriceValid = draftPrice.trim().length > 0 && Number.isFinite(parsedPrice) && parsedPrice >= 0;
  const isAvailabilityValid = draftAvailability.trim().length > 0 && Number.isInteger(parsedAvailability) && parsedAvailability >= 0;

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

  const shouldShowTitleError = showValidation && !isTitleValid;
  const shouldShowPriceError = showValidation && !isPriceValid;
  const shouldShowAvailabilityError = showValidation && !isAvailabilityValid;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!draft) {
      event.preventDefault();
      return;
    }

    if (!isFormValid) {
      event.preventDefault();
      setShowValidation(true);
      return;
    }

    onSubmit(event);
  };

  if (!isOpen || !draft) {
    return null;
  }

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
              {isAmharic ? "ምግብ አርትዕ" : "Edit Dish"}
            </h3>
            <p id={descriptionId} className="mt-1 text-sm text-gray-400">
              {isAmharic ? "ዝርዝሮችን፣ ተገኝነትን እና ምስልን አዘምን።" : "Refine details, availability and image."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label={isAmharic ? "የምግብ አርትዖት ሞዳልን ዝጋ" : "Close edit dish modal"}
            className="rounded-xl border border-white/15 px-3 py-2 text-sm text-gray-200 transition hover:border-white/30"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              id={titleInputId}
              ref={titleInputRef}
              value={draft.title}
              onChange={(event) => onDraftChange((current) => ({ ...current, title: event.target.value }))}
              className={`app-bg-elevated h-11 rounded-xl border px-3 text-sm text-gray-100 ${
                shouldShowTitleError ? "border-red-400/80" : "border-white/10"
              }`}
              aria-invalid={shouldShowTitleError}
              aria-describedby={shouldShowTitleError ? `${titleInputId}-error` : undefined}
            />
            {shouldShowTitleError ? (
              <span id={`${titleInputId}-error`} className="-mt-2 text-xs text-red-300 md:col-span-2">
                {isAmharic ? "የምግብ ርዕስ ያስፈልጋል።" : "Dish title is required."}
              </span>
            ) : null}
            <input
              id={priceInputId}
              type="number"
              min="0"
              step="0.01"
              value={draft.price}
              onChange={(event) => onDraftChange((current) => ({ ...current, price: event.target.value }))}
              className={`app-bg-elevated h-11 rounded-xl border px-3 text-sm text-gray-100 ${
                shouldShowPriceError ? "border-red-400/80" : "border-white/10"
              }`}
              aria-invalid={shouldShowPriceError}
              aria-describedby={shouldShowPriceError ? `${priceInputId}-error` : undefined}
            />
            {shouldShowPriceError ? (
              <span id={`${priceInputId}-error`} className="-mt-2 text-xs text-red-300 md:col-span-2">
                {isAmharic ? "ዋጋ 0 ወይም ከዚያ በላይ መሆን አለበት።" : "Price must be 0 or greater."}
              </span>
            ) : null}
            <input
              id={availabilityInputId}
              type="number"
              min="0"
              step="1"
              value={draft.availabilityCount}
              onChange={(event) => onDraftChange((current) => ({ ...current, availabilityCount: event.target.value }))}
              className={`app-bg-elevated h-11 rounded-xl border px-3 text-sm text-gray-100 ${
                shouldShowAvailabilityError ? "border-red-400/80" : "border-white/10"
              }`}
              aria-invalid={shouldShowAvailabilityError}
              aria-describedby={shouldShowAvailabilityError ? `${availabilityInputId}-error` : undefined}
            />
            {shouldShowAvailabilityError ? (
              <span id={`${availabilityInputId}-error`} className="-mt-2 text-xs text-red-300 md:col-span-2">
                {isAmharic ? "ተገኝነት 0 ወይም ከዚያ በላይ ሙሉ ቁጥር መሆን አለበት።" : "Availability must be a whole number 0 or greater."}
              </span>
            ) : null}
            <select
              id={categorySelectId}
              value={draft.categoryId}
              onChange={(event) => onDraftChange((current) => ({ ...current, categoryId: event.target.value }))}
              className="app-bg-elevated h-11 rounded-xl border border-white/10 px-3 text-sm text-gray-100"
            >
              <option value="">{isAmharic ? "ምድብ የለም" : "No category"}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              id={imageUrlInputId}
              value={draft.imageUrl}
              onChange={(event) => onDraftChange((current) => ({ ...current, imageUrl: event.target.value }))}
              className="app-bg-elevated h-11 rounded-xl border border-white/10 px-3 text-sm text-gray-100 md:col-span-2"
              placeholder={isAmharic ? "የምስል URL አማራጭ (አማራጭ)" : "Image URL fallback (optional)"}
            />
            <label
              htmlFor={imageInputId}
              className="app-bg-main cursor-pointer rounded-xl border border-dashed border-white/25 px-3 py-3 text-center text-sm text-gray-300 md:col-span-2 hover:border-white/40"
            >
              {selectedFileName ? `${isAmharic ? "የተመረጠ:" : "Selected:"} ${selectedFileName}` : isAmharic ? "ተተኪ ምስል ይጫኑ" : "Upload replacement image"}
              <input
                id={imageInputId}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onImageFileChange}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-200 md:col-span-2">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(event) => onDraftChange((current) => ({ ...current, isActive: event.target.checked }))}
              />
              {isAmharic ? "ንቁ ምግብ" : "Active dish"}
            </label>
          </div>

          <div className="app-bg-main rounded-2xl border border-white/10 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-400">{isAmharic ? "ቅድመ እይታ" : "Preview"}</p>
            <div className="mt-3 h-56 overflow-hidden rounded-xl border border-white/10">
              <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${imagePreview})` }} />
            </div>
            <p className="mt-2 text-xs text-gray-400">{selectedFileName ? `${isAmharic ? "የተመረጠ:" : "Selected:"} ${selectedFileName}` : isAmharic ? "ምንም ተተኪ ፋይል አልተመረጠም" : "No replacement file selected"}</p>
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
              {isSaving ? (isAmharic ? "በማስቀመጥ ላይ..." : "Saving...") : isAmharic ? "ምግብ አስቀምጥ" : "Save Dish"}
          </button>
        </div>
      </form>
    </div>
  );
}
