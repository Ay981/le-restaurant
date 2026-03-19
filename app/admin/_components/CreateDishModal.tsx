import type { CategoryRecord } from "./types";

type CreateDishModalProps = {
  isOpen: boolean;
  isSaving: boolean;
  categories: CategoryRecord[];
  title: string;
  price: string;
  availability: string;
  imageUrl: string;
  imagePreview: string;
  categoryId: string;
  selectedFileName: string | null;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onTitleChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onAvailabilityChange: (value: string) => void;
  onImageUrlChange: (value: string) => void;
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
  imageUrl,
  imagePreview,
  categoryId,
  selectedFileName,
  onClose,
  onSubmit,
  onTitleChange,
  onPriceChange,
  onAvailabilityChange,
  onImageUrlChange,
  onCategoryChange,
  onImageFileChange,
}: CreateDishModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <form
        className="app-bg-panel w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 shadow-[0_35px_120px_rgba(0,0,0,0.6)]"
        onSubmit={onSubmit}
      >
        <div className="app-bg-elevated flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h3 className="text-2xl font-semibold text-white">Create New Dish</h3>
            <p className="mt-1 text-sm text-gray-400">Craft a beautiful menu item with image upload.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 px-3 py-2 text-sm text-gray-200 transition hover:border-white/30"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              className="app-bg-elevated h-11 rounded-xl border border-white/10 px-3 text-sm text-gray-100"
              placeholder="Dish title"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) => onPriceChange(event.target.value)}
              className="app-bg-elevated h-11 rounded-xl border border-white/10 px-3 text-sm text-gray-100"
              placeholder="Price"
            />
            <input
              type="number"
              min="0"
              step="1"
              value={availability}
              onChange={(event) => onAvailabilityChange(event.target.value)}
              className="app-bg-elevated h-11 rounded-xl border border-white/10 px-3 text-sm text-gray-100"
              placeholder="Availability"
            />
            <select
              value={categoryId}
              onChange={(event) => onCategoryChange(event.target.value)}
              className="app-bg-elevated h-11 rounded-xl border border-white/10 px-3 text-sm text-gray-100"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              value={imageUrl}
              onChange={(event) => onImageUrlChange(event.target.value)}
              className="app-bg-elevated h-11 rounded-xl border border-white/10 px-3 text-sm text-gray-100 md:col-span-2"
              placeholder="Image URL fallback (optional)"
            />
            <label className="app-bg-main cursor-pointer rounded-xl border border-dashed border-white/25 px-3 py-3 text-center text-sm text-gray-300 md:col-span-2 hover:border-white/40">
              Upload image (JPG, PNG, WEBP, GIF)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onImageFileChange}
              />
            </label>
          </div>

          <div className="app-bg-main rounded-2xl border border-white/10 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-400">Preview</p>
            <div className="mt-3 h-56 overflow-hidden rounded-xl border border-white/10">
              <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${imagePreview})` }} />
            </div>
            <p className="mt-2 text-xs text-gray-400">{selectedFileName ? `Selected: ${selectedFileName}` : "No file selected"}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button type="button" onClick={onClose} className="app-bg-elevated rounded-xl px-4 py-2 text-sm font-semibold text-gray-200">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="app-bg-accent rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Creating..." : "Create Dish"}
          </button>
        </div>
      </form>
    </div>
  );
}
