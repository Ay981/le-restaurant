import Card from "../Card";
import type { Dish } from "../../lib/data";
import Header from "./Header";

type MenuSectionProps = {
  restaurantName: string;
  date: string;
  searchPlaceholder: string;
  categories: string[];
  dishes: Dish[];
};

export default function MenuSection({
  restaurantName,
  date,
  searchPlaceholder,
  categories,
  dishes,
}: MenuSectionProps) {
  return (
    <section className="flex-1 px-8 pb-8 pt-5">
      <Header
        name={restaurantName}
        date={date}
        searchPlaceholder={searchPlaceholder}
      />

      <div className="mt-5 flex flex-wrap gap-9 border-b border-white/10 pb-4 text-lg">
        {categories.map((category, index) => (
          <button
            key={category}
            className={`relative pb-2 font-semibold transition-colors ${
              index === 0 ? "text-[#ea7c69]" : "text-gray-300 hover:text-white"
            }`}
          >
            {category}
            {index === 0 && (
              <span className="absolute inset-x-0 -bottom-4 h-1 rounded-full bg-[#ea7c69]" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-4xl font-semibold text-white">Choose Dishes</h2>
        <button className="rounded-xl border border-white/10 bg-[#1f1d2b] px-4 py-2 text-base text-gray-200">
          ˅ &nbsp;Dine In
        </button>
      </div>

      <div className="mt-16 flex flex-wrap items-start gap-x-8 gap-y-14">
        {dishes.map((dish) => (
          <Card
            key={dish.title}
            title={dish.title}
            price={dish.price}
            availability={dish.availability}
            image={dish.image}
          />
        ))}
      </div>
    </section>
  );
}
