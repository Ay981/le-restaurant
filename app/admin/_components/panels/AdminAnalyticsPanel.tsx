import Image from "next/image";
import { formatCurrency } from "@/lib/currency";
import type { AdminAnalytics } from "../types";

type AdminAnalyticsPanelProps = {
  analytics: AdminAnalytics;
};

function formatOrderTypeLabel(type: "dineIn" | "toGo" | "delivery") {
  if (type === "dineIn") return "Dine In";
  if (type === "toGo") return "To Go";
  return "Delivery";
}

function formatStatusLabel(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(dateValue));
}

export default function AdminAnalyticsPanel({ analytics }: AdminAnalyticsPanelProps) {
  const orderTypeEntries = [
    { key: "dineIn" as const, colorClass: "app-bg-accent", count: analytics.orderTypeCounts.dineIn },
    { key: "toGo" as const, colorClass: "bg-white/70", count: analytics.orderTypeCounts.toGo },
    { key: "delivery" as const, colorClass: "bg-white/40", count: analytics.orderTypeCounts.delivery },
  ];

  const totalTypeCount = orderTypeEntries.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="mt-3 grid gap-3 lg:grid-cols-[1.5fr_0.9fr]">
      <div className="app-bg-panel rounded-2xl p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="app-bg-main rounded-xl border border-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">Total Revenue</p>
            <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(analytics.totalRevenue)}</p>
          </article>

          <article className="app-bg-main rounded-xl border border-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">Total Orders</p>
            <p className="mt-2 text-2xl font-semibold text-white">{analytics.totalOrders.toLocaleString()}</p>
          </article>

          <article className="app-bg-main rounded-xl border border-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">Total Customers</p>
            <p className="mt-2 text-2xl font-semibold text-white">{analytics.totalCustomers.toLocaleString()}</p>
          </article>

          <article className="app-bg-main rounded-xl border border-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">Completion Rate</p>
            <p className="mt-2 text-2xl font-semibold text-white">{analytics.completionRate.toFixed(1)}%</p>
          </article>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-xl font-semibold text-white">Order Report</h3>
            <span className="rounded-lg border border-white/10 px-3 py-1 text-xs text-gray-300">Recent</span>
          </div>

          <div className="mt-3 space-y-2">
            {analytics.recentOrders.length === 0 ? (
              <p className="text-sm text-gray-400">No orders yet. Analytics will populate once orders are placed.</p>
            ) : (
              analytics.recentOrders.map((order) => (
                <div key={order.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-white/8 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-100">{order.firstItemTitle}</p>
                    <p className="text-xs text-gray-400">
                      {order.orderNumber} • {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-200">{formatCurrency(order.total)}</p>
                  <span className="rounded-full border border-white/12 px-2 py-1 text-xs text-gray-300">
                    {formatStatusLabel(order.status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <aside className="app-bg-panel rounded-2xl p-4">
          <h3 className="text-2xl font-semibold text-white">Most Ordered</h3>

          <div className="mt-4 space-y-3">
            {analytics.mostOrdered.length === 0 ? (
              <p className="text-sm text-gray-400">No dish order trends yet.</p>
            ) : (
              analytics.mostOrdered.map((item) => (
                <div key={item.title} className="flex items-center gap-3 rounded-lg border border-white/8 p-2">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-100">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.count} dishes ordered</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <aside className="app-bg-panel rounded-2xl p-4">
          <h3 className="text-2xl font-semibold text-white">Most Type of Order</h3>

          <div className="mt-4 space-y-3">
            {orderTypeEntries.map((item) => {
              const percent = totalTypeCount === 0 ? 0 : (item.count / totalTypeCount) * 100;

              return (
                <div key={item.key}>
                  <div className="mb-1 flex items-center justify-between text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.colorClass}`} />
                      <span>{formatOrderTypeLabel(item.key)}</span>
                    </div>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${item.colorClass}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}
