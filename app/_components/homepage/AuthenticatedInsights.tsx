"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type PreviousOrder = {
  orderNumber: string;
  createdAt: string;
  status: string;
};

type OrderWithItems = {
  order_number: string;
  created_at: string;
  status: string;
  order_items: Array<{
    dish_title_snapshot: string;
    quantity: number;
  }> | null;
};

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatStatusLabel(status: string) {
  if (status === "preparing") return "In Progress";
  if (status === "completed" || status === "served") return "Delivered";
  if (status === "pending") return "Pending";
  return status;
}

export default function AuthenticatedInsights() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [previousOrders, setPreviousOrders] = useState<PreviousOrder[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    let mounted = true;

    const loadInsights = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (!session?.user) {
          setIsAuthenticated(false);
          setPreviousOrders([]);
          setSuggestions([]);
          return;
        }

        setIsAuthenticated(true);

        const { data, error } = await supabase
          .from("orders")
          .select("order_number, created_at, order_items(dish_title_snapshot, quantity)")
          .eq("customer_user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(8);

        if (error || !data) {
          setPreviousOrders([]);
          setSuggestions([]);
          return;
        }

        const typedOrders = data as OrderWithItems[];

        const recentOrders = typedOrders.slice(0, 3).map((item) => ({
          orderNumber: item.order_number,
          createdAt: item.created_at,
          status: item.status,
        }));

        const dishCount = new Map<string, number>();

        typedOrders.forEach((order) => {
          order.order_items?.forEach((orderItem) => {
            const title = orderItem.dish_title_snapshot?.trim();
            if (!title) {
              return;
            }

            const existingCount = dishCount.get(title) ?? 0;
            dishCount.set(title, existingCount + (orderItem.quantity || 1));
          });
        });

        const topSuggestions = [...dishCount.entries()]
          .sort((first, second) => second[1] - first[1])
          .slice(0, 3)
          .map(([title]) => title);

        setPreviousOrders(recentOrders);
        setSuggestions(topSuggestions);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadInsights();

    return () => {
      mounted = false;
    };
  }, []);

  const isEmptyInsights = useMemo(
    () => isAuthenticated && previousOrders.length === 0 && suggestions.length === 0,
    [isAuthenticated, previousOrders.length, suggestions.length],
  );

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="mt-6 rounded-2xl border border-white/10 p-4 text-sm text-gray-300">
        Sign in to unlock order history and personalized dish suggestions.
        <div className="mt-2">
          <Link href="/sign-in?next=/" className="app-text-accent hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (isEmptyInsights) {
    return (
      <div className="mt-6 rounded-2xl border border-white/10 p-4 text-sm text-gray-300">
        Your account is ready. Place your first order to start getting personalized suggestions.
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 p-4">
      <h3 className="text-sm font-semibold text-white">For You</h3>

      {previousOrders.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs uppercase tracking-wide text-gray-400">Previous Orders</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-200">
            {previousOrders.map((order) => (
              <li key={`${order.orderNumber}-${order.createdAt}`} className="flex items-center justify-between">
                <div>
                  <span>{order.orderNumber}</span>
                  <span className="ml-2 text-xs text-gray-400">{formatStatusLabel(order.status)}</span>
                </div>
                <span className="text-xs text-gray-400">{formatShortDate(order.createdAt)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2">
            <Link href="/my-orders" className="app-text-accent text-xs hover:underline">
              Track my orders
            </Link>
          </div>
        </div>
      ) : null}

      {suggestions.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Suggested Based on Your Orders</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((title) => (
              <span key={title} className="rounded-lg border border-white/15 px-2 py-1 text-xs text-gray-200">
                {title}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
