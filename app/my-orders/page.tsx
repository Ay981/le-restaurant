"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency } from "@/lib/currency";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type UiOrderStatus = "pending" | "in_progress" | "delivered" | "rejected" | "unknown";

type CustomerOrder = {
  id: string;
  orderNumber: string;
  orderType: "dine_in" | "to_go" | "delivery";
  status: UiOrderStatus;
  total: number;
  createdAt: string;
  startedAt: string | null;
  deliveredAt: string | null;
  note: string | null;
  adminDecisionNote: string | null;
  items: Array<{
    dishTitle: string;
    quantity: number;
    lineTotal: number;
  }>;
};

type OrderRow = {
  id: string;
  order_number: string;
  order_type: "dine_in" | "to_go" | "delivery";
  status: string;
  total: number;
  created_at: string;
  started_at: string | null;
  delivered_at: string | null;
  note: string | null;
  admin_decision_note: string | null;
  order_items:
    | Array<{
        dish_title_snapshot: string;
        quantity: number;
        line_total: number;
      }>
    | null;
};

type FeedbackEntry = {
  id: number;
  orderId: string;
  comment: string;
  status: "open" | "resolved";
  adminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type OrderNotification = {
  id: number;
  orderId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
};

function toUiStatus(status: string): UiOrderStatus {
  if (status === "pending") return "pending";
  if (status === "preparing") return "in_progress";
  if (status === "cancelled") return "rejected";
  if (status === "served" || status === "completed") return "delivered";
  return "unknown";
}

function statusLabel(status: UiOrderStatus) {
  if (status === "pending") return "Pending";
  if (status === "in_progress") return "Accepted";
  if (status === "delivered") return "Delivered";
  if (status === "rejected") return "Rejected";
  return "Unknown";
}

function statusClass(status: UiOrderStatus) {
  if (status === "pending") return "bg-amber-500/20 text-amber-300";
  if (status === "in_progress") return "bg-indigo-500/20 text-indigo-300";
  if (status === "delivered") return "bg-emerald-500/20 text-emerald-300";
  if (status === "rejected") return "bg-rose-500/20 text-rose-300";
  return "bg-gray-500/20 text-gray-300";
}

function formatOrderType(orderType: CustomerOrder["orderType"]) {
  if (orderType === "dine_in") return "Dine In";
  if (orderType === "to_go") return "To Go";
  return "Delivery";
}

function formatDateTime(isoValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoValue));
}

