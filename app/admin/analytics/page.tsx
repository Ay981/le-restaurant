"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FiDownload } from "react-icons/fi";
import AnalyticsSkeleton from "../_components/skeletons/AnalyticsSkeleton";
import { formatCurrency } from "@/lib/currency";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n/I18nProvider";

type TimeRange = "today" | "7d" | "30d";

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

type DishLiteRow = { title: string; image_url: string | null };

type TrendStats = {
  percent: number;
  isPositive: boolean;
};

const TIME_RANGE_OPTIONS: { key: TimeRange; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
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

function getPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function getTrendStats(currentValue: number, previousValue: number): TrendStats {
  if (previousValue <= 0) {
    return { percent: currentValue > 0 ? 100 : 0, isPositive: currentValue >= previousValue };
  }

  const delta = ((currentValue - previousValue) / previousValue) * 100;
  return { percent: Math.round(delta * 10) / 10, isPositive: delta >= 0 };
}

export default function AdminAnalyticsPage() {
  const { locale } = useI18n();
  const isAmharic = locale === "am";
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderAnalyticsRow[]>([]);
  const [dishes, setDishes] = useState<DishLiteRow[]>([]);
  const [range, setRange] = useState<TimeRange>("7d");

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
        ordersError || dishesError
          ? isAmharic
            ? "የቀጥታ ትንታኔ መጫን አልተቻለም። ለሙከራ ናሙና ውሂብ ታይቷል።"
            : "Live analytics failed to load. Showing sample data for testing."
          : isAmharic
            ? "ምንም የቀጥታ ትንታኔ አልተገኘም። ለሙከራ ናሙና ውሂብ ታይቷል።"
            : "No live analytics found. Showing sample data for testing.",
      );
      setIsLoading(false);
      return;
    }

    setOrders(fetchedOrders);
    setDishes(fetchedDishes);
    setErrorMessage(null);
    setIsLoading(false);
  }, [isAmharic]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAnalyticsData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadAnalyticsData]);

  const analytics = useMemo(() => {
    const filtered = filterOrdersByRange(orders, range);
    const currentStart = getRangeStart(range);
    const rangeDays = range === "today" ? 1 : range === "7d" ? 7 : 30;
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - rangeDays);

    const previousFiltered = orders.filter((order) => {
      const createdAt = new Date(order.created_at).getTime();
      return createdAt >= previousStart.getTime() && createdAt < currentStart.getTime();
    });

    const totalRevenue = filtered.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const totalOrders = filtered.length;
    const totalCustomers = new Set(filtered.map((order) => order.customer_user_id).filter(Boolean)).size;
    const deliveredOrders = filtered.filter((order) => order.status === "completed" || order.status === "served").length;
    const pendingOrders = filtered.filter((order) => order.status === "pending" || order.status === "preparing").length;
    const deliveredRevenue = filtered
      .filter((order) => order.status === "completed" || order.status === "served")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);

    const previousRevenue = previousFiltered.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const previousOrders = previousFiltered.length;
    const previousDeliveredRevenue = previousFiltered
      .filter((order) => order.status === "completed" || order.status === "served")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    const previousAvgOrderValue = previousOrders > 0 ? previousRevenue / previousOrders : 0;

    const dishImageByTitle = new Map(dishes.map((dish) => [dish.title.toLowerCase(), dish.image_url || "/image/pizza.png"]));

    const dishOrderCount = new Map<string, number>();
    for (const order of filtered) {
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

    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const ordersByWeekday = weekdayNames.map((name, index) => {
      const dayOrders = filtered.filter((order) => new Date(order.created_at).getDay() === index);
      const dayRevenue = dayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      return {
        name,
        orders: dayOrders.length,
        revenue: Math.round(dayRevenue),
      };
    });

    const mixedSeries = weekdayNames.map((name, index) => {
      const dayOrders = filtered.filter((order) => new Date(order.created_at).getDay() === index);
      const delivered = dayOrders.filter((order) => order.status === "completed" || order.status === "served").length;
      const pending = dayOrders.filter((order) => order.status === "pending" || order.status === "preparing").length;
      return { name, delivered, pending };
    });

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const soldMeals = mostOrdered.reduce((sum, item) => sum + item.count, 0);
    const completionRate = getPercent(deliveredOrders, totalOrders);
    const customerGrowth = Math.min(100, totalCustomers * 8);
    const revenueIndex = Math.min(100, Math.round((totalRevenue / 5000) * 100));

    const foodRows = mostOrdered.slice(0, 6).map((item) => ({
      ...item,
      popularity: getPercent(item.count, soldMeals),
    }));

    const trends = {
      revenue: getTrendStats(totalRevenue, previousRevenue),
      orders: getTrendStats(totalOrders, previousOrders),
      deliveredRevenue: getTrendStats(deliveredRevenue, previousDeliveredRevenue),
      avgOrderValue: getTrendStats(avgOrderValue, previousAvgOrderValue),
    };

    return {
      filtered,
      totalRevenue,
      totalOrders,
      totalCustomers,
      deliveredOrders,
      pendingOrders,
      avgOrderValue,
      completionRate,
      customerGrowth,
      revenueIndex,
      soldMeals,
      deliveredRevenue,
      mostOrdered: foodRows,
      ordersByWeekday,
      mixedSeries,
      trends,
    };
  }, [dishes, orders, range]);

  const downloadReport = () => {
    const header = ["Order Number", "Order Type", "Status", "Total", "Created At"];
    const rows = analytics.filtered.map((order) => [
      order.order_number,
      order.order_type,
      order.status,
      String(Number(order.total || 0)),
      order.created_at,
    ]);

    const csv = [header, ...rows].map((line) => line.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-report-${range}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <section className="space-y-4 text-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">{isAmharic ? "የሬስቶራንት ሽያጭ ሪፖርቶች" : "Restaurant Sales Reports"}</h1>
          <p className="mt-1 text-sm text-gray-300">{isAmharic ? "ለትዕዛዞች፣ ገቢ እና የደንበኛ እንቅስቃሴ የትንታኔ ዳሽቦርድ።" : "Analytics dashboard for orders, revenue, and customer activity."}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value as TimeRange)}
            className="app-bg-elevated rounded-lg border border-white/15 px-3 py-2 text-sm text-gray-100"
            aria-label="Analytics time range"
          >
            {TIME_RANGE_OPTIONS.map((option) => (
              <option key={option.key} value={option.key} className="bg-slate-900 text-white">
                {isAmharic ? option.key === "today" ? "ዛሬ" : option.key === "7d" ? "7 ቀናት" : "30 ቀናት" : option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={downloadReport}
            className="app-hover-accent-soft inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-gray-100"
          >
            <FiDownload />
            {isAmharic ? "ሪፖርት አስቀምጥ" : "Save Report"}
          </button>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
        <article className="app-bg-panel rounded-2xl border border-white/10 p-4">
          <h2 className="text-base font-semibold text-gray-100">{isAmharic ? "የትዕዛዝ ስርጭት" : "Order Distribution"}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { label: isAmharic ? "የደረሱ ትዕዛዞች" : "Delivered Orders", value: analytics.completionRate, color: "#f87171" },
              { label: isAmharic ? "የደንበኛ እድገት" : "Customer Growth", value: analytics.customerGrowth, color: "#34d399" },
              { label: isAmharic ? "ጠቅላላ ገቢ" : "Total Revenue", value: analytics.revenueIndex, color: "#60a5fa" },
            ].map((ring) => (
              <div key={ring.label} className="rounded-xl border border-white/10 p-3 text-center">
                <div className="mx-auto h-24 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "value", value: ring.value, fill: ring.color },
                          { name: "rest", value: Math.max(100 - ring.value, 0), fill: "rgba(255,255,255,0.08)" },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={26}
                        outerRadius={38}
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                        isAnimationActive={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#17192d",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 10,
                        }}
                        formatter={(value) => [`${value}%`, ring.label]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="-mt-14 text-xs font-semibold text-white">{ring.value}%</p>
                <p className="mt-8 text-xs text-gray-300">{ring.label}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="app-bg-panel rounded-2xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-100">{isAmharic ? "የትዕዛዞች አቅጣጫ" : "Orders Trend"}</h2>
            <button
              type="button"
              onClick={downloadReport}
              className="app-hover-accent-soft inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-gray-100"
            >
              <FiDownload />
              {isAmharic ? "ሪፖርት አስቀምጥ" : "Save Report"}
            </button>
          </div>

          <div className="mt-4 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.ordersByWeekday} margin={{ left: -12, right: 10, top: 6, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "#17192d", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10 }}
                  formatter={(value) => [`${value} ${isAmharic ? "ትዕዛዞች" : "orders"}`, isAmharic ? "ትዕዛዞች" : "Orders"]}
                />
                <Line type="monotone" dataKey="orders" stroke="#60a5fa" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="app-bg-panel rounded-2xl border border-white/10 p-4">
        <h2 className="text-base font-semibold text-gray-100">{isAmharic ? "በጣም የተሸጡ ምግቦች" : "Most Sold Foods"}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-180 text-left">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-3 py-2">{isAmharic ? "ምግብ" : "Food"}</th>
                <th className="px-3 py-2">{isAmharic ? "የተሸጠ ብዛት" : "Sold Qty"}</th>
                <th className="px-3 py-2">{isAmharic ? "ተወዳጅነት" : "Popularity"}</th>
                <th className="px-3 py-2">{isAmharic ? "ሁኔታ" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              {analytics.mostOrdered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-sm text-gray-400">
                    {isAmharic ? "ለዚህ ጊዜ ክልል ውሂብ የለም።" : "No data available for this range."}
                  </td>
                </tr>
              ) : (
                analytics.mostOrdered.map((food) => (
                  <tr key={food.title} className="border-t border-white/8 text-sm text-gray-200">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <Image src={food.imageUrl} alt={food.title} width={28} height={28} className="h-7 w-7 rounded-full" />
                        <span className="text-gray-100">{food.title}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-medium text-white">{food.count}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-gray-200">{food.popularity}%</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300">
                        {food.popularity >= 25 ? (isAmharic ? "በጣም ተፈላጊ" : "Hot") : food.popularity >= 12 ? (isAmharic ? "እየጨመረ" : "Rising") : isAmharic ? "የተረጋጋ" : "Steady"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-xs text-gray-400">{isAmharic ? "የተሸጡ ምግቦች" : "Meals Sold"}</p>
            <p className="mt-1 text-3xl font-semibold text-white">{analytics.soldMeals.toLocaleString()}</p>
            <p className={`mt-1 text-xs ${analytics.trends.orders.isPositive ? "text-emerald-300" : "text-rose-300"}`}>
              {analytics.trends.orders.isPositive ? "+" : ""}
              {analytics.trends.orders.percent}% {isAmharic ? "ከቀድሞ ጊዜ ጋር ንጽጽር" : "vs previous period"}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-xs text-gray-400">{isAmharic ? "ጠቅላላ ትርፍ" : "Total Profit"}</p>
            <p className="mt-1 text-3xl font-semibold text-white">{formatCurrency(analytics.totalRevenue)}</p>
            <p className={`mt-1 text-xs ${analytics.trends.revenue.isPositive ? "text-emerald-300" : "text-rose-300"}`}>
              {analytics.trends.revenue.isPositive ? "+" : ""}
              {analytics.trends.revenue.percent}% {isAmharic ? "ከቀድሞ ጊዜ ጋር ንጽጽር" : "vs previous period"}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-xs text-gray-400">{isAmharic ? "የተደረሰ ገቢ" : "Delivered Revenue"}</p>
            <p className="mt-1 text-3xl font-semibold text-white">{formatCurrency(analytics.deliveredRevenue)}</p>
            <p className={`mt-1 text-xs ${analytics.trends.deliveredRevenue.isPositive ? "text-emerald-300" : "text-rose-300"}`}>
              {analytics.trends.deliveredRevenue.isPositive ? "+" : ""}
              {analytics.trends.deliveredRevenue.percent}% {isAmharic ? "ከቀድሞ ጊዜ ጋር ንጽጽር" : "vs previous period"}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-xs text-gray-400">{isAmharic ? "አማካይ የትዕዛዝ ዋጋ" : "Avg Order Value"}</p>
            <p className="mt-1 text-3xl font-semibold text-white">{formatCurrency(analytics.avgOrderValue)}</p>
            <p className={`mt-1 text-xs ${analytics.trends.avgOrderValue.isPositive ? "text-emerald-300" : "text-rose-300"}`}>
              {analytics.trends.avgOrderValue.isPositive ? "+" : ""}
              {analytics.trends.avgOrderValue.percent}% {isAmharic ? "ከቀድሞ ጊዜ ጋር ንጽጽር" : "vs previous period"}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 p-4 xl:max-w-3xl">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-200">{isAmharic ? "ዴሊቨሪ ከመጠባበቅ ጋር አቅጣጫ" : "Delivery vs Pending Trend"}</h3>
            <div className="flex items-center gap-3 text-xs text-gray-300">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-300" /> {isAmharic ? "ተሰጥቷል" : "Delivered"}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-300" /> {isAmharic ? "በመጠባበቅ ላይ" : "Pending"}
              </span>
            </div>
          </div>

          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.mixedSeries} margin={{ left: -14, right: 8, top: 8, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "#17192d", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10 }}
                />
                <Area type="monotone" dataKey="pending" stroke="#fda4af" fill="#fda4af33" strokeWidth={2} />
                <Area type="monotone" dataKey="delivered" stroke="#6ee7b7" fill="#6ee7b733" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </article>

      {errorMessage ? <p className="text-sm text-amber-300">{errorMessage}</p> : null}
    </section>
  );
}
