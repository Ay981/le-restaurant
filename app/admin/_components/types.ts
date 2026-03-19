export type CategoryRecord = {
  id: number;
  name: string;
  sort_order: number;
};

export type EditableDish = {
  id: string;
  title: string;
  price: string;
  availabilityCount: string;
  imageUrl: string;
  categoryId: string;
  isActive: boolean;
};

export const settingsNavItems = [
  { label: "Appearance", description: "Dark and Light mode, Font size" },
  { label: "Your Restaurant", description: "Business profile and info" },
  { label: "Products Management", description: "Manage your products and pricing" },
  { label: "Notifications", description: "Customize your notifications" },
  { label: "Security", description: "Configure password and PIN" },
  { label: "About", description: "Find out more about this app" },
] as const;