export default function MyOrdersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [feedbackByOrderId, setFeedbackByOrderId] = useState<Record<string, FeedbackEntry>>({});
  const [feedbackDraftByOrderId, setFeedbackDraftByOrderId] = useState<Record<string, string>>({});
  const [submittingFeedbackOrderId, setSubmittingFeedbackOrderId] = useState<string | null>(null);
  const [isMarkingNotificationsRead, setIsMarkingNotificationsRead] = useState(false);
  const previousStatusByOrder = useRef<Map<string, UiOrderStatus>>(new Map());

  const getAccessToken = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  const loadOrders = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setIsAuthenticated(false);
      setOrders([]);
      setNotifications([]);
      setFeedbackByOrderId({});
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    setIsAuthenticated(true);

    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, order_type, status, total, created_at, started_at, delivered_at, note, admin_decision_note, order_items(dish_title_snapshot, quantity, line_total)",
      )
      .eq("customer_user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    const mapped = ((data ?? []) as OrderRow[]).map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      orderType: order.order_type,
      status: toUiStatus(order.status),
      total: Number(order.total) || 0,
      createdAt: order.created_at,
      startedAt: order.started_at,
      deliveredAt: order.delivered_at,
      note: order.note,
      adminDecisionNote: order.admin_decision_note,
      items: (order.order_items ?? []).map((item) => ({
        dishTitle: item.dish_title_snapshot,
        quantity: Number(item.quantity) || 0,
        lineTotal: Number(item.line_total) || 0,
      })),
    }));

    const changedOrder = mapped.find((order) => {
      const previousStatus = previousStatusByOrder.current.get(order.id);
      return previousStatus && previousStatus !== order.status;
    });

    mapped.forEach((order) => {
      previousStatusByOrder.current.set(order.id, order.status);
    });

    let loadedNotifications: OrderNotification[] = [];
    if (session.access_token) {
      const orderIds = mapped.map((order) => order.id);
      const [feedbackResponse, notificationsResponse] = await Promise.all([
        orderIds.length > 0
          ? fetch(`/api/orders/feedback?orderIds=${encodeURIComponent(orderIds.join(","))}`, {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            })
          : Promise.resolve(null),
        fetch("/api/orders/notifications", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }),
      ]);

      if (feedbackResponse && feedbackResponse.ok) {
        const feedbackPayload = (await feedbackResponse.json()) as { feedback?: FeedbackEntry[] };
        const nextFeedbackByOrderId = (feedbackPayload.feedback ?? []).reduce<Record<string, FeedbackEntry>>((accumulator, item) => {
          accumulator[item.orderId] = item;
          return accumulator;
        }, {});
        setFeedbackByOrderId(nextFeedbackByOrderId);
      } else {
        setFeedbackByOrderId({});
      }

      if (notificationsResponse.ok) {
        const notificationsPayload = (await notificationsResponse.json()) as { notifications?: OrderNotification[] };
        loadedNotifications = notificationsPayload.notifications ?? [];
        setNotifications(loadedNotifications);
      }
    }

    const latestUnread = loadedNotifications.find((notification) => !notification.isRead);
    if (latestUnread) {
      setNotificationMessage(latestUnread.message);
    } else if (changedOrder) {
      setNotificationMessage(`Update: ${changedOrder.orderNumber} is now ${statusLabel(changedOrder.status)}.`);
    }

    setOrders(mapped);
    setErrorMessage(null);
    setIsLoading(false);
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((notification) => !notification.isRead).map((notification) => notification.id);
    if (unreadIds.length === 0) {
      return;
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
      return;
    }

    setIsMarkingNotificationsRead(true);
    try {
      const response = await fetch("/api/orders/notifications/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ ids: unreadIds }),
      });

      if (response.ok) {
        const unreadSet = new Set(unreadIds);
        setNotifications((previous) =>
          previous.map((notification) =>
            unreadSet.has(notification.id)
              ? {
                  ...notification,
                  isRead: true,
                  readAt: new Date().toISOString(),
                }
              : notification,
          ),
        );
      }
    } finally {
      setIsMarkingNotificationsRead(false);
    }
  }, [getAccessToken, notifications]);

  const submitFeedback = useCallback(
    async (orderId: string) => {
      const comment = (feedbackDraftByOrderId[orderId] ?? "").trim();
      if (!comment) {
        setErrorMessage("Please write a comment before submitting.");
        return;
      }

      const accessToken = await getAccessToken();
      if (!accessToken) {
        setErrorMessage("You must be signed in to submit feedback.");
        return;
      }

      setSubmittingFeedbackOrderId(orderId);
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/orders/${orderId}/feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ comment }),
        });

        const payload = (await response.json()) as {
          feedback?: FeedbackEntry;
          message?: string;
        };

        if (!response.ok || !payload.feedback) {
          setErrorMessage(payload.message ?? "Failed to submit comment.");
          return;
        }

        setFeedbackByOrderId((previous) => ({
          ...previous,
          [orderId]: payload.feedback as FeedbackEntry,
        }));
        setFeedbackDraftByOrderId((previous) => {
          const next = { ...previous };
          delete next[orderId];
          return next;
        });
        setNotificationMessage("Your comment has been sent to the admin team.");
      } finally {
        setSubmittingFeedbackOrderId(null);
      }
    },
    [feedbackDraftByOrderId, getAccessToken],
  );

  useEffect(() => {
    let mounted = true;

    const runLoad = async () => {
      try {
        await loadOrders();
      } catch (error) {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load orders.");
          setIsLoading(false);
        }
      }
    };

    void runLoad();

    const intervalId = window.setInterval(() => {
      void runLoad();
    }, 12000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [loadOrders]);

  const totals = useMemo(() => {
    const pending = orders.filter((order) => order.status === "pending").length;
    const inProgress = orders.filter((order) => order.status === "in_progress").length;
    const delivered = orders.filter((order) => order.status === "delivered").length;
    const rejected = orders.filter((order) => order.status === "rejected").length;
    return { pending, inProgress, delivered, rejected };
  }, [orders]);

  const unreadNotificationsCount = notifications.filter((notification) => !notification.isRead).length;

  if (isLoading) {
    return (
      <main className="app-bg-main min-h-screen px-4 py-6 text-white md:px-8 md:py-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 p-6">Loading your orders...</div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="app-bg-main min-h-screen px-4 py-6 text-white md:px-8 md:py-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 p-6">
          <h1 className="text-2xl font-semibold">My Orders</h1>
          <p className="mt-2 text-sm text-gray-300">Sign in to track your live order status.</p>
          <Link href="/sign-in?next=/my-orders" className="app-text-accent mt-3 inline-flex text-sm hover:underline">
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="app-bg-main min-h-screen px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="app-bg-panel rounded-2xl border border-white/10 p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">My Orders</h1>
              <p className="mt-1 text-sm text-gray-300">Status updates refresh automatically every few seconds.</p>
            </div>
            <Link href="/menu" className="app-text-accent text-sm hover:underline">
              Back to menu
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 p-3">
              <p className="text-xs text-gray-400">Pending</p>
              <p className="mt-1 text-xl font-semibold text-amber-300">{totals.pending}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-3">
              <p className="text-xs text-gray-400">Accepted</p>
              <p className="mt-1 text-xl font-semibold text-indigo-300">{totals.inProgress}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-3">
              <p className="text-xs text-gray-400">Delivered</p>
              <p className="mt-1 text-xl font-semibold text-emerald-300">{totals.delivered}</p>
            </div>
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
              <p className="text-xs text-rose-200/85">Rejected</p>
              <p className="mt-1 text-xl font-semibold text-rose-300">{totals.rejected}</p>
            </div>
          </div>

          {notificationMessage ? <p className="mt-4 rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{notificationMessage}</p> : null}
          {errorMessage ? <p className="mt-4 text-sm text-red-300">{errorMessage}</p> : null}

          <div className="mt-4 rounded-xl border border-white/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-200">Notifications</p>
              <button
                type="button"
                onClick={() => {
                  void markAllNotificationsAsRead();
                }}
                disabled={unreadNotificationsCount === 0 || isMarkingNotificationsRead}
                className="app-hover-accent-soft rounded-lg border border-white/15 px-3 py-1.5 text-xs text-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Mark all read {unreadNotificationsCount > 0 ? `(${unreadNotificationsCount})` : ""}
              </button>
            </div>

            {notifications.length > 0 ? (
              <div className="mt-3 space-y-2">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-lg border px-3 py-2 text-sm ${notification.isRead ? "border-white/10 text-gray-400" : "border-emerald-300/30 bg-emerald-500/10 text-emerald-200"}`}
                  >
                    <p className="font-medium">{notification.title}</p>
                    <p className="mt-1">{notification.message}</p>
                    <p className="mt-1 text-xs opacity-80">{formatDateTime(notification.createdAt)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-400">No notifications yet.</p>
            )}
          </div>
        </section>

        {orders.length === 0 ? (
          <section className="app-bg-panel rounded-2xl border border-white/10 p-6 text-sm text-gray-300">
            You have no orders yet. Place an order and come back to track it here.
          </section>
        ) : (
          orders.map((order) => (
            <section key={order.id} className="app-bg-panel rounded-2xl border border-white/10 p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-white">{order.orderNumber}</h2>
                  <p className="mt-1 text-xs text-gray-400">{formatOrderType(order.orderType)} • {formatDateTime(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(order.status)}`}>
                    {statusLabel(order.status)}
                  </span>
                  <p className="text-sm font-semibold text-white">{formatCurrency(order.total)}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-xs text-gray-300 sm:grid-cols-3">
                <p>Created: {formatDateTime(order.createdAt)}</p>
                <p>Started: {order.startedAt ? formatDateTime(order.startedAt) : "-"}</p>
                <p>Delivered: {order.deliveredAt ? formatDateTime(order.deliveredAt) : "-"}</p>
              </div>

              <div className="mt-4 divide-y divide-white/8 rounded-xl border border-white/10">
                {order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <div key={`${order.id}-${item.dishTitle}-${index}`} className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 text-sm">
                      <p className="text-gray-200">{item.dishTitle}</p>
                      <p className="text-gray-300">x{item.quantity}</p>
                      <p className="text-gray-100">{formatCurrency(item.lineTotal)}</p>
                    </div>
                  ))
                ) : (
                  <p className="px-3 py-3 text-sm text-gray-400">No item details found.</p>
                )}
              </div>

              {order.note ? <p className="mt-3 text-xs text-gray-400">Note: {order.note}</p> : null}
              {order.adminDecisionNote ? <p className="mt-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-200">Rejection reason: {order.adminDecisionNote}</p> : null}

              {order.status === "delivered" ? (
                <div className="mt-4 rounded-xl border border-white/10 p-3">
                  <p className="text-sm font-semibold text-gray-200">Comment about this order</p>
                  <textarea
                    value={feedbackDraftByOrderId[order.id] ?? feedbackByOrderId[order.id]?.comment ?? ""}
                    onChange={(event) =>
                      setFeedbackDraftByOrderId((previous) => ({
                        ...previous,
                        [order.id]: event.target.value,
                      }))
                    }
                    rows={3}
                    maxLength={800}
                    placeholder="Tell us what went well or what issue you faced"
                    className="app-bg-elevated mt-2 w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-100 outline-none placeholder:text-gray-500"
                  />

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void submitFeedback(order.id);
                      }}
                      disabled={submittingFeedbackOrderId === order.id}
                      className="app-bg-accent rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submittingFeedbackOrderId === order.id
                        ? "Sending..."
                        : feedbackByOrderId[order.id]
                          ? "Update comment"
                          : "Send comment"}
                    </button>

                    {feedbackByOrderId[order.id] ? (
                      <span className={`rounded-full px-2.5 py-1 text-xs ${feedbackByOrderId[order.id].status === "resolved" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                        {feedbackByOrderId[order.id].status === "resolved" ? "Resolved" : "Open"}
                      </span>
                    ) : null}
                  </div>

                  {feedbackByOrderId[order.id]?.adminNote ? (
                    <p className="mt-2 text-xs text-gray-300">Admin note: {feedbackByOrderId[order.id].adminNote}</p>
                  ) : null}
                </div>
              ) : null}
            </section>
          ))
        )}
      </div>
    </main>
  );
}
