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

export type AnalyticsOrderTypeCounts = {
  dineIn: number;
  toGo: number;
  delivery: number;
};

export type AnalyticsMostOrderedItem = {
  title: string;
  count: number;
  imageUrl: string;
};

export type AnalyticsRecentOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  firstItemTitle: string;
};

export type AdminAnalytics = {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  completionRate: number;
  mostOrdered: AnalyticsMostOrderedItem[];
  orderTypeCounts: AnalyticsOrderTypeCounts;
  recentOrders: AnalyticsRecentOrder[];
};

export const settingsNavItems = [
  { label: "Appearance", description: "Dark and Light mode, Font size" },
  { label: "Your Restaurant", description: "Business profile and info" },
  { label: "Products Management", description: "Manage your products and pricing" },
  { label: "Notifications", description: "Customize your notifications" },
  { label: "Security", description: "Configure password and PIN" },
  { label: "About", description: "Find out more about this app" },
] as const;
