"use client";

import { ProductsManagerPanel } from "./_components/panels";
import { CreateDishModal, EditDishModal } from "./_components/modals";
import ProductsSkeleton from "./_components/skeletons/ProductsSkeleton";
import { useAdminProductsManager } from "./_hooks/useAdminProductsManager";

export default function AdminPage() {
  const manager = useAdminProductsManager();

  if (manager.isLoading) {
    return <ProductsSkeleton />;
  }

  return (
    <>
      <ProductsManagerPanel
        categories={manager.categories}
        dishes={manager.filteredDishes}
        activeCategoryId={manager.activeCategoryId}
        showCategoryManager={manager.showCategoryManager}
        newCategoryName={manager.newCategoryName}
        isSaving={manager.isSaving}
        selectedDishTitle={manager.selectedDish?.title ?? null}
        selectedDishCategoryName={manager.selectedDishCategoryName}
        errorMessage={manager.errorMessage}
        successMessage={manager.successMessage}
        onToggleCategoryManager={() => manager.setShowCategoryManager((previous) => !previous)}
        onActiveCategoryChange={manager.setActiveCategoryId}
        onNewCategoryNameChange={manager.setNewCategoryName}
        onCreateCategory={manager.handleCreateCategory}
        onOpenCreateModal={() => manager.setIsCreateDishModalOpen(true)}
        onOpenEditModal={manager.openEditDishModal}
      />

      <CreateDishModal
        isOpen={manager.isCreateDishModalOpen}
        isSaving={manager.isSaving}
        categories={manager.categories}
        title={manager.newDishTitle}
        price={manager.newDishPrice}
        availability={manager.newDishAvailability}
        imagePreview={manager.createModalImagePreview || "/image/pizza.png"}
        categoryId={manager.newDishCategoryId}
        selectedFileName={manager.newDishSelectedFileName}
        onClose={() => manager.setIsCreateDishModalOpen(false)}
        onSubmit={manager.handleCreateDish}
        onTitleChange={manager.setNewDishTitle}
        onPriceChange={manager.setNewDishPrice}
        onAvailabilityChange={manager.setNewDishAvailability}
        onCategoryChange={manager.setNewDishCategoryId}
        onImageFileChange={manager.handleCreateImageFileChange}
      />

      <EditDishModal
        isOpen={manager.isEditDishModalOpen}
        isSaving={manager.isSaving}
        categories={manager.categories}
        draft={manager.editDishDraft}
        imagePreview={manager.editModalImagePreview}
        selectedFileName={manager.editDishSelectedFileName}
        onClose={manager.closeEditDishModal}
        onSubmit={manager.handleSaveEditDish}
        onDraftChange={(updater) => manager.setEditDishDraft((previous) => (previous ? updater(previous) : previous))}
        onImageFileChange={manager.handleEditImageFileChange}
      />
    </>
  );
}
