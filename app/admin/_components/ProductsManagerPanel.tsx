import Image from "next/image";
import type { CategoryRecord, EditableDish } from "./types";

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
}: ProductsManagerPanelProps) {
  return (
    <section className="app-bg-panel rounded-2xl p-4">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold">Products Management</h2>
        <button
          type="button"
          onClick={onToggleCategoryManager}
          className="app-bg-elevated rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-200"
        >
          Manage Categories
        </button>
      </div>

      <div className="mt-3 flex gap-5 overflow-x-auto border-b border-white/10 pb-3 whitespace-nowrap">
        <button
          type="button"
          onClick={() => onActiveCategoryChange("all")}
          className={`pb-2 text-sm font-semibold ${activeCategoryId === "all" ? "app-text-accent" : "text-gray-300"}`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onActiveCategoryChange(String(category.id))}
            className={`pb-2 text-sm font-semibold ${
              activeCategoryId === String(category.id) ? "app-text-accent" : "text-gray-300"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {showCategoryManager ? (
        <div className="mt-4 rounded-xl border border-white/10 p-4">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={onCreateCategory}>
            <input
              value={newCategoryName}
              onChange={(event) => onNewCategoryNameChange(event.target.value)}
              className="app-bg-elevated h-10 w-full rounded-lg border border-white/10 px-3 text-sm text-gray-100"
              placeholder="New category name"
            />
            <button
              type="submit"
              disabled={isSaving}
              className="app-bg-accent rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add Category
            </button>
          </form>
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="app-bg-main rounded-2xl border border-dashed border-white/25 px-4 py-10 text-center"
        >
          <p className="text-3xl leading-none app-text-accent">+</p>
          <p className="mt-3 text-sm font-semibold app-text-accent">Add new dish</p>
        </button>

        {dishes.map((dish) => (
          <article key={dish.id} className="app-bg-main rounded-2xl border border-white/10 p-4">
            <div className="flex justify-center">
              <Image
                src={dish.imageUrl || "/image/pizza.png"}
                alt={dish.title}
                width={96}
                height={96}
                className="h-24 w-24 rounded-full object-cover"
              />
            </div>
            <h3 className="mt-4 min-h-12 text-center text-base font-medium text-gray-100">{dish.title}</h3>
            <p className="mt-1 text-center text-sm text-gray-400">
              ${Number(dish.price || 0).toFixed(2)} • {dish.availabilityCount || "0"} Bowls
            </p>
            <button
              type="button"
              onClick={() => onOpenEditModal(dish)}
              className="app-bg-elevated mt-4 w-full rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold app-text-accent"
            >
              Edit dish
            </button>
          </article>
        ))}
      </div>

      {selectedDishTitle ? (
        <p className="mt-5 text-xs text-gray-400">
          Selected dish: <span className="text-gray-200">{selectedDishTitle}</span> ({selectedDishCategoryName ?? "No category"})
        </p>
      ) : null}

      {errorMessage ? <p className="mt-4 text-sm text-red-300">{errorMessage}</p> : null}
      {successMessage ? <p className="mt-4 text-sm text-green-300">{successMessage}</p> : null}
    </section>
  );
}
