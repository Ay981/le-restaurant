"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatCurrency } from "@/lib/currency";
import { DEFAULT_DISH_IMAGE_URL, getSafeDishImageUrl, toSentenceCaseLabel } from "@/lib/dishes/quality";
import type { CategoryRecord, EditableDish } from "../types";

type ProductsManagerPanelProps = {
  categories: CategoryRecord[];
  dishes: EditableDish[];
  activeCategoryId: string;
  showCategoryManager: boolean;
  newCategoryName: string;
  isSaving: boolean;
  selectedDishTitle: string | null;
  selectedDishCategoryName: string | null;
  errorMessage: string | null;
  successMessage: string | null;
  onToggleCategoryManager: () => void;
  onActiveCategoryChange: (categoryId: string) => void;
  onNewCategoryNameChange: (value: string) => void;
  onCreateCategory: (event: React.FormEvent<HTMLFormElement>) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (dish: EditableDish) => void;
  onToggleDishActive: (dish: EditableDish) => void;
  onRequestDeleteDish: (dish: EditableDish) => void;
};

export default function ProductsManagerPanel({
  categories,
  dishes,
  activeCategoryId,
  showCategoryManager,
  newCategoryName,
  isSaving,
  selectedDishTitle,
  selectedDishCategoryName,
  errorMessage,
  successMessage,
  onToggleCategoryManager,
  onActiveCategoryChange,
  onNewCategoryNameChange,
  onCreateCategory,
  onOpenCreateModal,
  onOpenEditModal,
  onToggleDishActive,
  onRequestDeleteDish,
}: ProductsManagerPanelProps) {
  const { locale } = useI18n();
  const isAmharic = locale === "am";
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const [failedImageIds, setFailedImageIds] = useState<Record<string, true>>({});

  const categoryTabs = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      displayName: isAmharic ? category.name : toSentenceCaseLabel(category.name),
    }));
  }, [categories, isAmharic]);

  useEffect(() => {
    const tabsElement = tabsRef.current;
    if (!tabsElement) {
      return;
    }

    const updateOverflowAffordance = () => {
      const maxScrollLeft = tabsElement.scrollWidth - tabsElement.clientWidth;
      setShowLeftFade(tabsElement.scrollLeft > 2);
      setShowRightFade(tabsElement.scrollLeft < maxScrollLeft - 2);
    };

    updateOverflowAffordance();
    tabsElement.addEventListener("scroll", updateOverflowAffordance, { passive: true });
    window.addEventListener("resize", updateOverflowAffordance);

    return () => {
      tabsElement.removeEventListener("scroll", updateOverflowAffordance);
      window.removeEventListener("resize", updateOverflowAffordance);
    };
  }, [categoryTabs.length]);

  const getDishCardImageUrl = (dish: EditableDish) => {
    if (failedImageIds[dish.id]) {
      return DEFAULT_DISH_IMAGE_URL;
    }

    return getSafeDishImageUrl(dish.imageUrl);
  };

  return (
    <section className="app-bg-panel h-full rounded-2xl border border-white/10 p-4 md:p-6">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold">{isAmharic ? "የምርቶች አስተዳደር" : "Products Management"}</h2>
        <button
          type="button"
          onClick={onToggleCategoryManager}
          className="app-hover-accent-soft w-full rounded-lg border border-white/15 px-3 py-2 text-sm text-gray-200 sm:w-auto"
        >
          {isAmharic ? "ምድቦችን አስተዳድር" : "Manage Categories"}
        </button>
      </div>

      <div className="relative mt-4 border-b border-white/10 pb-3">
        {showLeftFade ? (
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-linear-to-r from-(--app-bg-panel) to-transparent" />
        ) : null}
        {showRightFade ? (
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-linear-to-l from-(--app-bg-panel) to-transparent" />
        ) : null}

        <div
          ref={tabsRef}
          className="flex gap-2 overflow-x-auto whitespace-nowrap pr-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
        <button
          type="button"
          onClick={() => onActiveCategoryChange("all")}
          className={`rounded-full px-2.5 py-1.5 text-xs font-semibold sm:text-sm ${
            activeCategoryId === "all"
              ? "app-bg-accent text-white shadow-[0_0_0_1px_rgba(255,255,255,0.18)]"
              : "text-gray-300 hover:text-gray-100"
          }`}
        >
          {isAmharic ? "ሁሉም" : "All"}
        </button>
        {categoryTabs.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onActiveCategoryChange(String(category.id))}
            className={`rounded-full px-2.5 py-1.5 text-xs font-semibold sm:text-sm ${
              activeCategoryId === String(category.id)
                ? "app-bg-accent text-white shadow-[0_0_0_1px_rgba(255,255,255,0.18)]"
                : "text-gray-300 hover:text-gray-100"
            }`}
          >
            {category.displayName}
          </button>
        ))}
        </div>

        {showRightFade ? (
          <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-semibold tracking-wide text-gray-300 sm:hidden">
            {isAmharic ? "ተጨማሪ ›" : "More ›"}
          </span>
        ) : null}
      </div>

      {showCategoryManager ? (
        <div className="mt-4 rounded-xl border border-white/10 p-3">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={onCreateCategory}>
            <input
              value={newCategoryName}
              onChange={(event) => onNewCategoryNameChange(event.target.value)}
              className="app-bg-elevated h-10 w-full rounded-lg border border-white/10 px-3 text-sm text-gray-100"
              placeholder={isAmharic ? "አዲስ ምድብ ስም" : "New category name"}
            />
            <button
              type="submit"
              disabled={isSaving}
              className="app-bg-accent w-full rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isAmharic ? "ምድብ ጨምር" : "Add Category"}
            </button>
          </form>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="app-bg-main relative flex min-h-61.25 flex-col items-center justify-center rounded-3xl border border-dashed border-white/25 px-3 pb-3 pt-12 text-center sm:min-h-0 sm:rounded-2xl sm:px-4 sm:py-10"
        >
          <span className="app-bg-elevated mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/15 text-3xl app-text-accent sm:hidden">
            +
          </span>
          <div className="sm:hidden">
            <p className="mt-4 text-base font-semibold app-text-accent">{isAmharic ? "አዲስ ምግብ ጨምር" : "Add new dish"}</p>
            <p className="mt-2 text-xs text-gray-400">{isAmharic ? "አዲስ ምግብ ለማስገባት" : "Create a new menu item"}</p>
            <span className="app-bg-accent mt-auto inline-flex rounded-lg px-3 py-2 text-xs font-semibold text-white">
              {isAmharic ? "ጨምር" : "Add"}
            </span>
          </div>
          <div className="hidden sm:flex flex-col items-center justify-center">
            <p className="text-3xl leading-none app-text-accent">+</p>
            <p className="mt-3 text-sm font-semibold app-text-accent">{isAmharic ? "አዲስ ምግብ ጨምር" : "Add new dish"}</p>
          </div>
        </button>

        {dishes.map((dish) => (
          <article
            key={dish.id}
            className={`app-bg-main relative flex min-h-61.25 flex-col rounded-3xl border px-3 pb-3 pt-4 text-center sm:min-h-0 sm:rounded-2xl sm:p-4 ${
              dish.isActive ? "border-white/10" : "border-amber-300/40"
            }`}
          >
            {!dish.isActive ? (
              <span className="absolute left-3 top-3 rounded-full border border-amber-200/30 bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                {isAmharic ? "ከስራ ውጪ" : "Out of order"}
              </span>
            ) : null}
            <div className="sm:hidden">
              <Image
                src={getDishCardImageUrl(dish)}
                alt={dish.title}
                width={96}
                height={96}
                className="mx-auto h-20 w-20 rounded-full object-cover ring-2 ring-white/20"
                onError={() => {
                  setFailedImageIds((previous) => ({ ...previous, [dish.id]: true }));
                }}
              />
              <h3 className="mt-4 line-clamp-3 min-h-18 text-lg font-semibold text-gray-100">{dish.title}</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-100">{formatCurrency(Number(dish.price || 0))}</p>
              <p className="mt-2 text-sm text-gray-400">
                {dish.availabilityCount || "0"} {isAmharic ? "ሳህኖች አሉ" : "Bowls available"}
              </p>
            </div>

            <div className="hidden sm:block sm:text-center">
              <Image
                src={getDishCardImageUrl(dish)}
                alt={dish.title}
                width={96}
                height={96}
                className="mx-auto h-24 w-24 rounded-full object-cover"
                onError={() => {
                  setFailedImageIds((previous) => ({ ...previous, [dish.id]: true }));
                }}
              />
              <h3 className="mt-4 line-clamp-2 min-h-12 text-center text-base font-medium text-gray-100">{dish.title}</h3>
              <p className="mt-1 text-center text-sm text-gray-400">
                {formatCurrency(Number(dish.price || 0))} • {dish.availabilityCount || "0"} {isAmharic ? "ሳህኖች" : "Bowls"}
              </p>
            </div>
            <div className="mt-auto flex flex-col gap-2 sm:mt-4">
              <button
                type="button"
                onClick={() => onOpenEditModal(dish)}
                disabled={isSaving}
                className="app-hover-accent-soft w-full rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold app-text-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAmharic ? "ምግብ አርትዕ" : "Edit dish"}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onToggleDishActive(dish)}
                  disabled={isSaving}
                  className="app-hover-accent-soft rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {dish.isActive ? (isAmharic ? "አቦዝን" : "Disable") : isAmharic ? "አንቃ" : "Activate"}
                </button>

                <button
                  type="button"
                  onClick={() => onRequestDeleteDish(dish)}
                  disabled={isSaving}
                  className="rounded-lg border border-red-300/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAmharic ? "ሰርዝ" : "Delete"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {selectedDishTitle ? (
        <p className="mt-5 text-xs text-gray-400">
          {isAmharic ? "የተመረጠ ምግብ:" : "Selected dish:"} <span className="text-gray-200">{selectedDishTitle}</span> ({selectedDishCategoryName ?? (isAmharic ? "ምድብ የለም" : "No category")})
        </p>
      ) : null}

      {errorMessage ? <p className="mt-4 text-sm text-red-300">{errorMessage}</p> : null}
      {successMessage ? <p className="mt-4 text-sm text-green-300">{successMessage}</p> : null}
    </section>
  );
}
