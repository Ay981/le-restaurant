"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CiGrid41, CiHome } from "react-icons/ci";
import { FiBell, FiLock, FiMail, FiPieChart, FiSettings } from "react-icons/fi";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type CategoryRecord = {
  id: number;
  name: string;
  sort_order: number;
};

type DishRecord = {
  id: string;
  title: string;
  price: number;
  availability_count: number;
  image_url: string | null;
  category_id: number | null;
  is_active: boolean;
};

type EditableDish = {
  id: string;
  title: string;
  price: string;
  availabilityCount: string;
  imageUrl: string;
  categoryId: string;
  isActive: boolean;
};

const settingsNavItems = [
  { label: "Appearance", description: "Dark and Light mode, Font size" },
  { label: "Your Restaurant", description: "Business profile and info" },
  { label: "Products Management", description: "Manage your products and pricing" },
  { label: "Notifications", description: "Customize your notifications" },
  { label: "Security", description: "Configure password and PIN" },
  { label: "About", description: "Find out more about this app" },
] as const;

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [dishes, setDishes] = useState<EditableDish[]>([]);

  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [isCreateDishModalOpen, setIsCreateDishModalOpen] = useState(false);
  const [isEditDishModalOpen, setIsEditDishModalOpen] = useState(false);
  const [editDishDraft, setEditDishDraft] = useState<EditableDish | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newDishTitle, setNewDishTitle] = useState("");
  const [newDishPrice, setNewDishPrice] = useState("");
  const [newDishAvailability, setNewDishAvailability] = useState("");
  const [newDishImageUrl, setNewDishImageUrl] = useState("/image/pizza.png");
  const [newDishImageFile, setNewDishImageFile] = useState<File | null>(null);
  const [newDishImagePreview, setNewDishImagePreview] = useState<string | null>(null);
  const [newDishCategoryId, setNewDishCategoryId] = useState("");
  const [editDishImageFile, setEditDishImageFile] = useState<File | null>(null);
  const [editDishImagePreview, setEditDishImagePreview] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const loadAdminData = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      router.replace(`/sign-in?next=${encodeURIComponent("/admin")}`);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (profileError || profile?.role !== "admin") {
      setIsAdmin(false);
      setErrorMessage("Admin access is required for this page.");
      setIsLoading(false);
      return;
    }

    setIsAdmin(true);

    const [{ data: categoryData, error: categoryError }, { data: dishesData, error: dishesError }] =
      await Promise.all([
        supabase.from("categories").select("id, name, sort_order").order("sort_order", { ascending: true }),
        supabase
          .from("dishes")
          .select("id, title, price, availability_count, image_url, category_id, is_active")
          .order("created_at", { ascending: false }),
      ]);

    if (categoryError || dishesError) {
      setErrorMessage(categoryError?.message ?? dishesError?.message ?? "Failed to load admin data.");
      setIsLoading(false);
      return;
    }

    const categoryList = (categoryData ?? []) as CategoryRecord[];
    const dishList = ((dishesData ?? []) as DishRecord[]).map((dish) => ({
      id: dish.id,
      title: dish.title,
      price: String(dish.price),
      availabilityCount: String(dish.availability_count),
      imageUrl: dish.image_url || "/image/pizza.png",
      categoryId: dish.category_id ? String(dish.category_id) : "",
      isActive: dish.is_active,
    }));

    setCategories(categoryList);
    setDishes(dishList);
    setSelectedDishId((previous) => previous ?? dishList[0]?.id ?? null);
    setErrorMessage(null);
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  const categoryNameById = useMemo(() => {
    return new Map(categories.map((category) => [String(category.id), category.name]));
  }, [categories]);

  const filteredDishes = useMemo(() => {
    if (activeCategoryId === "all") {
      return dishes;
    }

    return dishes.filter((dish) => dish.categoryId === activeCategoryId);
  }, [activeCategoryId, dishes]);

  const selectedDish = useMemo(() => {
    if (!selectedDishId) {
      return null;
    }

    return dishes.find((dish) => dish.id === selectedDishId) ?? null;
  }, [dishes, selectedDishId]);

  const createModalImagePreview = newDishImagePreview ?? newDishImageUrl;
  const editModalImagePreview = editDishImagePreview ?? editDishDraft?.imageUrl ?? "/image/pizza.png";

  const getAccessToken = async () => {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) {
      throw new Error("You must be signed in to perform this action.");
    }

    return accessToken;
  };

  const handleCreateCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      setErrorMessage("Category name is required.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const nextSortOrder = (categories[categories.length - 1]?.sort_order ?? 0) + 1;

      const { error } = await supabase.from("categories").insert({
        name: trimmedName,
        sort_order: nextSortOrder,
      });

      if (error) {
        throw new Error(error.message);
      }

      setNewCategoryName("");
      setSuccessMessage("Category created.");
      await loadAdminData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create category.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateDish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = newDishTitle.trim();
    const price = Number(newDishPrice);
    const availability = Number(newDishAvailability);

    if (!title) {
      setErrorMessage("Dish title is required.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setErrorMessage("Dish price must be 0 or greater.");
      return;
    }

    if (!Number.isInteger(availability) || availability < 0) {
      setErrorMessage("Availability must be a whole number 0 or greater.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const accessToken = await getAccessToken();

      const formData = new FormData();
      formData.append("title", title);
      formData.append("price", String(price));
      formData.append("availabilityCount", String(availability));
      formData.append("imageUrl", newDishImageUrl.trim() || "/image/pizza.png");
      formData.append("categoryId", newDishCategoryId ? String(Number(newDishCategoryId)) : "");
      if (newDishImageFile) {
        formData.append("imageFile", newDishImageFile);
      }

      const response = await fetch("/api/admin/dishes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to create dish.");
      }

      setNewDishTitle("");
      setNewDishPrice("");
      setNewDishAvailability("");
      setNewDishImageUrl("/image/pizza.png");
      if (newDishImagePreview) {
        URL.revokeObjectURL(newDishImagePreview);
      }
      setNewDishImagePreview(null);
      setNewDishImageFile(null);
      setNewDishCategoryId("");
      setIsCreateDishModalOpen(false);
      setSuccessMessage("Dish created.");
      await loadAdminData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create dish.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveDishChange = async (dish: EditableDish, imageFile?: File | null) => {
    const price = Number(dish.price);
    const availability = Number(dish.availabilityCount);

    if (!Number.isFinite(price) || price < 0) {
      throw new Error(`Dish price for ${dish.title} must be 0 or greater.`);
    }

    if (!Number.isInteger(availability) || availability < 0) {
      throw new Error(`Availability for ${dish.title} must be a whole number 0 or greater.`);
    }

    const accessToken = await getAccessToken();

    const formData = new FormData();
    formData.append("title", dish.title.trim());
    formData.append("price", String(price));
    formData.append("availabilityCount", String(availability));
    formData.append("imageUrl", dish.imageUrl.trim() || "/image/pizza.png");
    formData.append("categoryId", dish.categoryId ? String(Number(dish.categoryId)) : "");
    formData.append("isActive", String(dish.isActive));
    if (imageFile) {
      formData.append("imageFile", imageFile);
    }

    const response = await fetch(`/api/admin/dishes/${dish.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      throw new Error(payload.message ?? `Failed to update ${dish.title}.`);
    }
  };

  const handleSaveEditDish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editDishDraft) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await saveDishChange(editDishDraft, editDishImageFile);

      setSuccessMessage(`Saved: ${editDishDraft.title}`);
      setIsEditDishModalOpen(false);
      setEditDishDraft(null);
      if (editDishImagePreview) {
        URL.revokeObjectURL(editDishImagePreview);
      }
      setEditDishImagePreview(null);
      setEditDishImageFile(null);
      await loadAdminData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update dish.");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDishModal = (dish: EditableDish) => {
    setSelectedDishId(dish.id);
    setEditDishDraft({ ...dish });
    if (editDishImagePreview) {
      URL.revokeObjectURL(editDishImagePreview);
      setEditDishImagePreview(null);
    }
    setEditDishImageFile(null);
    setIsEditDishModalOpen(true);
  };

  const handleCreateImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }

    if (newDishImagePreview) {
      URL.revokeObjectURL(newDishImagePreview);
    }

    setNewDishImageFile(file);
    setNewDishImagePreview(URL.createObjectURL(file));
  };

  const handleEditImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }

    if (editDishImagePreview) {
      URL.revokeObjectURL(editDishImagePreview);
    }

    setEditDishImageFile(file);
    setEditDishImagePreview(URL.createObjectURL(file));
  };

  if (isLoading) {
    return (
      <main className="app-bg-main flex min-h-screen items-center justify-center px-4 text-gray-300">
        Loading admin dashboard...
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="app-bg-main min-h-screen px-4 py-6 text-white md:px-8 md:py-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 p-6">
          <h1 className="text-2xl font-semibold">Admin Access Required</h1>
          <p className="mt-2 text-sm text-gray-300">Only admin accounts can manage dishes and categories.</p>
          {errorMessage ? <p className="mt-3 text-sm text-red-300">{errorMessage}</p> : null}
          <div className="mt-4">
            <Link href="/" className="app-text-accent hover:underline">
              Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-bg-main min-h-screen px-3 py-4 text-white md:px-6 md:py-6">
      <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 p-3 md:p-4">
        <div className="grid gap-3 lg:grid-cols-[72px_260px_1fr]">
          <aside className="app-bg-panel flex flex-row items-center gap-2 rounded-2xl p-2 lg:flex-col lg:justify-between lg:py-4">
            <div className="flex items-center gap-2 lg:flex-col">
              <button type="button" className="app-bg-elevated rounded-xl p-3 text-xl text-gray-200">
                <CiHome />
              </button>
              <button type="button" className="rounded-xl p-3 text-xl text-gray-400">
                <CiGrid41 />
              </button>
              <button type="button" className="rounded-xl p-3 text-xl text-gray-400">
                <FiPieChart />
              </button>
              <button type="button" className="rounded-xl p-3 text-xl text-gray-400">
                <FiMail />
              </button>
              <button type="button" className="rounded-xl p-3 text-xl text-gray-400">
                <FiBell />
              </button>
              <button type="button" className="rounded-xl p-3 text-xl text-gray-400">
                <FiLock />
              </button>
            </div>
            <button type="button" className="app-bg-accent rounded-xl p-3 text-xl text-white">
              <FiSettings />
            </button>
          </aside>

          <section className="app-bg-panel rounded-2xl p-4">
            <h1 className="text-3xl font-semibold">Settings</h1>
            <div className="mt-4 space-y-2">
              {settingsNavItems.map((item) => {
                const isActive = item.label === "Products Management";

                return (
                  <div
                    key={item.label}
                    className={`rounded-xl border px-3 py-3 ${
                      isActive
                        ? "app-bg-elevated app-border-accent border"
                        : "border-white/10 bg-transparent"
                    }`}
                  >
                    <p className={`text-sm font-medium ${isActive ? "app-text-accent" : "text-gray-200"}`}>
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="app-bg-panel rounded-2xl p-4">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-semibold">Products Management</h2>
              <button
                type="button"
                onClick={() => setShowCategoryManager((previous) => !previous)}
                className="app-bg-elevated rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-200"
              >
                Manage Categories
              </button>
            </div>

            <div className="mt-3 flex gap-5 overflow-x-auto border-b border-white/10 pb-3 whitespace-nowrap">
              <button
                type="button"
                onClick={() => setActiveCategoryId("all")}
                className={`pb-2 text-sm font-semibold ${
                  activeCategoryId === "all" ? "app-text-accent" : "text-gray-300"
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategoryId(String(category.id))}
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
                <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleCreateCategory}>
                  <input
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
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
                onClick={() => setIsCreateDishModalOpen(true)}
                className="app-bg-main rounded-2xl border border-dashed border-white/25 px-4 py-10 text-center"
              >
                <p className="text-3xl leading-none app-text-accent">+</p>
                <p className="mt-3 text-sm font-semibold app-text-accent">Add new dish</p>
              </button>

              {filteredDishes.map((dish) => (
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
                    onClick={() => openEditDishModal(dish)}
                    className="app-bg-elevated mt-4 w-full rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold app-text-accent"
                  >
                    Edit dish
                  </button>
                </article>
              ))}
            </div>

            {selectedDish ? (
              <p className="mt-5 text-xs text-gray-400">
                Selected dish: <span className="text-gray-200">{selectedDish.title}</span> ({categoryNameById.get(selectedDish.categoryId) ?? "No category"})
              </p>
            ) : null}

            {errorMessage ? <p className="mt-4 text-sm text-red-300">{errorMessage}</p> : null}
            {successMessage ? <p className="mt-4 text-sm text-green-300">{successMessage}</p> : null}
          </section>
        </div>
      </div>

      {isCreateDishModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <form
            className="app-bg-panel w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 shadow-[0_35px_120px_rgba(0,0,0,0.6)]"
            onSubmit={handleCreateDish}
          >
            <div className="app-bg-elevated flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h3 className="text-2xl font-semibold text-white">Create New Dish</h3>
                <p className="mt-1 text-sm text-gray-400">Craft a beautiful menu item with image upload.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateDishModalOpen(false)}
                className="rounded-xl border border-white/15 px-3 py-2 text-sm text-gray-200 transition hover:border-white/30"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={newDishTitle}
                  onChange={(event) => setNewDishTitle(event.target.value)}
                  className="app-bg-elevated h-11 rounded-xl border border-white/10 px-3 text-sm text-gray-100"
                  placeholder="Dish title"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newDishPrice}
                  onChange={(event) => setNewDishPrice(event.target.value)}
                  className="app-bg-elevated h-11 rounded-xl border border-white/10 px-3 text-sm text-gray-100"
                  placeholder="Price"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={newDishAvailability}
                  onChange={(event) => setNewDishAvailability(event.target.value)}
                  className="app-bg-elevated h-11 rounded-xl border border-white/10 px-3 text-sm text-gray-100"
                  placeholder="Availability"
                />
                <select
                  value={newDishCategoryId}
                  onChange={(event) => setNewDishCategoryId(event.target.value)}
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
                  value={newDishImageUrl}
                  onChange={(event) => setNewDishImageUrl(event.target.value)}
                  className="app-bg-elevated h-11 rounded-xl border border-white/10 px-3 text-sm text-gray-100 md:col-span-2"
                  placeholder="Image URL fallback (optional)"
                />
                <label className="app-bg-main cursor-pointer rounded-xl border border-dashed border-white/25 px-3 py-3 text-center text-sm text-gray-300 md:col-span-2 hover:border-white/40">
                  Upload image (JPG, PNG, WEBP, GIF)
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleCreateImageFileChange} />
                </label>
              </div>

              <div className="app-bg-main rounded-2xl border border-white/10 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-400">Preview</p>
                <div className="mt-3 h-56 overflow-hidden rounded-xl border border-white/10">
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${createModalImagePreview || "/image/pizza.png"})` }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-400">{newDishImageFile ? `Selected: ${newDishImageFile.name}` : "No file selected"}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsCreateDishModalOpen(false)}
                className="app-bg-elevated rounded-xl px-4 py-2 text-sm font-semibold text-gray-200"
              >
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
      ) : null}

      {isEditDishModalOpen && editDishDraft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <form
            className="app-bg-panel w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 shadow-[0_35px_120px_rgba(0,0,0,0.6)]"
            onSubmit={handleSaveEditDish}
          >
            <div className="app-bg-elevated flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h3 className="text-2xl font-semibold text-white">Edit Dish</h3>
                <p className="mt-1 text-sm text-gray-400">Refine details, availability and image.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditDishModalOpen(false);
                  setEditDishDraft(null);
                }}
                className="rounded-xl border border-white/15 px-3 py-2 text-sm text-gray-200 transition hover:border-white/30"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={editDishDraft.title}
                  onChange={(event) => setEditDishDraft((previous) => (previous ? { ...previous, title: event.target.value } : previous))}
                  className="app-bg-elevated h-11 rounded-xl border border-white/10 px-3 text-sm text-gray-100"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editDishDraft.price}
                  onChange={(event) => setEditDishDraft((previous) => (previous ? { ...previous, price: event.target.value } : previous))}
                  className="app-bg-elevated h-11 rounded-xl border border-white/10 px-3 text-sm text-gray-100"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editDishDraft.availabilityCount}
                  onChange={(event) => setEditDishDraft((previous) => (previous ? { ...previous, availabilityCount: event.target.value } : previous))}
                  className="app-bg-elevated h-11 rounded-xl border border-white/10 px-3 text-sm text-gray-100"
                />
                <select
                  value={editDishDraft.categoryId}
                  onChange={(event) => setEditDishDraft((previous) => (previous ? { ...previous, categoryId: event.target.value } : previous))}
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
                  value={editDishDraft.imageUrl}
                  onChange={(event) => setEditDishDraft((previous) => (previous ? { ...previous, imageUrl: event.target.value } : previous))}
                  className="app-bg-elevated h-11 rounded-xl border border-white/10 px-3 text-sm text-gray-100 md:col-span-2"
                  placeholder="Image URL fallback (optional)"
                />
                <label className="app-bg-main cursor-pointer rounded-xl border border-dashed border-white/25 px-3 py-3 text-center text-sm text-gray-300 md:col-span-2 hover:border-white/40">
                  Upload replacement image
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleEditImageFileChange} />
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-200 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={editDishDraft.isActive}
                    onChange={(event) => setEditDishDraft((previous) => (previous ? { ...previous, isActive: event.target.checked } : previous))}
                  />
                  Active dish
                </label>
              </div>

              <div className="app-bg-main rounded-2xl border border-white/10 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-400">Preview</p>
                <div className="mt-3 h-56 overflow-hidden rounded-xl border border-white/10">
                  <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${editModalImagePreview})` }} />
                </div>
                <p className="mt-2 text-xs text-gray-400">{editDishImageFile ? `Selected: ${editDishImageFile.name}` : "No replacement file selected"}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditDishModalOpen(false);
                  setEditDishDraft(null);
                  if (editDishImagePreview) {
                    URL.revokeObjectURL(editDishImagePreview);
                    setEditDishImagePreview(null);
                  }
                  setEditDishImageFile(null);
                }}
                className="app-bg-elevated rounded-xl px-4 py-2 text-sm font-semibold text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="app-bg-accent rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Dish"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
