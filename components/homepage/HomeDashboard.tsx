"use client";

import { useMemo, useState } from "react";
import MenuSection from "@/components/homepage/MenuSection";
import OrdersPanel from "@/components/homepage/OrdersPanel";
import type { Category, Dish, OrderItem, OrderSummary, RestaurantInfo } from "@/lib/data";

type HomeDashboardProps = {
  date: string;
  restaurantInfo: RestaurantInfo;
  categories: readonly Category[];
  dishes: Dish[];
  orderTypes: string[];
  initialOrderItems: OrderItem[];
  initialOrderSummary: OrderSummary;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function toShortTitle(title: string) {
  if (title.length <= 22) return title;
  return `${title.slice(0, 22).trim()}...`;
}

export default function HomeDashboard({
  date,
  restaurantInfo,
  categories,
  dishes,
  orderTypes,
  initialOrderItems,
  initialOrderSummary,
}: HomeDashboardProps) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>(initialOrderItems);
  const [selectedOrderType, setSelectedOrderType] = useState(orderTypes[0] ?? "Dine In");

  const orderSummary = useMemo<OrderSummary>(() => {
    const subtotal = roundCurrency(orderItems.reduce((sum, item) => sum + item.total, 0));

    return {
      ...initialOrderSummary,
      subtotal,
    };
  }, [initialOrderSummary, orderItems]);

  const handleAddDish = (dish: Dish) => {
    setOrderItems((previousItems) => {
      const existingItem = previousItems.find((item) => item.title === dish.title);

      if (existingItem) {
        return previousItems.map((item) => {
          if (item.title !== dish.title) {
            return item;
          }

          const quantity = item.quantity + 1;
          return {
            ...item,
            quantity,
            total: roundCurrency(quantity * item.price),
          };
        });
      }

      const newItem: OrderItem = {
        title: dish.title,
        shortTitle: toShortTitle(dish.title),
        price: dish.price,
        quantity: 1,
        total: roundCurrency(dish.price),
        note: "",
        image: dish.image,
      };

      return [newItem, ...previousItems];
    });
  };

  const handleRemoveOrderItem = (title: string) => {
    setOrderItems((previousItems) => previousItems.filter((item) => item.title !== title));
  };

  const handleNoteChange = (title: string, note: string) => {
    setOrderItems((previousItems) =>
      previousItems.map((item) => (item.title === title ? { ...item, note } : item))
    );
  };

  const handleQuantityChange = (title: string, delta: number) => {
    setOrderItems((previousItems) => {
      return previousItems
        .map((item) => {
          if (item.title !== title) {
            return item;
          }

          const quantity = item.quantity + delta;
          if (quantity <= 0) {
            return null;
          }

          return {
            ...item,
            quantity,
            total: roundCurrency(quantity * item.price),
          };
        })
        .filter((item): item is OrderItem => item !== null);
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
      <MenuSection
        restaurantName={restaurantInfo.name}
        date={date}
        searchPlaceholder={restaurantInfo.searchPlaceholder}
        categories={categories}
        dishes={dishes}
        onAddDish={handleAddDish}
        selectedOrderType={selectedOrderType}
      />

      <OrdersPanel
        orderTypes={orderTypes}
        selectedOrderType={selectedOrderType}
        orderItems={orderItems}
        orderSummary={orderSummary}
        onRemoveItem={handleRemoveOrderItem}
        onNoteChange={handleNoteChange}
        onQuantityChange={handleQuantityChange}
        onOrderTypeChange={setSelectedOrderType}
      />
    </div>
  );
}
