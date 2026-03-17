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
    <section className="flex-1 px-4 pb-6 pt-4 md:px-8 md:pb-8 md:pt-5">
      <Header
        name={restaurantName}
        date={date}
        searchPlaceholder={searchPlaceholder}
      />

      <div className="mt-4 flex gap-6 overflow-x-auto border-b border-white/10 pb-4 text-base whitespace-nowrap md:mt-5 md:gap-9 md:text-lg">
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

      <div className="mt-5 flex items-center justify-between md:mt-6">
        <h2 className="text-3xl font-semibold text-white md:text-4xl">Choose Dishes</h2>
        <button className="rounded-xl border border-white/10 bg-[#1f1d2b] px-4 py-2 text-base text-gray-200">
          ˅ &nbsp;Dine In
        </button>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-8 sm:justify-start md:gap-x-6 md:gap-y-10">
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
