"use client";

import { useEffect, useId } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";

type ConfirmDeleteDishModalProps = {
  isOpen: boolean;
  isSaving: boolean;
  dishTitle: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmDeleteDishModal({
  isOpen,
  isSaving,
  dishTitle,
  onClose,
  onConfirm,
}: ConfirmDeleteDishModalProps) {
  const { locale } = useI18n();
  const isAmharic = locale === "am";
  const headingId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

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

  if (!isOpen || !dishTitle) {
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
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        className="app-bg-panel w-full max-w-md overflow-hidden rounded-3xl border border-white/15 shadow-[0_35px_120px_rgba(0,0,0,0.6)]"
      >
        <div className="app-bg-elevated border-b border-white/10 px-6 py-4">
          <h3 id={headingId} className="text-xl font-semibold text-white">
            {isAmharic ? "ምግብ በቋሚነት ሰርዝ" : "Delete dish permanently"}
          </h3>
          <p id={descriptionId} className="mt-2 text-sm text-gray-300">
            {isAmharic
              ? `"${dishTitle}" ዳግም ሊመለስ በማይችል መልኩ ይሰረዛል።`
              : `"${dishTitle}" will be removed forever and cannot be restored.`}
          </p>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="app-bg-elevated rounded-xl px-4 py-2 text-sm font-semibold text-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAmharic ? "ተወው" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="rounded-xl border border-red-300/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (isAmharic ? "በመሰረዝ ላይ..." : "Deleting...") : isAmharic ? "በቋሚነት ሰርዝ" : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
