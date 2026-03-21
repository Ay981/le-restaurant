"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Barlow } from "next/font/google";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { FiSliders } from "react-icons/fi";
import AnalyticsSkeleton from "../_components/skeletons/AnalyticsSkeleton";
import { formatCurrency } from "@/lib/currency";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type TimeRange = "today" | "7d" | "30d";
type OrderStatusFilter = "all" | "completed" | "preparing" | "pending";

type OrderItemAnalyticsRow = {
  dish_title_snapshot: string;
  quantity: number;
};

type OrderAnalyticsRow = {
  id: string;
  order_number: string;
  order_type: "dine_in" | "to_go" | "delivery";
  status: string;
  total: number;
  created_at: string;
  customer_user_id: string | null;
  order_items: OrderItemAnalyticsRow[] | null;
};

type DishLiteRow = {
  title: string;
  image_url: string | null;
};

type TrendStats = {
  percent: number;
  isPositive: boolean;
};

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const TIME_RANGE_OPTIONS: { key: TimeRange; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
];

const CUSTOMER_NAME_POOL = [
  "Eren Jaegar",
  "Reiner Braun",
  "Levi Ackerman",
  "Historia Reiss",
  "Hanji Zoe",
  "Armin Arlert",
  "Mikasa Ackerman",
  "Jean Kirstein",
];

function daysAgoIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

const MOCK_DISHES: DishLiteRow[] = [
  { title: "Spicy seasoned seafood noodles", image_url: "/image/pizza.png" },
  { title: "Salted pasta with mushroom sauce", image_url: "/image/pizza.png" },
  { title: "Beef dumpling in hot and sour soup", image_url: "/image/pizza.png" },
  { title: "Hot spicy fried rice with omelet", image_url: "/image/pizza.png" },
  { title: "Chicken fried rice", image_url: "/image/pizza.png" },
];

const MOCK_ORDERS: OrderAnalyticsRow[] = [
  {
    id: "mock-1",
    order_number: "#A-1001",
    order_type: "dine_in",
    status: "completed",
    total: 125,
    created_at: daysAgoIso(6),
    customer_user_id: "c-1",
    order_items: [{ dish_title_snapshot: "Spicy seasoned seafood noodles", quantity: 2 }],
  },
  {
    id: "mock-2",
    order_number: "#A-1002",
    order_type: "delivery",
    status: "served",
    total: 145,
    created_at: daysAgoIso(5),
    customer_user_id: "c-2",
    order_items: [{ dish_title_snapshot: "Salted pasta with mushroom sauce", quantity: 2 }],
  },
  {
    id: "mock-3",
    order_number: "#A-1003",
    order_type: "to_go",
    status: "pending",
    total: 105,
    created_at: daysAgoIso(4),
    customer_user_id: "c-3",
    order_items: [{ dish_title_snapshot: "Beef dumpling in hot and sour soup", quantity: 1 }],
  },
  {
    id: "mock-4",
    order_number: "#A-1004",
    order_type: "dine_in",
    status: "completed",
    total: 45,
    created_at: daysAgoIso(3),
    customer_user_id: "c-4",
    order_items: [{ dish_title_snapshot: "Hot spicy fried rice with omelet", quantity: 1 }],
  },
  {
    id: "mock-5",
    order_number: "#A-1005",
    order_type: "delivery",
    status: "completed",
    total: 245,
    created_at: daysAgoIso(2),
    customer_user_id: "c-1",
    order_items: [{ dish_title_snapshot: "Spicy seasoned seafood noodles", quantity: 3 }],
  },
  {
    id: "mock-6",
    order_number: "#A-1006",
    order_type: "to_go",
    status: "preparing",
    total: 178,
    created_at: daysAgoIso(1),
    customer_user_id: "c-5",
    order_items: [{ dish_title_snapshot: "Chicken fried rice", quantity: 2 }],
  },
  {
    id: "mock-7",
    order_number: "#A-1007",
    order_type: "dine_in",
    status: "completed",
    total: 98,
    created_at: daysAgoIso(1),
    customer_user_id: "c-2",
    order_items: [{ dish_title_snapshot: "Salted pasta with mushroom sauce", quantity: 1 }],
  },
  {
    id: "mock-8",
    order_number: "#A-1008",
    order_type: "delivery",
    status: "completed",
    total: 210,
    created_at: daysAgoIso(0),
    customer_user_id: "c-6",
    order_items: [{ dish_title_snapshot: "Beef dumpling in hot and sour soup", quantity: 2 }],
  },
];

