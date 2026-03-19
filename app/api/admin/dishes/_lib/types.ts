export type DishPayload = {
  title?: string;
  price?: number;
  availabilityCount?: number;
  imageUrl?: string;
  categoryId?: number | null;
  imageFile?: File | null;
  isActive?: boolean;
};
