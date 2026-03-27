"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatCurrency } from "@/lib/currency";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

type UiOrderStatus = "pending" | "in_progress" | "delivered";

type AdminOrder = {
  id: string;
  orderNumber: string;
  orderType: "dine_in" | "to_go" | "delivery";
  status: UiOrderStatus;
  total: number;
  createdAt: string;
  startedAt?: string | null;
  deliveredAt?: string | null;
  note: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  items?: Array<{
    dishTitle: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    note: string | null;
  }>;
  feedback?: {
    comment: string;
    status: "open" | "resolved";
    adminNote: string | null;
    resolvedAt: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

type OrdersResponse = {
  orders?: AdminOrder[];
  alerts?: {
    pendingReceiptReviews: number;
  };
  message?: string;
};

function formatDateTime(isoValue: string, locale: "en" | "am") {
  return new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoValue));
}

function calculateWaitTime(createdAt: string): string {
  const diffMins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min`;
  const hours = Math.floor(diffMins / 60);
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

export default function AdminOrdersPage() {
  const { locale } = useI18n();
  const isAmharic = locale === "am";

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [pendingReceiptReviewCount, setPendingReceiptReviewCount] = useState(0);

  const getAccessToken = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) {
      throw new Error(isAmharic ? "ትዕዛዞችን ለማግኘት መግባት አለብዎት።" : "You must be signed in to access orders.");
    }

    return accessToken;
  }, [isAmharic]);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch("/api/admin/orders", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = (await response.json()) as OrdersResponse;
      if (!response.ok) {
        throw new Error(payload.message ?? (isAmharic ? "ትዕዛዞችን መጫን አልተቻለም።" : "Failed to load orders."));
      }

      const liveOrders = payload.orders ?? [];
      if (liveOrders.length === 0) {
        setOrders([]);
        setPendingReceiptReviewCount(0);
        setInfoMessage(isAmharic ? "ምንም የቀጥታ ትዕዛዝ አልተገኘም።" : "No live orders found.");
        return;
      }

      setOrders(liveOrders);
      setPendingReceiptReviewCount(payload.alerts?.pendingReceiptReviews ?? 0);
    } catch (error) {
      setOrders([]);
      setPendingReceiptReviewCount(0);
      setInfoMessage(null);
      setErrorMessage(error instanceof Error ? error.message : isAmharic ? "ትዕዛዞችን መጫን አልተቻለም።" : "Failed to load orders.");
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, isAmharic]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleStartOrder = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: "in_progress" }),
      });

      const payload = (await response.json()) as { status?: UiOrderStatus; message?: string };
      if (!response.ok || !payload.status) {
        throw new Error(payload.message ?? (isAmharic ? "ትዕዛዙ ሊጀምር አልቻለም።" : "Failed to start order."));
      }

      setOrders((previous) => previous.map((order) => (order.id === orderId ? { ...order, status: "in_progress" } : order)));
      const message = isAmharic ? "ትዕዛዙ ተጀምሮአል።" : "Order started.";
      setSuccessMessage(message);
      showSuccessToast({ message });
    } catch (error) {
      const message = error instanceof Error ? error.message : isAmharic ? "ትዕዛዙ ሊጀምር አልቻለም።" : "Failed to start order.";
      setErrorMessage(message);
      showErrorToast({ message });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const totals = useMemo(() => {
    const pending = orders.filter((order) => order.status === "pending").length;
    const inProgress = orders.filter((order) => order.status === "in_progress").length;
    const delivered = orders.filter((order) => order.status === "delivered").length;
    return { pending, inProgress, delivered };
  }, [orders]);

  const ordersByStatus = useMemo(
    () => ({
      pending: orders.filter((order) => order.status === "pending").sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      in_progress: orders.filter((order) => order.status === "in_progress").sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      delivered: orders.filter((order) => order.status === "delivered").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    }),
    [orders],
  );

  const getOrderTypeLabel = (orderType: AdminOrder["orderType"]) => {
    if (orderType === "dine_in") return isAmharic ? "በሬስቶራንት" : "Dine in";
    if (orderType === "to_go") return isAmharic ? "ለመውሰድ" : "To go";
    return isAmharic ? "ዴሊቨሪ" : "Delivery";
  };

  const getTableLabel = (order: AdminOrder) => {
    if (order.orderType !== "dine_in") return null;
    const extracted = order.note?.match(/table\s*([\w-]+)/i)?.[1];
    return extracted ? `Table ${extracted}` : getOrderTypeLabel(order.orderType);
  };

  const sectionConfig: Array<{
    key: UiOrderStatus;
    title: string;
    orders: AdminOrder[];
    detailBorderClass: string;
  }> = [
    {
      key: "pending",
      title: isAmharic ? "በመጠባበቅ — ሳይወቅቱ መጀመሪያ" : "Pending — Oldest First",
      orders: ordersByStatus.pending,
      detailBorderClass: "border-amber-500/15",
    },
    {
      key: "in_progress",
      title: isAmharic ? "በሂደት ላይ" : "In Progress",
      orders: ordersByStatus.in_progress,
      detailBorderClass: "border-blue-500/15",
    },
    {
      key: "delivered",
      title: isAmharic ? "ተሰጥቷል" : "Delivered",
      orders: ordersByStatus.delivered,
      detailBorderClass: "border-emerald-500/15",
    },
  ];

  return (
    <section className="app-bg-panel h-full space-y-5 rounded-2xl border border-white/10 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{isAmharic ? "የአሁኑ ትዕዛዞች" : "Current Orders"}</h1>
          <p className="mt-1 text-sm text-gray-400">{isAmharic ? "የቀጥታ ትዕዛዞችን በቀላሉ ይቆጣጠሩ" : "A live operational board for active restaurant orders."}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            void loadOrders();
          }}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/10"
        >
          {isAmharic ? "አድስ" : "Refresh"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">{isAmharic ? "በመጠባበቅ ላይ" : "Pending"}</p>
          <p className="mt-1 text-2xl font-semibold text-white">{totals.pending}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">{isAmharic ? "በሂደት ላይ" : "In Progress"}</p>
          <p className="mt-1 text-2xl font-semibold text-white">{totals.inProgress}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">{isAmharic ? "ተሰጥቷል" : "Delivered"}</p>
          <p className="mt-1 text-2xl font-semibold text-white">{totals.delivered}</p>
        </div>
      </div>

      {pendingReceiptReviewCount > 0 ? (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-200">
          {isAmharic ? `${pendingReceiptReviewCount} የደረሰኝ ግምገማ በመጠባበቅ ላይ` : `${pendingReceiptReviewCount} receipt reviews pending`}
        </p>
      ) : null}

      {errorMessage ? <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">{errorMessage}</p> : null}
      {infoMessage ? <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">{infoMessage}</p> : null}
      {successMessage ? <p className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-200">{successMessage}</p> : null}

      {isLoading ? (
        <div className="space-y-3 py-12 text-center">
          <div className="inline-block animate-spin">
            <svg className="h-8 w-8 text-white/40" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">{isAmharic ? "ትዕዛዞች በመጫን ላይ..." : "Loading orders..."}</p>
        </div>
      ) : null}

      {!isLoading && orders.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
          <p className="text-gray-400">{isAmharic ? "የአሁኑ ትዕዛዞች አልተገኙም" : "No current orders found"}</p>
        </div>
      ) : null}

      {!isLoading && orders.length > 0 ? (
        <div className="space-y-7">
          {sectionConfig.map((section) => {
            if (section.orders.length === 0) return null;

            return (
              <div key={section.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">{section.title}</h2>
                  <span className="text-xs text-gray-500">{section.orders.length}</span>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  <div className="hidden grid-cols-[1.35fr_1fr_.8fr_.8fr_auto] gap-3 border-b border-white/10 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-gray-500 md:grid">
                    <p>{isAmharic ? "ትዕዛዝ" : "Order"}</p>
                    <p>{isAmharic ? "ደንበኛ" : "Customer"}</p>
                    <p>{isAmharic ? "ንጥሎች" : "Items"}</p>
                    <p>{isAmharic ? "ጠቅላላ" : "Total"}</p>
                    <p className="text-right">{isAmharic ? "እርምጃ" : "Actions"}</p>
                  </div>

                  <div className="divide-y divide-white/10">
                    {section.orders.map((order) => {
                      const isExpanded = expandedOrderId === order.id;
                      const tableLabel = getTableLabel(order);
                      const waitBaseTime = section.key === "in_progress" ? order.startedAt || order.createdAt : order.createdAt;

                      return (
                        <article key={order.id} className="px-4 py-3">
                          <div className="grid gap-3 md:grid-cols-[1.35fr_1fr_.8fr_.8fr_auto] md:items-center">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">{order.orderNumber}</p>
                              <p className="mt-1 text-xs text-gray-500">
                                {tableLabel ?? getOrderTypeLabel(order.orderType)} • {formatDateTime(order.createdAt, locale)}
                              </p>
                              {section.key !== "delivered" ? (
                                <p className="mt-1 text-xs text-gray-500">
                                  {section.key === "pending" ? (isAmharic ? "መጠባበቂያ" : "Waiting") : isAmharic ? "በሂደት" : "In progress"} {calculateWaitTime(waitBaseTime)}
                                </p>
                              ) : null}
                            </div>

                            <div className="text-sm text-gray-300">
                              <p>{order.customerName ?? "-"}</p>
                              <p className="text-xs text-gray-500">{order.customerPhone ?? "-"}</p>
                            </div>

                            <p className="text-sm text-gray-300">{order.items?.length ?? 0} {isAmharic ? "ንጥሎች" : "items"}</p>
                            <p className="text-sm font-medium text-gray-200">{formatCurrency(order.total)}</p>

                            <div className="flex items-center justify-start gap-2 md:justify-end">
                              {section.key === "pending" ? (
                                <button
                                  type="button"
                                  onClick={() => void handleStartOrder(order.id)}
                                  disabled={updatingOrderId === order.id}
                                  className="rounded-md bg-amber-600/80 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {updatingOrderId === order.id ? "..." : isAmharic ? "ጀምር" : "Start"}
                                </button>
                              ) : null}

                              <button
                                type="button"
                                onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                className="rounded-md border border-white/20 bg-transparent px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10"
                              >
                                {isExpanded ? (isAmharic ? "ደብቅ" : "Hide") : isAmharic ? "ይዤ" : "View"}
                              </button>
                            </div>
                          </div>

                          {isExpanded ? (
                            <div className={`mt-3 space-y-4 border-t pt-3 ${section.detailBorderClass}`}>
                              <div>
                                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{isAmharic ? "የትዕዛዝ ንጥሎች" : "Order items"}</h4>
                                {order.items && order.items.length > 0 ? (
                                  <div className="mt-2 grid gap-1">
                                    {order.items.map((item, idx) => (
                                      <div key={`${order.id}-${item.dishTitle}-${idx}`} className="flex items-center justify-between text-sm text-gray-300">
                                        <span>{item.dishTitle} <span className="text-gray-500">×{item.quantity}</span></span>
                                        <span>{formatCurrency(item.lineTotal ?? item.unitPrice * item.quantity)}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="mt-2 text-sm text-gray-500">{isAmharic ? "ዝርዝር የለም" : "No item details"}</p>
                                )}
                              </div>

                              <div className="grid gap-2 text-sm text-gray-300 sm:grid-cols-2">
                                <p>{order.customerName ?? "-"}</p>
                                <p>{order.customerPhone ?? "-"}</p>
                                <p className="sm:col-span-2 text-gray-400">{order.deliveryAddress ?? "-"}</p>
                              </div>

                              {order.feedback ? (
                                <div>
                                  <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{isAmharic ? "አስተያየት" : "Feedback"}</h4>
                                  <p className="mt-1 text-sm text-gray-300">{order.feedback.comment}</p>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
