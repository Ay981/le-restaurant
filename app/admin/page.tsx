"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import AdminSideRail from "./_components/AdminSideRail";
import AdminSettingsPanel from "./_components/AdminSettingsPanel";
import ProductsManagerPanel from "./_components/ProductsManagerPanel";
import CreateDishModal from "./_components/CreateDishModal";
import EditDishModal from "./_components/EditDishModal";
import type { CategoryRecord, EditableDish } from "./_components/types";

type DishRecord = {
  id: string;
  title: string;
  price: number;
  availability_count: number;
  image_url: string | null;
  category_id: number | null;
  is_active: boolean;
};

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
          <AdminSideRail />
          <AdminSettingsPanel />
          <ProductsManagerPanel
            categories={categories}
            dishes={filteredDishes}
            activeCategoryId={activeCategoryId}
            showCategoryManager={showCategoryManager}
            newCategoryName={newCategoryName}
            isSaving={isSaving}
            selectedDishTitle={selectedDish?.title ?? null}
            selectedDishCategoryName={selectedDish ? categoryNameById.get(selectedDish.categoryId) ?? "No category" : null}
            errorMessage={errorMessage}
            successMessage={successMessage}
            onToggleCategoryManager={() => setShowCategoryManager((previous) => !previous)}
            onActiveCategoryChange={setActiveCategoryId}
            onNewCategoryNameChange={setNewCategoryName}
            onCreateCategory={handleCreateCategory}
            onOpenCreateModal={() => setIsCreateDishModalOpen(true)}
            onOpenEditModal={openEditDishModal}
          />
        </div>
      </div>

      <CreateDishModal
        isOpen={isCreateDishModalOpen}
        isSaving={isSaving}
        categories={categories}
        title={newDishTitle}
        price={newDishPrice}
        availability={newDishAvailability}
        imageUrl={newDishImageUrl}
        imagePreview={createModalImagePreview || "/image/pizza.png"}
        categoryId={newDishCategoryId}
        selectedFileName={newDishImageFile?.name ?? null}
        onClose={() => setIsCreateDishModalOpen(false)}
        onSubmit={handleCreateDish}
        onTitleChange={setNewDishTitle}
        onPriceChange={setNewDishPrice}
        onAvailabilityChange={setNewDishAvailability}
        onImageUrlChange={setNewDishImageUrl}
        onCategoryChange={setNewDishCategoryId}
        onImageFileChange={handleCreateImageFileChange}
      />

      <EditDishModal
        isOpen={isEditDishModalOpen}
        isSaving={isSaving}
        categories={categories}
        draft={editDishDraft}
        imagePreview={editModalImagePreview}
        selectedFileName={editDishImageFile?.name ?? null}
        onClose={() => {
          setIsEditDishModalOpen(false);
          setEditDishDraft(null);
          if (editDishImagePreview) {
            URL.revokeObjectURL(editDishImagePreview);
            setEditDishImagePreview(null);
          }
          setEditDishImageFile(null);
        }}
        onSubmit={handleSaveEditDish}
        onDraftChange={(updater) => setEditDishDraft((previous) => (previous ? updater(previous) : previous))}
        onImageFileChange={handleEditImageFileChange}
      />
    </main>
  );
}
