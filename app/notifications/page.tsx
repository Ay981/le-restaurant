"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Sidenav from "@/components/navigation/Sidenav";
import { useI18n } from "@/components/i18n/I18nProvider";

type OrderNotification = {
  id: number;
  orderId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
};

function formatDateTime(isoValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoValue));
}

export default function NotificationsPage() {
  const { translate } = useI18n();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setIsAuthenticated(false);
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsAuthenticated(true);

    const response = await fetch("/api/orders/notifications", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const payload = (await response.json().catch(() => ({}))) as {
      notifications?: OrderNotification[];
      message?: string;
    };

    if (!response.ok) {
      setErrorMessage(payload.message ?? "Failed to load notifications.");
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setNotifications(payload.notifications ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const unreadIds = useMemo(
    () => notifications.filter((item) => !item.isRead).map((item) => item.id),
    [notifications],
  );

  const unreadCount = unreadIds.length;

  const markAllRead = useCallback(async () => {
    if (unreadCount === 0 || isMarkingRead) {
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

    setIsMarkingRead(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/orders/notifications/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ids: unreadIds }),
      });

      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setErrorMessage(payload.message ?? "Failed to update notifications.");
        return;
      }

      setSuccessMessage("Notifications marked as read.");
      await loadNotifications();
    } finally {
      setIsMarkingRead(false);
    }
  }, [isMarkingRead, loadNotifications, unreadCount, unreadIds]);

  if (isLoading) {
    return (
      <main className="app-bg-main min-h-screen text-white">
        <div className="app-bg-main flex min-h-screen w-full flex-col md:flex-row">
          <Sidenav />
          <div className="flex-1 p-6">Loading notifications...</div>
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
              <h1 className="text-2xl font-semibold">{translate("notifications", "pageTitle")}</h1>
              <p className="mt-2 text-sm text-gray-300">{translate("notifications", "pageSubtitle")}</p>
              <Link href="/sign-in?next=/notifications" className="app-text-accent mt-3 inline-flex text-sm hover:underline">
                {translate("messages", "signIn")}
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

        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
          <section className="app-bg-panel rounded-2xl border border-white/10 p-5 md:p-6 lg:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold md:text-3xl">{translate("notifications", "pageTitle")}</h1>
                <p className="mt-1 max-w-2xl text-sm text-gray-300 md:text-base">
                  {translate("notifications", "pageSubtitle")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void loadNotifications();
                  }}
                  className="app-hover-accent-soft rounded-lg border border-white/15 px-3 py-2 text-xs text-gray-200"
                >
                  {translate("common", "refresh")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void markAllRead();
                  }}
                  disabled={unreadCount === 0 || isMarkingRead}
                  className="app-bg-accent rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isMarkingRead ? translate("notifications", "updating") : translate("notifications", "markAllRead")}
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <article className="app-bg-elevated rounded-xl border border-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-400">{translate("notifications", "totalNotifications")}</p>
                <p className="mt-1 text-lg font-semibold text-white">{notifications.length}</p>
              </article>
              <article className="app-bg-elevated rounded-xl border border-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-400">{translate("notifications", "unread")}</p>
                <p className="mt-1 text-lg font-semibold text-white">{unreadCount}</p>
              </article>
              <article className="app-bg-elevated rounded-xl border border-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-400">{translate("notifications", "read")}</p>
                <p className="mt-1 text-lg font-semibold text-white">{notifications.length - unreadCount}</p>
              </article>
            </div>

            {errorMessage ? <p className="mt-3 text-sm text-red-300">{errorMessage}</p> : null}
            {successMessage ? <p className="mt-3 text-sm text-emerald-300">{successMessage}</p> : null}
          </section>

          <section className="app-bg-panel flex-1 rounded-2xl border border-white/10 p-5 md:p-6 lg:p-7">
            <h2 className="text-lg font-semibold md:text-xl">{translate("notifications", "recentUpdates")}</h2>
            {notifications.length === 0 ? (
              <p className="mt-3 text-sm text-gray-400">{translate("notifications", "noNotifications")}</p>
            ) : (
              <div className="mt-4 space-y-3">
                {notifications.map((item) => (
                  <article
                    key={item.id}
                    className={`app-bg-elevated rounded-xl border p-4 md:p-5 ${item.isRead ? "border-white/10" : "border-white/20"}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white md:text-base">{item.title}</p>
                      <span className={`rounded-full px-2.5 py-1 text-xs ${item.isRead ? "bg-gray-500/20 text-gray-300" : "bg-amber-500/20 text-amber-300"}`}>
                        {item.isRead ? translate("notifications", "read") : translate("notifications", "unread")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-200">{item.message}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span>Order: {item.orderId}</span>
                      <span>Created: {formatDateTime(item.createdAt)}</span>
                      <span>{item.readAt ? `Read: ${formatDateTime(item.readAt)}` : "Pending read"}</span>
                    </div>
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
