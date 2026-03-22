"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/currency";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

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
};

type OrdersResponse = {
  orders?: AdminOrder[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  message?: string;
};

function daysAgoIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

const MOCK_ORDERS: AdminOrder[] = [
  {
    id: "mock-order-1",
    orderNumber: "#MOCK-1001",
    orderType: "dine_in",
    status: "pending",
    total: 42.5,
    createdAt: daysAgoIso(0),
    note: "No onions, extra spicy.",
  },
  {
    id: "mock-order-2",
    orderNumber: "#MOCK-1002",
    orderType: "delivery",
    status: "in_progress",
    total: 67.2,
    createdAt: daysAgoIso(0),
    note: "Leave at front desk.",
  },
  {
    id: "mock-order-3",
    orderNumber: "#MOCK-1003",
    orderType: "to_go",
    status: "delivered",
    total: 23.99,
    createdAt: daysAgoIso(1),
    note: null,
  },
  {
    id: "mock-order-4",
    orderNumber: "#MOCK-1004",
    orderType: "delivery",
    status: "pending",
    total: 89.1,
    createdAt: daysAgoIso(1),
    note: "Call on arrival.",
  },
];

const STATUS_OPTIONS: { value: UiOrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "delivered", label: "Delivered" },
];

function formatOrderType(orderType: AdminOrder["orderType"]) {
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  const getAccessToken = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) {
      throw new Error("You must be signed in to access orders.");
    }

    return accessToken;
  }, []);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const accessToken = await getAccessToken();
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (debouncedSearchQuery) {
        params.set("q", debouncedSearchQuery);
      }

      const response = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = (await response.json()) as OrdersResponse;
      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to load orders.");
      }

      const liveOrders = payload.orders ?? [];
      if (liveOrders.length === 0 && !debouncedSearchQuery && page === 1) {
        setOrders(MOCK_ORDERS);
        setIsUsingMockData(true);
        setPagination({ page: 1, pageSize, total: MOCK_ORDERS.length, totalPages: 1 });
        setInfoMessage("No live orders found. Showing mock data for testing.");
        return;
      }

      setOrders(liveOrders);
      setPagination(
        payload.pagination ?? {
          page,
          pageSize,
          total: liveOrders.length,
          totalPages: 1,
        },
      );
      setIsUsingMockData(false);
    } catch (error) {
      setOrders(MOCK_ORDERS);
      setIsUsingMockData(true);
      setPagination({ page: 1, pageSize, total: MOCK_ORDERS.length, totalPages: 1 });
      setInfoMessage("Live orders are unavailable. Showing mock data for testing.");
      setErrorMessage(error instanceof Error ? error.message : "Failed to load orders.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, getAccessToken, page, pageSize]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, nextStatus: UiOrderStatus) => {
    if (isUsingMockData) {
      setOrders((previous) => previous.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order)));
      setSuccessMessage("Mock order status updated locally.");
      return;
    }

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
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = (await response.json()) as { status?: UiOrderStatus; message?: string };
      if (!response.ok || !payload.status) {
        throw new Error(payload.message ?? "Failed to update order status.");
      }

      setOrders((previous) =>
        previous.map((order) => (order.id === orderId ? { ...order, status: payload.status ?? nextStatus } : order)),
      );
      setSuccessMessage("Order status updated.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update order status.");
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

  return (
    <section className="app-bg-panel h-full rounded-2xl border border-white/10 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Current Orders</h1>
          <p className="mt-1 text-sm text-gray-300">Manage live order status from pending to delivered.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by order, customer, phone, address"
            className="app-bg-elevated h-10 w-64 rounded-lg border border-white/15 px-3 text-sm text-gray-100 outline-none placeholder:text-gray-500"
          />
          <button
            type="button"
            onClick={() => {
              void loadOrders();
            }}
            className="app-hover-accent-soft rounded-lg border border-white/15 px-3 py-2 text-sm text-gray-200"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 p-3">
          <p className="text-xs text-gray-400">Pending</p>
          <p className="mt-1 text-xl font-semibold text-amber-300">{totals.pending}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <p className="text-xs text-gray-400">In Progress</p>
          <p className="mt-1 text-xl font-semibold text-indigo-300">{totals.inProgress}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <p className="text-xs text-gray-400">Delivered</p>
          <p className="mt-1 text-xl font-semibold text-emerald-300">{totals.delivered}</p>
        </div>
      </div>

      {errorMessage ? <p className="mt-4 text-sm text-red-300">{errorMessage}</p> : null}
      {infoMessage ? <p className="mt-4 text-sm text-amber-300">{infoMessage}</p> : null}
      {successMessage ? <p className="mt-4 text-sm text-emerald-300">{successMessage}</p> : null}

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 text-left">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Started</th>
                <th className="px-4 py-3 font-medium">Delivered</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-400" colSpan={7}>
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-400" colSpan={7}>
                    No current orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-t border-white/10 text-sm text-gray-200">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{order.orderNumber}</div>
                      {order.note ? <p className="mt-1 max-w-70 truncate text-xs text-gray-400">{order.note}</p> : null}
                      {order.customerName ? <p className="mt-1 text-xs text-gray-400">{order.customerName}</p> : null}
                    </td>
                    <td className="px-4 py-3">{formatOrderType(order.orderType)}</td>
                    <td className="px-4 py-3 text-gray-300">{formatDateTime(order.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-300">{order.startedAt ? formatDateTime(order.startedAt) : "-"}</td>
                    <td className="px-4 py-3 text-gray-300">{order.deliveredAt ? formatDateTime(order.deliveredAt) : "-"}</td>
                    <td className="px-4 py-3">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(event) => {
                          void handleStatusChange(order.id, event.target.value as UiOrderStatus);
                        }}
                        disabled={updatingOrderId === order.id}
                        className="app-bg-elevated w-full rounded-lg border border-white/15 px-2 py-2 text-sm text-gray-100 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isUsingMockData ? (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-300">
          <p>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} orders)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
              className="app-hover-accent-soft rounded-lg border border-white/15 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages || isLoading}
              onClick={() => setPage((previous) => Math.min(pagination.totalPages, previous + 1))}
              className="app-hover-accent-soft rounded-lg border border-white/15 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
