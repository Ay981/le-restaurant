import MenuSection from "./component/homepage/MenuSection";
import OrdersPanel from "./component/homepage/OrdersPanel";
import Sidenav from "./component/homepage/Sidenav";
import {
  categories,
  dishes,
  orderItems,
  orderSummary,
  orderTypes,
  restaurantInfo,
} from "./lib/data";

export const dynamic = "force-dynamic";

function formatCurrentDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());
}

export default function Page() {
  const currentDate = formatCurrentDate();

  return (
    <main className="min-h-screen w-full bg-[#252836] text-white">
      <div className="flex min-h-screen w-full flex-col bg-[#252836] md:flex-row">
        <Sidenav />

        <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
          <MenuSection
            restaurantName={restaurantInfo.name}
            date={currentDate}
            searchPlaceholder={restaurantInfo.searchPlaceholder}
            categories={categories}
            dishes={dishes}
          />

          <OrdersPanel
            orderTypes={orderTypes}
            orderItems={orderItems}
            orderSummary={orderSummary}
          />
        </div>
      </div>
    </main>
  );
}