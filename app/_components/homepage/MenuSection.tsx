"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import type { Category, Dish } from "@/lib/data";
import Header from "./Header";
import AuthenticatedInsights from "./AuthenticatedInsights";
import RecommendationChat from "./RecommendationChat";

type MenuSectionProps = {
  restaurantName: string;
  date: string;
  searchPlaceholder: string;
  categories: readonly Category[];
  dishes: Dish[];
  onAddDish: (dish: Dish) => void;
  selectedOrderType: string;
};

type MenuFilter = Category | "All";

/**
 * Renders the menu section of the homepage, displaying the restaurant name, date,
 * search placeholder, categories, and a list of dishes. Includes a header, category
 * selection buttons, a "Choose Dishes" heading, a dine-in button, and a grid of dish cards.
 *
 * @param restaurantName - The name of the restaurant to display in the header.
 * @param date - The current date to display in the header.
 * @param searchPlaceholder - Placeholder text for the search input in the header.
 * @param categories - An array of category names for filtering dishes.
 * @param dishes - An array of dish objects to display as cards.
 */
export default function MenuSection({
  restaurantName,
  date,
  searchPlaceholder,
  categories,
  dishes,
  onAddDish,
  selectedOrderType,
}: MenuSectionProps) {
  const [activeCategory, setActiveCategory] = useState<MenuFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchedDishes, setSearchedDishes] = useState<Dish[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const categoryOptions: readonly MenuFilter[] = ["All", ...categories];

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  useEffect(() => {
    const controller = new AbortController();

    if (!debouncedSearchQuery) {
      setSearchedDishes([]);
      setSearchError(null);
      setIsSearching(false);
      return () => {
        controller.abort();
      };
    }

    const loadSearch = async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const response = await fetch(`/api/dishes/search?q=${encodeURIComponent(debouncedSearchQuery)}`, {
          signal: controller.signal,
        });

        const payload = (await response.json()) as { dishes?: Dish[]; message?: string };
        if (!response.ok) {
          throw new Error(payload.message ?? "Failed to search dishes.");
        }

        setSearchedDishes(payload.dishes ?? []);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setSearchError(error instanceof Error ? error.message : "Failed to search dishes.");
        setSearchedDishes([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    };

    void loadSearch();

    return () => {
      controller.abort();
    };
  }, [debouncedSearchQuery]);

  const visibleDishes = debouncedSearchQuery ? searchedDishes : dishes;

  const filteredDishes = useMemo(
    () =>
      activeCategory === "All"
        ? visibleDishes
        : visibleDishes.filter((dish) => dish.categories.includes(activeCategory)),
    [visibleDishes, activeCategory]
  );

  return (
    <section className="flex-1 px-4 pb-6 pt-4 md:px-8 md:pb-8 md:pt-5">
      <Header
        name={restaurantName}
        date={date}
        searchPlaceholder={searchPlaceholder}
        searchValue={searchQuery}
        isSearching={isSearching}
        onSearchChange={setSearchQuery}
      />

      <div className="mt-4 flex gap-6 overflow-x-auto border-b border-white/10 pb-4 text-base whitespace-nowrap md:mt-5 md:gap-9 md:text-lg">
        {categoryOptions.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`relative pb-2 font-semibold transition-colors ${
              activeCategory === category
                ? "app-text-accent"
                : "text-gray-300 hover:text-white"
            }`}
          >
            {category}
            {activeCategory === category && (
              <span className="app-bg-accent absolute inset-x-0 -bottom-4 h-1 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between md:mt-6">
        <h2 className="text-3xl font-semibold text-white md:text-4xl">Choose Dishes</h2>
        <button
          type="button"
          className="app-bg-panel rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-200"
        >
          ˅ &nbsp;{selectedOrderType}
        </button>
      </div>

      <AuthenticatedInsights />

      <RecommendationChat dishes={dishes} onAddDish={onAddDish} />

      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 md:grid-cols-3 md:gap-x-4 md:gap-y-8 lg:grid-cols-4 lg:gap-x-3 lg:gap-y-8">
        {filteredDishes.map((dish) => (
          <Card
            key={dish.title}
            title={dish.title}
            price={dish.price}
            availability={dish.availability}
            image={dish.image}
            onClick={() => onAddDish(dish)}
          />
        ))}
        {filteredDishes.length === 0 && (
          <p className="text-base text-gray-400">
            {debouncedSearchQuery
              ? "No dishes match your search."
              : "No dishes found for this category."}
          </p>
        )}
      </div>

      {searchError ? <p className="mt-3 text-sm text-amber-300">{searchError}</p> : null}
    </section>
  );
}
