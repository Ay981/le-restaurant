"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/currency";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n/I18nProvider";

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
  receipt?: {
    provider: string;
    transactionReference: string;
    fileUrl: string | null;
    fileName: string | null;
    fileMimeType: string | null;
    expectedAmount: number | null;
    verifiedAmount: number | null;
    verifiedCurrency: string | null;
    expectedReceiver: string | null;
    verifiedReceiver: string | null;
    amountMatchesExpected: boolean | null;
    receiverMatchesExpected: boolean | null;
    reviewStatus: "pending" | "accepted" | "rejected";
    reviewNote: string | null;
    reviewedAt: string | null;
    reviewedBy: string | null;
    verifiedAt: string;
  } | null;
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
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  message?: string;
};

function formatOrderType(orderType: AdminOrder["orderType"], locale: "en" | "am") {
  if (orderType === "dine_in") return locale === "am" ? "በሬስቶራንት" : "Dine In";
  if (orderType === "to_go") return locale === "am" ? "ለመውሰድ" : "To Go";
  return locale === "am" ? "ዴሊቨሪ" : "Delivery";
}

function formatDateTime(isoValue: string, locale: "en" | "am") {
  return new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoValue));
}

export default function AdminOrdersPage() {
  const { locale } = useI18n();
  const isAmharic = locale === "am";
  const statusOptions: { value: UiOrderStatus; label: string }[] = [
    { value: "pending", label: isAmharic ? "በመጠባበቅ ላይ" : "Pending" },
    { value: "in_progress", label: isAmharic ? "በሂደት ላይ" : "In Progress" },
    { value: "delivered", label: isAmharic ? "ተሰጥቷል" : "Delivered" },
  ];
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState<Record<string, string>>({});
  const [updatingFeedbackOrderId, setUpdatingFeedbackOrderId] = useState<string | null>(null);
  const [receiptReviewNotes, setReceiptReviewNotes] = useState<Record<string, string>>({});
  const [reviewingReceiptOrderId, setReviewingReceiptOrderId] = useState<string | null>(null);
  const [pendingReceiptReviewCount, setPendingReceiptReviewCount] = useState(0);

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
        throw new Error(payload.message ?? (isAmharic ? "ትዕዛዞችን መጫን አልተቻለም።" : "Failed to load orders."));
      }

      const liveOrders = payload.orders ?? [];
      if (liveOrders.length === 0 && !debouncedSearchQuery && page === 1) {
        setOrders([]);
        setPendingReceiptReviewCount(0);
        setPagination({ page: 1, pageSize, total: 0, totalPages: 1 });
        setInfoMessage(isAmharic ? "ምንም የቀጥታ ትዕዛዝ አልተገኘም።" : "No live orders found.");
        return;
      }

      setOrders(liveOrders);
      setPendingReceiptReviewCount(payload.alerts?.pendingReceiptReviews ?? 0);
      setPagination(
        payload.pagination ?? {
          page,
          pageSize,
          total: liveOrders.length,
          totalPages: 1,
        },
      );
    } catch (error) {
      setOrders([]);
      setPendingReceiptReviewCount(0);
      setPagination({ page: 1, pageSize, total: 0, totalPages: 1 });
      setInfoMessage(null);
      setErrorMessage(error instanceof Error ? error.message : isAmharic ? "ትዕዛዞችን መጫን አልተቻለም።" : "Failed to load orders.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, getAccessToken, isAmharic, page, pageSize]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, nextStatus: UiOrderStatus) => {
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
        throw new Error(payload.message ?? (isAmharic ? "የትዕዛዝ ሁኔታን ማዘመን አልተቻለም።" : "Failed to update order status."));
      }

      setOrders((previous) =>
        previous.map((order) => (order.id === orderId ? { ...order, status: payload.status ?? nextStatus } : order)),
      );
      setSuccessMessage(isAmharic ? "የትዕዛዝ ሁኔታ ተዘምኗል።" : "Order status updated.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : isAmharic ? "የትዕዛዝ ሁኔታን ማዘመን አልተቻለም።" : "Failed to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleFeedbackStatusChange = async (orderId: string, nextStatus: "open" | "resolved") => {
    setUpdatingFeedbackOrderId(orderId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch(`/api/admin/orders/${orderId}/feedback`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          status: nextStatus,
          adminNote: feedbackNotes[orderId] ?? "",
        }),
      });

      const payload = (await response.json()) as {
        feedback?: AdminOrder["feedback"];
        message?: string;
      };

      if (!response.ok || !payload.feedback) {
        throw new Error(payload.message ?? (isAmharic ? "አስተያየትን ማዘመን አልተቻለም።" : "Failed to update feedback."));
      }

      setOrders((previous) =>
        previous.map((order) => (order.id === orderId ? { ...order, feedback: payload.feedback ?? null } : order)),
      );
      setSuccessMessage(nextStatus === "resolved" ? (isAmharic ? "የደንበኛ ጉዳይ ተፈትቷል ተብሎ ተመልክቷል።" : "Customer issue marked as resolved.") : isAmharic ? "የደንበኛ ጉዳይ ዳግም ተከፍቷል።" : "Customer issue reopened.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : isAmharic ? "አስተያየትን ማዘመን አልተቻለም።" : "Failed to update feedback.");
    } finally {
      setUpdatingFeedbackOrderId(null);
    }
  };

  const handleReceiptDecision = async (orderId: string, decision: "accepted" | "rejected") => {
    setReviewingReceiptOrderId(orderId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const wasPending = orders.find((order) => order.id === orderId)?.receipt?.reviewStatus === "pending";
      const accessToken = await getAccessToken();
      const response = await fetch(`/api/admin/orders/${orderId}/receipt-review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          decision,
          note: receiptReviewNotes[orderId] ?? "",
        }),
      });

      const payload = (await response.json()) as {
        receiptReview?: {
          status: "accepted" | "rejected";
          note: string | null;
          reviewedAt: string;
          reviewedBy: string;
        };
        message?: string;
      };

      if (!response.ok || !payload.receiptReview) {
        throw new Error(payload.message ?? (isAmharic ? "የደረሰኝ ግምገማን ማዘመን አልተቻለም።" : "Failed to update receipt review."));
      }

      const receiptReview = payload.receiptReview;

      setOrders((previous) =>
        previous.map((order) => {
          if (order.id !== orderId || !order.receipt) {
            return order;
          }

          return {
            ...order,
            receipt: {
              ...order.receipt,
              reviewStatus: receiptReview.status,
              reviewNote: receiptReview.note,
              reviewedAt: receiptReview.reviewedAt,
              reviewedBy: receiptReview.reviewedBy,
            },
          };
        }),
      );

      if (wasPending) {
        setPendingReceiptReviewCount((previous) => Math.max(0, previous - 1));
      }
      setSuccessMessage(payload.message ?? (decision === "accepted" ? (isAmharic ? "ደረሰኙ ተቀባይነት አግኝቷል።" : "Receipt accepted.") : isAmharic ? "ደረሰኙ ተቀባይነት አላገኘም።" : "Receipt rejected."));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : isAmharic ? "የደረሰኝ ግምገማን ማዘመን አልተቻለም።" : "Failed to update receipt review.");
    } finally {
      setReviewingReceiptOrderId(null);
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
          <h1 className="text-2xl font-semibold text-white">{isAmharic ? "የአሁኑ ትዕዛዞች" : "Current Orders"}</h1>
          <p className="mt-1 text-sm text-gray-300">{isAmharic ? "የቀጥታ ትዕዛዝ ሁኔታን ከመጠባበቅ እስከ መድረስ ያስተዳድሩ።" : "Manage live order status from pending to delivered."}</p>
          {pendingReceiptReviewCount > 0 ? (
            <p className="mt-2 inline-flex rounded-full border border-amber-300/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
              {isAmharic ? `${pendingReceiptReviewCount} የደረሰኝ ግምገማዎች በመጠባበቅ ላይ` : `${pendingReceiptReviewCount} receipt reviews pending`}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={isAmharic ? "በትዕዛዝ፣ ደንበኛ፣ ስልክ፣ አድራሻ ይፈልጉ" : "Search by order, customer, phone, address"}
            className="app-bg-elevated h-10 w-64 rounded-lg border border-white/15 px-3 text-sm text-gray-100 outline-none placeholder:text-gray-500"
          />
          <button
            type="button"
            onClick={() => {
              void loadOrders();
            }}
            className="app-hover-accent-soft rounded-lg border border-white/15 px-3 py-2 text-sm text-gray-200"
          >
            {isAmharic ? "አድስ" : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 p-3">
          <p className="text-xs text-gray-400">{isAmharic ? "በመጠባበቅ ላይ" : "Pending"}</p>
          <p className="mt-1 text-xl font-semibold text-amber-300">{totals.pending}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <p className="text-xs text-gray-400">{isAmharic ? "በሂደት ላይ" : "In Progress"}</p>
          <p className="mt-1 text-xl font-semibold text-indigo-300">{totals.inProgress}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <p className="text-xs text-gray-400">{isAmharic ? "ተሰጥቷል" : "Delivered"}</p>
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
                <th className="px-4 py-3 font-medium">{isAmharic ? "ትዕዛዝ" : "Order"}</th>
                <th className="px-4 py-3 font-medium">{isAmharic ? "ዓይነት" : "Type"}</th>
                <th className="px-4 py-3 font-medium">{isAmharic ? "የተፈጠረ" : "Created"}</th>
                <th className="px-4 py-3 font-medium">{isAmharic ? "የተጀመረ" : "Started"}</th>
                <th className="px-4 py-3 font-medium">{isAmharic ? "የደረሰ" : "Delivered"}</th>
                <th className="px-4 py-3 font-medium">{isAmharic ? "ጠቅላላ" : "Total"}</th>
                <th className="px-4 py-3 font-medium">{isAmharic ? "ሁኔታ" : "Status"}</th>
                <th className="px-4 py-3 font-medium">{isAmharic ? "ዝርዝር" : "Details"}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-400" colSpan={8}>
                    {isAmharic ? "ትዕዛዞች በመጫን ላይ..." : "Loading orders..."}
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-400" colSpan={8}>
                    {isAmharic ? "የአሁኑ ትዕዛዞች አልተገኙም።" : "No current orders found."}
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <Fragment key={order.id}>
                    <tr className="border-t border-white/10 text-sm text-gray-200">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{order.orderNumber}</div>
                        {order.note ? <p className="mt-1 max-w-70 truncate text-xs text-gray-400">{order.note}</p> : null}
                        {order.customerName ? <p className="mt-1 text-xs text-gray-400">{order.customerName}</p> : null}
                      </td>
                      <td className="px-4 py-3">{formatOrderType(order.orderType, locale)}</td>
                      <td className="px-4 py-3 text-gray-300">{formatDateTime(order.createdAt, locale)}</td>
                      <td className="px-4 py-3 text-gray-300">{order.startedAt ? formatDateTime(order.startedAt, locale) : "-"}</td>
                      <td className="px-4 py-3 text-gray-300">{order.deliveredAt ? formatDateTime(order.deliveredAt, locale) : "-"}</td>
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
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedOrderId((previous) => (previous === order.id ? null : order.id));
                            setFeedbackNotes((previous) => ({
                              ...previous,
                              [order.id]: previous[order.id] ?? order.feedback?.adminNote ?? "",
                            }));
                            setReceiptReviewNotes((previous) => ({
                              ...previous,
                              [order.id]: previous[order.id] ?? order.receipt?.reviewNote ?? "",
                            }));
                          }}
                          className="app-hover-accent-soft rounded-lg border border-white/15 px-3 py-1.5 text-xs text-gray-200"
                        >
                          {expandedOrderId === order.id ? (isAmharic ? "ደብቅ" : "Hide") : isAmharic ? "እይ" : "View"}
                        </button>
                      </td>
                    </tr>
                    {expandedOrderId === order.id ? (
                      <tr className="border-t border-white/8 text-sm text-gray-300">
                        <td className="px-4 py-4" colSpan={8}>
                          <div className="grid gap-4 xl:grid-cols-2">
                            <div className="rounded-xl border border-white/10 p-3">
                              <p className="text-xs uppercase tracking-wide text-gray-400">{isAmharic ? "ደንበኛ እና ዴሊቨሪ" : "Customer & Delivery"}</p>
                              <p className="mt-2 text-sm">{isAmharic ? "ስም:" : "Name:"} {order.customerName ?? "-"}</p>
                              <p className="mt-1 text-sm">{isAmharic ? "ስልክ:" : "Phone:"} {order.customerPhone ?? "-"}</p>
                              <p className="mt-1 text-sm">{isAmharic ? "አድራሻ:" : "Address:"} {order.deliveryAddress ?? "-"}</p>
                            </div>

                            <div className="rounded-xl border border-white/10 p-3">
                              <p className="text-xs uppercase tracking-wide text-gray-400">{isAmharic ? "የደረሰኝ ማረጋገጫ" : "Receipt Verification"}</p>
                              {order.receipt ? (
                                <>
                                  <p className="mt-2 text-sm">{isAmharic ? "አቅራቢ:" : "Provider:"} {order.receipt.provider}</p>
                                  <p className="mt-1 text-sm">{isAmharic ? "ማጣቀሻ:" : "Reference:"} {order.receipt.transactionReference}</p>
                                  {order.receipt.fileUrl ? (
                                    <p className="mt-1 text-sm">
                                      {isAmharic ? "የተጫነ ደረሰኝ:" : "Uploaded Receipt:"}{" "}
                                      <a
                                        href={order.receipt.fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="app-text-accent underline underline-offset-2"
                                      >
                                        {order.receipt.fileName ?? (isAmharic ? "ደረሰኝ ክፈት" : "Open receipt")}
                                      </a>
                                    </p>
                                  ) : null}
                                  <p className="mt-1 text-sm">
                                    {isAmharic ? "የተረጋገጠ መጠን:" : "Verified Amount:"} {order.receipt.verifiedAmount !== null ? formatCurrency(order.receipt.verifiedAmount) : "-"}
                                    {order.receipt.verifiedCurrency ? ` (${order.receipt.verifiedCurrency})` : ""}
                                  </p>
                                  <p className="mt-1 text-sm">
                                    {isAmharic ? "የሚጠበቀው መጠን:" : "Expected Amount:"} {order.receipt.expectedAmount !== null ? formatCurrency(order.receipt.expectedAmount) : "-"}
                                  </p>
                                  <p className="mt-1 text-sm">
                                    {isAmharic ? "የመጠን ማረጋገጫ:" : "Amount Check:"} {order.receipt.amountMatchesExpected === null ? "N/A" : order.receipt.amountMatchesExpected ? (isAmharic ? "ተመሳሳይ" : "Matched") : isAmharic ? "አልተመሳሰለም" : "Mismatch"}
                                  </p>
                                  <p className="mt-1 text-sm">{isAmharic ? "የተረጋገጠ ተቀባይ:" : "Verified Receiver:"} {order.receipt.verifiedReceiver ?? "-"}</p>
                                  <p className="mt-1 text-sm">{isAmharic ? "የሚጠበቀው ተቀባይ:" : "Expected Receiver:"} {order.receipt.expectedReceiver ?? "-"}</p>
                                  <p className="mt-1 text-sm">
                                    {isAmharic ? "የተቀባይ ማረጋገጫ:" : "Receiver Check:"} {order.receipt.receiverMatchesExpected === null ? "N/A" : order.receipt.receiverMatchesExpected ? (isAmharic ? "ተመሳሳይ" : "Matched") : isAmharic ? "አልተመሳሰለም" : "Mismatch"}
                                  </p>
                                  <p className="mt-1 text-sm">
                                    {isAmharic ? "የሰራተኛ ግምገማ:" : "Staff Review:"} {order.receipt.reviewStatus === "accepted" ? (isAmharic ? "ተቀባይነት አግኝቷል" : "Accepted") : order.receipt.reviewStatus === "rejected" ? (isAmharic ? "ተቀባይነት አላገኘም" : "Rejected") : isAmharic ? "በመጠባበቅ ላይ" : "Pending"}
                                  </p>
                                  {order.receipt.reviewNote ? (
                                    <p className="mt-1 text-sm">{isAmharic ? "የግምገማ ማስታወሻ:" : "Review Note:"} {order.receipt.reviewNote}</p>
                                  ) : null}
                                  {order.receipt.reviewedAt ? (
                                    <p className="mt-1 text-sm">{isAmharic ? "የተገመገመበት ጊዜ:" : "Reviewed At:"} {formatDateTime(order.receipt.reviewedAt, locale)}</p>
                                  ) : null}
                                  <p className="mt-1 text-sm">{isAmharic ? "የተረጋገጠበት ጊዜ:" : "Verified At:"} {formatDateTime(order.receipt.verifiedAt, locale)}</p>

                                  {order.receipt.reviewStatus === "pending" ? (
                                    <>
                                      <label className="mt-3 block text-xs text-gray-400">
                                        {isAmharic ? "የግምገማ ማስታወሻ" : "Review note"}
                                        <textarea
                                          value={receiptReviewNotes[order.id] ?? order.receipt.reviewNote ?? ""}
                                          onChange={(event) =>
                                            setReceiptReviewNotes((previous) => ({
                                              ...previous,
                                              [order.id]: event.target.value,
                                            }))
                                          }
                                          rows={2}
                                          className="app-bg-elevated mt-2 w-full rounded-lg border border-white/15 px-3 py-2 text-sm text-gray-100 outline-none"
                                          placeholder={isAmharic ? "ለተቀባይነት / ውድቅ አስተያየት ይጨምሩ" : "Optional note for acceptance/rejection"}
                                        />
                                      </label>

                                      <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            void handleReceiptDecision(order.id, "accepted");
                                          }}
                                          disabled={reviewingReceiptOrderId === order.id}
                                          className="app-bg-accent rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                          {isAmharic ? "ተቀበል" : "Accept"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            void handleReceiptDecision(order.id, "rejected");
                                          }}
                                          disabled={reviewingReceiptOrderId === order.id}
                                          className="app-hover-accent-soft rounded-lg border border-white/15 px-3 py-1.5 text-xs text-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                          {isAmharic ? "ውድቅ አድርግ" : "Reject"}
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    <p className="mt-3 text-xs text-gray-400">
                                      {order.receipt.reviewStatus === "accepted"
                                        ? isAmharic
                                          ? "ይህ ደረሰኝ አስቀድሞ ተቀባይነት አግኝቷል።"
                                          : "This receipt has already been accepted."
                                        : isAmharic
                                          ? "ይህ ደረሰኝ አስቀድሞ ውድቅ ተደርጓል።"
                                          : "This receipt has already been rejected."}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="mt-2 text-sm text-gray-400">{isAmharic ? "የደረሰኝ ማረጋገጫ አልተገኘም።" : "No receipt verification found."}</p>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 rounded-xl border border-white/10 p-3">
                            <p className="text-xs uppercase tracking-wide text-gray-400">{isAmharic ? "የትዕዛዝ ንጥሎች" : "Order Items"}</p>
                            {order.items && order.items.length > 0 ? (
                              <div className="mt-2 divide-y divide-white/8">
                                {order.items.map((item, index) => (
                                  <div key={`${order.id}-${item.dishTitle}-${index}`} className="grid grid-cols-[1fr_auto_auto] gap-3 py-2">
                                    <div>
                                      <p className="text-sm text-gray-200">{item.dishTitle}</p>
                                      {item.note ? <p className="text-xs text-gray-400">{item.note}</p> : null}
                                    </div>
                                    <p className="text-sm text-gray-300">x{item.quantity}</p>
                                    <p className="text-sm text-gray-100">{formatCurrency(item.lineTotal ?? item.unitPrice * item.quantity)}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-gray-400">{isAmharic ? "የንጥል ዝርዝር አልተገኘም።" : "No item details found."}</p>
                            )}
                          </div>

                          <div className="mt-4 rounded-xl border border-white/10 p-3">
                            <p className="text-xs uppercase tracking-wide text-gray-400">{isAmharic ? "የደንበኛ አስተያየት / ጉዳይ" : "Customer Comment / Issue"}</p>
                            {order.feedback ? (
                              <>
                                <p className="mt-2 text-sm text-gray-200">{order.feedback.comment}</p>
                                <p className="mt-2 text-xs text-gray-400">
                                  {isAmharic ? "ሁኔታ:" : "Status:"} {order.feedback.status === "resolved" ? (isAmharic ? "ተፈትቷል" : "Resolved") : isAmharic ? "ክፍት" : "Open"} • {isAmharic ? "የተዘመነ:" : "Updated:"} {formatDateTime(order.feedback.updatedAt, locale)}
                                </p>
                                {order.feedback.resolvedAt ? (
                                  <p className="mt-1 text-xs text-emerald-300">{isAmharic ? "የተፈታበት ጊዜ:" : "Resolved at:"} {formatDateTime(order.feedback.resolvedAt, locale)}</p>
                                ) : null}

                                <label className="mt-3 block text-xs text-gray-400">
                                  {isAmharic ? "የአስተዳዳሪ ማስታወሻ" : "Admin note"}
                                  <textarea
                                    value={feedbackNotes[order.id] ?? order.feedback.adminNote ?? ""}
                                    onChange={(event) =>
                                      setFeedbackNotes((previous) => ({
                                        ...previous,
                                        [order.id]: event.target.value,
                                      }))
                                    }
                                    rows={3}
                                    className="app-bg-elevated mt-2 w-full rounded-lg border border-white/15 px-3 py-2 text-sm text-gray-100 outline-none"
                                    placeholder={isAmharic ? "ለዚህ ጉዳይ የተወሰደውን እርምጃ ይጻፉ" : "Write the action taken for this issue"}
                                  />
                                </label>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      void handleFeedbackStatusChange(order.id, "resolved");
                                    }}
                                    disabled={updatingFeedbackOrderId === order.id}
                                    className="app-bg-accent rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {isAmharic ? "እንደ ተፈታ ምልክት አድርግ" : "Mark Resolved"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      void handleFeedbackStatusChange(order.id, "open");
                                    }}
                                    disabled={updatingFeedbackOrderId === order.id}
                                    className="app-hover-accent-soft rounded-lg border border-white/15 px-3 py-1.5 text-xs text-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {isAmharic ? "እንደገና ክፈት" : "Reopen"}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <p className="mt-2 text-sm text-gray-400">{isAmharic ? "እስካሁን የደንበኛ አስተያየት የለም።" : "No customer comment yet."}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-300">
        <p>
          {isAmharic ? "ገጽ" : "Showing page"} {pagination.page} {isAmharic ? "ከ" : "of"} {pagination.totalPages} ({pagination.total} {isAmharic ? "ትዕዛዞች" : "orders"})
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((previous) => Math.max(1, previous - 1))}
            className="app-hover-accent-soft rounded-lg border border-white/15 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAmharic ? "ቀዳሚ" : "Previous"}
          </button>
          <button
            type="button"
            disabled={page >= pagination.totalPages || isLoading}
            onClick={() => setPage((previous) => Math.min(pagination.totalPages, previous + 1))}
            className="app-hover-accent-soft rounded-lg border border-white/15 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAmharic ? "ቀጣይ" : "Next"}
          </button>
        </div>
      </div>
    </section>
  );
}
