"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Sidenav from "@/components/navigation/Sidenav";

type OrderOption = {
  id: string;
  orderNumber: string;
};

type MessageItem = {
  id: number;
  orderId: string;
  orderNumber: string;
  message: string;
  status: "open" | "resolved";
  adminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  orderItems: Array<{ title: string; quantity: number }>;
};

function formatDateTime(isoValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoValue));
}

export default function MessagesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    setIsAuthenticated(true);

    const [ordersResult, messagesResult] = await Promise.all([
      supabase
        .from("orders")
        .select("id, order_number")
        .eq("customer_user_id", session.user.id)
        .in("status", ["served", "completed", "preparing", "pending"])
        .order("created_at", { ascending: false })
        .limit(30),
      fetch("/api/messages", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }),
    ]);

    if (ordersResult.error) {
      setErrorMessage(ordersResult.error.message);
      setIsLoading(false);
      return;
    }

    const orderOptions = (ordersResult.data ?? []).map((item) => ({
      id: item.id,
      orderNumber: item.order_number,
    }));

    if (!messagesResult.ok) {
      const payload = (await messagesResult.json().catch(() => ({}))) as { message?: string };
      setErrorMessage(payload.message ?? "Unable to load messages.");
      setOrders(orderOptions);
      setIsLoading(false);
      return;
    }

    const messagesPayload = (await messagesResult.json()) as { messages?: MessageItem[] };

    setOrders(orderOptions);
    setMessages(messagesPayload.messages ?? []);
    setSelectedOrderId((previous) => previous || orderOptions[0]?.id || "");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    if (!selectedOrderId) {
      setErrorMessage("Please select an order.");
      return;
    }

    const trimmed = messageText.trim();
    if (!trimmed) {
      setErrorMessage("Please write your message.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setErrorMessage("You must be signed in.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          orderId: selectedOrderId,
          message: trimmed,
        }),
      });

      const payload = (await response.json()) as {
        message?: MessageItem | string;
      };

      if (!response.ok || !payload.message || typeof payload.message === "string") {
        setErrorMessage(typeof payload.message === "string" ? payload.message : "Unable to send message.");
        return;
      }

      setMessageText("");
      setSuccessMessage("Your message has been sent to the restaurant team.");
      await loadData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedMessages = useMemo(
    () => [...messages].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    [messages],
  );

  if (isLoading) {
    return (
      <main className="app-bg-main min-h-screen text-white">
        <div className="app-bg-main flex min-h-screen w-full flex-col md:flex-row">
          <Sidenav />
          <div className="flex-1 p-6">Loading messages...</div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="app-bg-main min-h-screen text-white">
        <div className="app-bg-main flex min-h-screen w-full flex-col md:flex-row">
          <Sidenav />
          <div className="flex-1 p-6">
            <div className="app-bg-panel max-w-3xl rounded-2xl border border-white/10 p-6">
              <h1 className="text-2xl font-semibold">Contact Support</h1>
              <p className="mt-2 text-sm text-gray-300">Sign in to send a message linked to your orders.</p>
              <Link href="/sign-in?next=/messages" className="app-text-accent mt-3 inline-flex text-sm hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-bg-main min-h-screen text-white">
      <div className="app-bg-main flex min-h-screen w-full flex-col md:flex-row">
        <Sidenav />

        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6">
          <section className="app-bg-panel rounded-2xl border border-white/10 p-5">
            <h1 className="text-2xl font-semibold">Contact Support</h1>
            <p className="mt-1 text-sm text-gray-300">Send a message related to your order. Our team will review it in admin messages.</p>

            <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr_auto]">
              <select
                value={selectedOrderId}
                onChange={(event) => setSelectedOrderId(event.target.value)}
                className="app-bg-elevated h-11 rounded-xl border border-white/10 px-3 text-sm text-gray-100 outline-none"
              >
                <option value="">Select order</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.orderNumber}
                  </option>
                ))}
              </select>

              <textarea
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="Describe your issue or request"
                className="app-bg-elevated rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-100 outline-none"
              />

              <button
                type="button"
                onClick={() => {
                  void handleSubmit();
                }}
                disabled={isSubmitting}
                className="app-bg-accent rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : "Send"}
              </button>
            </div>

            {errorMessage ? <p className="mt-3 text-sm text-red-300">{errorMessage}</p> : null}
            {successMessage ? <p className="mt-3 text-sm text-emerald-300">{successMessage}</p> : null}
          </section>

          <section className="app-bg-panel flex-1 rounded-2xl border border-white/10 p-5">
            <h2 className="text-lg font-semibold">My Messages</h2>
            {sortedMessages.length === 0 ? (
              <p className="mt-3 text-sm text-gray-400">No messages yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {sortedMessages.map((item) => (
                  <article key={item.id} className="app-bg-elevated rounded-xl border border-white/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{item.orderNumber}</p>
                      <span className={`rounded-full px-2.5 py-1 text-xs ${item.status === "resolved" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                        {item.status === "resolved" ? "Resolved" : "Open"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-200">{item.message}</p>
                    <p className="mt-2 text-xs text-gray-400">Sent: {formatDateTime(item.createdAt)}</p>

                    {item.orderItems.length > 0 ? (
                      <p className="mt-2 text-xs text-gray-400">
                        Ordered: {item.orderItems.map((orderItem) => `${orderItem.title} x${orderItem.quantity}`).join(", ")}
                      </p>
                    ) : null}

                    {item.adminNote ? <p className="mt-2 text-xs text-gray-300">Admin note: {item.adminNote}</p> : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
