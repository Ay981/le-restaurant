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

export default function Page() {
  return (
    <main className="min-h-screen w-full bg-[#252836] text-white">
      <div className="flex min-h-screen w-full overflow-hidden bg-[#252836]">
        <Sidenav />

        <div className="flex min-h-screen flex-1">
          <MenuSection
            restaurantName={restaurantInfo.name}
            date={restaurantInfo.date}
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