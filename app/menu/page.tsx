import HomeDashboard from "@/app/_components/homepage/HomeDashboard";
import Sidenav from "@/components/navigation/Sidenav";
import {
  categories,
  dishes,
  orderSummary,
  orderTypes,
  restaurantInfo,
} from "@/lib/data";
import type { Dish } from "@/lib/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CategoryRow = {
  name: string;
  sort_order: number;
};

type DishRow = {
  title: string;
  price: number;
  image_url: string | null;
  availability_count: number;
  categories:
    | {
        name: string;
      }
    | Array<{
        name: string;
      }>
    | null;
};

async function getMenuData() {
  try {
    const supabase = createServerSupabaseClient();

    const [{ data: categoryData, error: categoryError }, { data: dishesData, error: dishesError }] =
      await Promise.all([
        supabase.from("categories").select("name, sort_order").order("sort_order", { ascending: true }),
        supabase
          .from("dishes")
          .select("title, price, image_url, availability_count, categories(name)")
          .eq("is_active", true)
          .order("created_at", { ascending: true }),
      ]);

    if (categoryError || dishesError || !categoryData || !dishesData) {
      return {
        menuCategories: [...categories],
        menuDishes: dishes,
      };
    }

    const menuCategories = (categoryData as CategoryRow[])
      .map((item) => item.name)
      .filter((item) => item.trim().length > 0);

    const menuDishes: Dish[] = (dishesData as DishRow[]).map((dishRow) => {
      const categoryName = Array.isArray(dishRow.categories)
        ? dishRow.categories[0]?.name
        : dishRow.categories?.name;

      return {
        title: dishRow.title,
        price: Number(dishRow.price),
        availability: `${dishRow.availability_count} Bowls available`,
        image: dishRow.image_url || "/image/pizza.png",
        categories: categoryName ? [categoryName] : [],
      };
    });

    return {
      menuCategories: menuCategories.length > 0 ? menuCategories : [...categories],
      menuDishes: menuDishes.length > 0 ? menuDishes : dishes,
    };
  } catch {
    return {
      menuCategories: [...categories],
      menuDishes: dishes,
    };
  }
}

function formatCurrentDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());
}

export default async function MenuPage() {
  const currentDate = formatCurrentDate();
  const { menuCategories, menuDishes } = await getMenuData();

  return (
    <main className="app-bg-main min-h-screen w-full text-white">
      <div className="app-bg-main flex min-h-screen w-full flex-col md:flex-row">
        <Sidenav />
        <HomeDashboard
          date={currentDate}
          restaurantInfo={restaurantInfo}
          categories={menuCategories}
          dishes={menuDishes}
          orderTypes={orderTypes}
          initialOrderItems={[]}
          initialOrderSummary={orderSummary}
        />
      </div>
    </main>
  );
}
