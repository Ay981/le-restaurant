import HomeDashboard from "@/app/_components/homepage/HomeDashboard";
import Sidenav from "@/components/navigation/Sidenav";
import {
  categories,
  restaurantInfo,
} from "@/lib/data";
import type { Dish } from "@/lib/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getServerLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

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
  is_active: boolean;
  categories:
    | {
        name: string;
      }
    | Array<{
        name: string;
      }>
    | null;
};

const categoryTranslations: Record<string, { en: string; am: string }> = {
  "Hot Dishes": { en: "Hot Dishes", am: "ትኩስ ምግቦች" },
  "Cold Dishes": { en: "Cold Dishes", am: "ቀዝቃዛ ምግቦች" },
  Soup: { en: "Soup", am: "ሾርባ" },
  Grill: { en: "Grill", am: "ግሪል" },
  Appetizer: { en: "Appetizer", am: "መነሻ ምግብ" },
  Dessert: { en: "Dessert", am: "ጣፋጭ" },
};

function translateCategory(name: string, locale: Locale) {
  const translation = categoryTranslations[name];
  if (!translation) {
    return name;
  }

  return locale === "am" ? translation.am : translation.en;
}

function mapOrderTypes(locale: Locale): string[] {
  if (locale === "am") {
    return ["በሬስቶራንት", "ለመውሰድ", "ዴሊቨሪ"];
  }

  return ["Dine In", "To Go", "Delivery"];
}

function mapRestaurantInfo(locale: Locale) {
  if (locale === "am") {
    return {
      name: "የእኛ ሬስቶራንት",
      searchPlaceholder: "ምግብ፣ ቡና ወዘተ ይፈልጉ...",
    };
  }

  return {
    name: restaurantInfo.name,
    searchPlaceholder: restaurantInfo.searchPlaceholder,
  };
}

async function getMenuData(locale: Locale) {
  try {
    const supabase = createServerSupabaseClient();

    const [{ data: categoryData, error: categoryError }, { data: dishesData, error: dishesError }] =
      await Promise.all([
        supabase.from("categories").select("name, sort_order").order("sort_order", { ascending: true }),
        supabase
          .from("dishes")
          .select("title, price, image_url, availability_count, is_active, categories(name)")
          .order("created_at", { ascending: true }),
      ]);

    if (categoryError || dishesError || !categoryData || !dishesData) {
      return {
        menuCategories: [...categories],
        menuDishes: [],
      };
    }

    const menuCategories = (categoryData as CategoryRow[])
      .map((item) => translateCategory(item.name, locale))
      .filter((item) => item.trim().length > 0);

    const menuDishes: Dish[] = (dishesData as DishRow[]).map((dishRow) => {
      const categoryName = Array.isArray(dishRow.categories)
        ? dishRow.categories[0]?.name
        : dishRow.categories?.name;

      return {
        title: dishRow.title,
        price: Number(dishRow.price),
        availability:
          locale === "am"
            ? `${dishRow.availability_count} ሳህኖች ይገኛሉ`
            : `${dishRow.availability_count} Bowls available`,
        image: dishRow.image_url || "/image/pizza.png",
        categories: categoryName ? [translateCategory(categoryName, locale)] : [],
        isActive: dishRow.is_active,
      };
    });

    return {
      menuCategories:
        menuCategories.length > 0 ? menuCategories : categories.map((category) => translateCategory(category, locale)),
      menuDishes,
    };
  } catch {
    return {
      menuCategories: categories.map((category) => translateCategory(category, locale)),
      menuDishes: [],
    };
  }
}

function formatCurrentDate(locale: Locale) {
  return new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());
}

export default async function MenuPage() {
  const locale = await getServerLocale();
  const currentDate = formatCurrentDate(locale);
  const { menuCategories, menuDishes } = await getMenuData(locale);
  const localizedRestaurantInfo = mapRestaurantInfo(locale);
  const localizedOrderTypes = mapOrderTypes(locale);

  return (
    <main className="app-bg-main min-h-screen w-full text-white">
      <div className="app-bg-main flex min-h-screen w-full flex-col md:flex-row">
        <Sidenav />
        <HomeDashboard
          date={currentDate}
          restaurantInfo={localizedRestaurantInfo}
          categories={menuCategories}
          dishes={menuDishes}
          orderTypes={localizedOrderTypes}
          initialOrderItems={[]}
          initialOrderSummary={{
            orderNumber: "",
            discount: 0,
            subtotal: 0,
          }}
        />
      </div>
    </main>
  );
}
