import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { DEFAULT_DISH_IMAGE_URL, getSafeDishImageUrl, validateDishTitle } from "@/lib/dishes/quality";
import type { CategoryRecord, EditableDish } from "../_components/types";

type DishRecord = {
  id: string;
  title: string;
  price: number;
  availability_count: number;
  image_url: string | null;
  category_id: number | null;
  is_active: boolean;
};

export function useAdminProductsManager() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [dishes, setDishes] = useState<EditableDish[]>([]);

  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const [isCreateDishModalOpen, setIsCreateDishModalOpen] = useState(false);
  const [isEditDishModalOpen, setIsEditDishModalOpen] = useState(false);
  const [isDeleteDishModalOpen, setIsDeleteDishModalOpen] = useState(false);
  const [editDishDraft, setEditDishDraft] = useState<EditableDish | null>(null);
  const [deleteDishTarget, setDeleteDishTarget] = useState<EditableDish | null>(null);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newDishTitle, setNewDishTitle] = useState("");
  const [newDishPrice, setNewDishPrice] = useState("");
  const [newDishAvailability, setNewDishAvailability] = useState("");
  const [newDishImageUrl, setNewDishImageUrl] = useState(DEFAULT_DISH_IMAGE_URL);
  const [newDishImageFile, setNewDishImageFile] = useState<File | null>(null);
  const [newDishImagePreview, setNewDishImagePreview] = useState<string | null>(null);
  const [newDishCategoryId, setNewDishCategoryId] = useState("");
  const [editDishImageFile, setEditDishImageFile] = useState<File | null>(null);
  const [editDishImagePreview, setEditDishImagePreview] = useState<string | null>(null);

  const loadAdminData = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();

    const [{ data: categoryData, error: categoryError }, { data: dishesData, error: dishesError }] = await Promise.all([
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
      imageUrl: getSafeDishImageUrl(dish.image_url),
      categoryId: dish.category_id ? String(dish.category_id) : "",
      isActive: dish.is_active,
    }));

    setCategories(categoryList);
    setDishes(dishList);
    setSelectedDishId((previous) => previous ?? dishList[0]?.id ?? null);
    setErrorMessage(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  const filteredDishes = useMemo(() => {
    if (activeCategoryId === "all") {
      return dishes;
    }

    return dishes.filter((dish) => dish.categoryId === activeCategoryId);
  }, [activeCategoryId, dishes]);

  const categoryNameById = useMemo(() => {
    return new Map(categories.map((category) => [String(category.id), category.name]));
  }, [categories]);

  const selectedDish = useMemo(() => {
    if (!selectedDishId) {
      return null;
    }

    return dishes.find((dish) => dish.id === selectedDishId) ?? null;
  }, [dishes, selectedDishId]);

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

    const titleValidationError = validateDishTitle(title);
    if (titleValidationError) {
      setErrorMessage(titleValidationError);
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
      formData.append("imageUrl", getSafeDishImageUrl(newDishImageUrl));
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
      setNewDishImageUrl(DEFAULT_DISH_IMAGE_URL);
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
    const titleValidationError = validateDishTitle(dish.title);
    if (titleValidationError) {
      throw new Error(titleValidationError);
    }

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
    formData.append("imageUrl", getSafeDishImageUrl(dish.imageUrl));
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

  const handleToggleDishActive = async (dish: EditableDish) => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedDish = { ...dish, isActive: !dish.isActive };
      const accessToken = await getAccessToken();

      const response = await fetch(`/api/admin/dishes/${dish.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: updatedDish.isActive }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to update dish status.");
      }

      setSuccessMessage(`${updatedDish.title} ${updatedDish.isActive ? "activated" : "disabled"}.`);
      await loadAdminData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update dish status.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDish = async (dish: EditableDish) => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const accessToken = await getAccessToken();

      const response = await fetch(`/api/admin/dishes/${dish.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? `Failed to delete ${dish.title}.`);
      }

      if (selectedDishId === dish.id) {
        setSelectedDishId(null);
      }

      setDishes((previous) => previous.filter((item) => item.id !== dish.id));
      setSuccessMessage(`Deleted: ${dish.title}`);
      await loadAdminData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete dish.");
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteDishModal = (dish: EditableDish) => {
    setDeleteDishTarget(dish);
    setIsDeleteDishModalOpen(true);
  };

  const closeDeleteDishModal = () => {
    setIsDeleteDishModalOpen(false);
    setDeleteDishTarget(null);
  };

  const confirmDeleteDish = async () => {
    const targetDish = deleteDishTarget;
    if (!targetDish) {
      return;
    }

    setIsDeleteDishModalOpen(false);
    setDeleteDishTarget(null);

    await handleDeleteDish(targetDish);
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

  const closeEditDishModal = () => {
    setIsEditDishModalOpen(false);
    setEditDishDraft(null);
    if (editDishImagePreview) {
      URL.revokeObjectURL(editDishImagePreview);
      setEditDishImagePreview(null);
    }
    setEditDishImageFile(null);
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

  const createModalImagePreview = newDishImagePreview ?? newDishImageUrl;
  const editModalImagePreview = editDishImagePreview ?? getSafeDishImageUrl(editDishDraft?.imageUrl);

  return {
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
    categories,
    filteredDishes,
    showCategoryManager,
    newCategoryName,
    activeCategoryId,
    selectedDish,
    selectedDishCategoryName: selectedDish ? categoryNameById.get(selectedDish.categoryId) ?? "No category" : null,

    isCreateDishModalOpen,
    isEditDishModalOpen,
    isDeleteDishModalOpen,
    editDishDraft,
    deleteDishTarget,

    newDishTitle,
    newDishPrice,
    newDishAvailability,
    createModalImagePreview,
    newDishCategoryId,
    newDishSelectedFileName: newDishImageFile?.name ?? null,

    editModalImagePreview,
    editDishSelectedFileName: editDishImageFile?.name ?? null,

    setShowCategoryManager,
    setNewCategoryName,
    setActiveCategoryId,

    setIsCreateDishModalOpen,
    setIsDeleteDishModalOpen,
    closeEditDishModal,
    closeDeleteDishModal,
    setEditDishDraft,

    setNewDishTitle,
    setNewDishPrice,
    setNewDishAvailability,
    setNewDishCategoryId,

    handleCreateCategory,
    handleCreateDish,
    handleSaveEditDish,
    handleToggleDishActive,
    openDeleteDishModal,
    confirmDeleteDish,
    openEditDishModal,
    handleCreateImageFileChange,
    handleEditImageFileChange,
  };
}
