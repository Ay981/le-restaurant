import HomeDashboard from "@/components/homepage/HomeDashboard";
import Sidenav from "@/components/navigation/Sidenav";
import {
  categories,
  dishes,
  orderItems,
  orderSummary,
  orderTypes,
  restaurantInfo,
} from "@/lib/data";

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
    <main className="app-bg-main min-h-screen w-full text-white">
      <div className="app-bg-main flex min-h-screen w-full flex-col md:flex-row">
        <Sidenav />
        <HomeDashboard
          date={currentDate}
          restaurantInfo={restaurantInfo}
          categories={categories}
          dishes={dishes}
          orderTypes={orderTypes}
          initialOrderItems={orderItems}
          initialOrderSummary={orderSummary}
        />
      </div>
    </main>
  );
}