function getRangeStart(range: TimeRange) {
  const start = new Date();
  if (range === "today") {
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (range === "7d") {
    start.setDate(start.getDate() - 6);
  } else {
    start.setDate(start.getDate() - 29);
  }

  start.setHours(0, 0, 0, 0);
  return start;
}

function filterOrdersByRange(orders: OrderAnalyticsRow[], range: TimeRange) {
  const start = getRangeStart(range).getTime();
  return orders.filter((order) => new Date(order.created_at).getTime() >= start);
}

function getTrendStats(currentValue: number, previousValue: number): TrendStats {
  if (previousValue <= 0) {
    return { percent: currentValue > 0 ? 100 : 0, isPositive: currentValue >= previousValue };
  }

  const delta = ((currentValue - previousValue) / previousValue) * 100;
  return { percent: Math.round(delta * 10) / 10, isPositive: delta >= 0 };
}

function getCustomerName(customerId: string | null, index: number) {
  if (!customerId) return `Guest ${index + 1}`;
  const hash = customerId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return CUSTOMER_NAME_POOL[hash % CUSTOMER_NAME_POOL.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((segment) => segment[0])
    .join("")
    .toUpperCase();
}

function formatStatusLabel(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClass(status: string) {
  if (status === "completed" || status === "served") return "bg-emerald-500/20 text-emerald-300";
  if (status === "preparing") return "bg-indigo-500/20 text-indigo-300";
  if (status === "pending") return "bg-amber-500/20 text-amber-300";
  return "bg-white/10 text-gray-300";
}

function formatHeaderDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

export default function AdminAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderAnalyticsRow[]>([]);
  const [dishes, setDishes] = useState<DishLiteRow[]>([]);
  const [mostOrderedRange, setMostOrderedRange] = useState<TimeRange>("today");
  const [orderTypeRange, setOrderTypeRange] = useState<TimeRange>("today");
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");
  const [showAllMostOrdered, setShowAllMostOrdered] = useState(false);

  const loadAnalyticsData = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();

    const [{ data: ordersData, error: ordersError }, { data: dishesData, error: dishesError }] = await Promise.all([
      supabase
        .from("orders")
        .select("id, order_number, order_type, status, total, created_at, customer_user_id, order_items(dish_title_snapshot, quantity)")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase.from("dishes").select("title, image_url"),
    ]);

    const fetchedOrders = (ordersData ?? []) as OrderAnalyticsRow[];
    const fetchedDishes = (dishesData ?? []) as DishLiteRow[];

    if (ordersError || dishesError || fetchedOrders.length === 0) {
      setOrders(MOCK_ORDERS);
      setDishes(fetchedDishes.length > 0 ? fetchedDishes : MOCK_DISHES);
      setErrorMessage(
        ordersError || dishesError ? "Live analytics failed to load. Showing sample data for testing." : "No live analytics found. Showing sample data for testing.",
      );
      setIsLoading(false);
      return;
    }

    setOrders(fetchedOrders);
    setDishes(fetchedDishes);
    setErrorMessage(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAnalyticsData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadAnalyticsData]);

  const analytics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const totalOrders = orders.length;
    const totalCustomers = new Set(orders.map((order) => order.customer_user_id).filter(Boolean)).size;

    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - 6);
    currentStart.setHours(0, 0, 0, 0);

    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 7);

    const currentOrders = orders.filter((order) => new Date(order.created_at).getTime() >= currentStart.getTime());
    const previousOrders = orders.filter((order) => {
      const createdAt = new Date(order.created_at).getTime();
      return createdAt >= previousStart.getTime() && createdAt < currentStart.getTime();
    });

    const currentRevenue = currentOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    const currentCustomers = new Set(currentOrders.map((order) => order.customer_user_id).filter(Boolean)).size;
    const previousCustomers = new Set(previousOrders.map((order) => order.customer_user_id).filter(Boolean)).size;

    const trend = {
      revenue: getTrendStats(currentRevenue, previousRevenue),
      orders: getTrendStats(currentOrders.length, previousOrders.length),
      customers: getTrendStats(currentCustomers, previousCustomers),
    };

    const dishImageByTitle = new Map(dishes.map((dish) => [dish.title.toLowerCase(), dish.image_url || "/image/pizza.png"]));

    const mostOrderedOrders = filterOrdersByRange(orders, mostOrderedRange);
    const orderTypeOrders = filterOrdersByRange(orders, orderTypeRange);

    const dishOrderCount = new Map<string, number>();
    for (const order of mostOrderedOrders) {
      for (const item of order.order_items ?? []) {
        const key = item.dish_title_snapshot;
        dishOrderCount.set(key, (dishOrderCount.get(key) ?? 0) + Number(item.quantity || 0));
      }
    }

    const mostOrdered = [...dishOrderCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([title, count]) => ({
        title,
        count,
        imageUrl: dishImageByTitle.get(title.toLowerCase()) ?? "/image/pizza.png",
      }));

    const typeCounts = orderTypeOrders.reduce(
      (accumulator, order) => {
        if (order.order_type === "delivery") accumulator.delivery += 1;
        else if (order.order_type === "to_go") accumulator.toGo += 1;
        else accumulator.dineIn += 1;
        return accumulator;
      },
      { dineIn: 0, toGo: 0, delivery: 0 },
    );

    const orderTypeData = [
      { name: "Dine In", value: typeCounts.dineIn, color: "#fb7185" },
      { name: "To Go", value: typeCounts.toGo, color: "#fdba74" },
      { name: "Delivery", value: typeCounts.delivery, color: "#60a5fa" },
    ];

    const maxOrderTypeCount = Math.max(...orderTypeData.map((item) => item.value), 1);
    const orderTypeRings = orderTypeData.map((item, index) => ({
      ...item,
      innerRadius: 32 + index * 16,
      outerRadius: 40 + index * 16,
      data: [
        { name: item.name, value: item.value, fill: item.color },
        { name: "rest", value: Math.max(maxOrderTypeCount - item.value, 0), fill: "rgba(255,255,255,0.08)" },
      ],
    }));

    const reportRows = orders.slice(0, 9).map((order, index) => {
      const customerName = getCustomerName(order.customer_user_id, index);
      return {
        id: order.id,
        customerName,
        initials: getInitials(customerName),
        menu: order.order_items?.[0]?.dish_title_snapshot || "Order item",
        amount: Number(order.total || 0),
        status: order.status,
      };
    });

    const filteredReportRows =
      statusFilter === "all" ? reportRows : reportRows.filter((row) => row.status === statusFilter || (statusFilter === "completed" && row.status === "served"));

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      trend,
      mostOrdered,
      orderTypeData,
      orderTypeRings,
      reportRows: filteredReportRows,
    };
  }, [dishes, mostOrderedRange, orderTypeRange, orders, statusFilter]);

  const mostOrderedRows = showAllMostOrdered ? analytics.mostOrdered : analytics.mostOrdered.slice(0, 3);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className={`grid items-stretch gap-4 lg:min-h-[calc(100vh-2rem)] lg:grid-cols-[1fr_320px] ${barlow.className}`}>
      <section className="space-y-4 lg:h-full">
            <header>
              <h1 className="text-4xl font-semibold leading-none tracking-tight">Dashboard</h1>
              <p className="mt-2 text-lg text-gray-400">{formatHeaderDate()}</p>
            </header>

            <div className="grid gap-3 border-t border-white/10 pt-4 md:grid-cols-3">
              <article className="app-bg-panel rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-indigo-500/15 p-1.5 text-indigo-300">$</span>
                  <span className={`text-xs font-semibold ${analytics.trend.revenue.isPositive ? "text-emerald-300" : "text-rose-300"}`}>
                    {analytics.trend.revenue.isPositive ? "+" : "-"}
                    {Math.abs(analytics.trend.revenue.percent).toFixed(1)}%
                  </span>
                </div>
                <p className="mt-3 text-[2.2rem] leading-none font-semibold">{formatCurrency(analytics.totalRevenue)}</p>
                <p className="mt-2 text-base text-gray-400">Total Revenue</p>
              </article>

              <article className="app-bg-panel rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-rose-500/15 p-1.5 text-rose-300">#</span>
                  <span className={`text-xs font-semibold ${analytics.trend.orders.isPositive ? "text-emerald-300" : "text-rose-300"}`}>
                    {analytics.trend.orders.isPositive ? "+" : "-"}
                    {Math.abs(analytics.trend.orders.percent).toFixed(1)}%
                  </span>
                </div>
                <p className="mt-3 text-[2.2rem] leading-none font-semibold">{analytics.totalOrders.toLocaleString()}</p>
                <p className="mt-2 text-base text-gray-400">Total Dish Ordered</p>
              </article>

              <article className="app-bg-panel rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-cyan-500/15 p-1.5 text-cyan-300">👥</span>
                  <span className={`text-xs font-semibold ${analytics.trend.customers.isPositive ? "text-emerald-300" : "text-rose-300"}`}>
                    {analytics.trend.customers.isPositive ? "+" : "-"}
                    {Math.abs(analytics.trend.customers.percent).toFixed(1)}%
                  </span>
                </div>
                <p className="mt-3 text-[2.2rem] leading-none font-semibold">{analytics.totalCustomers.toLocaleString()}</p>
                <p className="mt-2 text-base text-gray-400">Total Customer</p>
              </article>
            </div>

            <article id="order-report" className="app-bg-panel rounded-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <h2 className="text-4xl font-semibold leading-none">Order Report</h2>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-base text-gray-200 hover:bg-white/5"
                  onClick={() => {
                    setStatusFilter((previous) => {
                      if (previous === "all") return "completed";
                      if (previous === "completed") return "preparing";
                      if (previous === "preparing") return "pending";
                      return "all";
                    });
                  }}
                >
                  <FiSliders />
                  Filter Order {statusFilter !== "all" ? `(${formatStatusLabel(statusFilter)})` : "(All)"}
                </button>
              </div>

              <div className="min-w-160 px-5 pb-4 pt-3">
                <div className="grid grid-cols-[1fr_1fr_0.7fr_0.6fr] border-b border-white/10 pb-2 text-sm font-medium text-gray-300">
                  <p>Customer</p>
                  <p>Menu</p>
                  <p>Total Payment</p>
                  <p>Status</p>
                </div>

                <div className="divide-y divide-white/8">
                  {analytics.reportRows.length === 0 ? (
                    <p className="py-6 text-sm text-gray-400">No orders available for this filter.</p>
                  ) : (
                    analytics.reportRows.map((row) => (
                      <div key={row.id} className="grid grid-cols-[1fr_1fr_0.7fr_0.6fr] items-center gap-3 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-gray-100">
                            {row.initials}
                          </span>
                          <p className="text-base text-gray-200">{row.customerName}</p>
                        </div>
                        <p className="text-base text-gray-300">{row.menu}</p>
                        <p className="text-base text-gray-200">{formatCurrency(row.amount)}</p>
                        <span className={`inline-flex w-fit rounded-full px-3 py-1 text-sm ${getStatusClass(row.status)}`}>
                          {formatStatusLabel(row.status)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </article>
          </section>

          <section className="space-y-4 lg:h-full">
            <article id="most-ordered" className="app-bg-panel rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-4xl font-semibold leading-none">Most Ordered</h3>
                <select
                  value={mostOrderedRange}
                  onChange={(event) => setMostOrderedRange(event.target.value as TimeRange)}
                  className="rounded-xl border border-white/15 bg-transparent px-2.5 py-2 text-base text-gray-100"
                  aria-label="Most ordered timeframe"
                >
                  {TIME_RANGE_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key} className="bg-slate-900 text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="space-y-4">
                  {mostOrderedRows.length === 0 ? (
                    <p className="text-sm text-gray-400">No dish trends in this range.</p>
                  ) : (
                    mostOrderedRows.map((item) => (
                      <div key={item.title} className="flex items-center gap-3">
                        <Image src={item.imageUrl} alt={item.title} width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
                        <div className="min-w-0">
                          <p className="truncate text-xl font-medium text-gray-100">{item.title}</p>
                          <p className="text-base text-gray-400">{item.count} dishes ordered</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  className="mt-5 w-full rounded-xl border border-rose-300/50 px-3 py-2.5 text-base font-medium text-rose-200 hover:bg-rose-300/10"
                  onClick={() => setShowAllMostOrdered((previous) => !previous)}
                >
                  {showAllMostOrdered ? "Show Less" : "View All"}
                </button>
              </div>
            </article>

            <article id="order-type" className="app-bg-panel rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-4xl font-semibold leading-none">Most Type of Order</h3>
                <select
                  value={orderTypeRange}
                  onChange={(event) => setOrderTypeRange(event.target.value as TimeRange)}
                  className="rounded-xl border border-white/15 bg-transparent px-2.5 py-2 text-base text-gray-100"
                  aria-label="Order type timeframe"
                >
                  {TIME_RANGE_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key} className="bg-slate-900 text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 grid grid-cols-[1fr_auto] items-center border-t border-white/10 pt-4">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      {analytics.orderTypeRings.map((ring) => (
                        <Pie
                          key={ring.name}
                          data={ring.data}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={ring.innerRadius}
                          outerRadius={ring.outerRadius}
                          startAngle={90}
                          endAngle={-270}
                          stroke="none"
                          isAnimationActive={false}
                        />
                      ))}
                      <Tooltip
                        contentStyle={{ background: "#17192d", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10 }}
                        formatter={(value) => [`${Number(value ?? 0)} customers`, "Count"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {analytics.orderTypeData.map((item) => (
                    <div key={item.name} className="flex items-start gap-2 text-base text-gray-200">
                      <span className="mt-1 h-4 w-4 rounded-full" style={{ backgroundColor: item.color }} />
                      <div>
                        <p className="text-xl font-medium">{item.name}</p>
                        <p className="text-base text-gray-400">{item.value} customers</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
      </section>

      {errorMessage ? <p className="text-sm text-red-300 lg:col-span-2">{errorMessage}</p> : null}
    </div>
  );
}
