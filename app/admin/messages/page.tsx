"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n/I18nProvider";

type AdminMessage = {
  id: number;
  orderId: string;
  orderNumber: string;
  message: string;
  status: "open" | "resolved";
  adminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  customer: {
    userId: string;
    fullName: string | null;
    customerName: string | null;
    customerPhone: string | null;
  };
  orderItems: Array<{ title: string; quantity: number }>;
};

function formatDateTime(isoValue: string, locale: "en" | "am") {
  return new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoValue));
}

export default function AdminMessagesPage() {
  const { locale } = useI18n();
  const isAmharic = locale === "am";
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updatingMessageId, setUpdatingMessageId] = useState<number | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setErrorMessage(isAmharic ? "እንደ አስተዳዳሪ ወይም ሰራተኛ መግባት አለብዎት።" : "You must be signed in as admin or staff.");
      setIsLoading(false);
      return;
    }

    const response = await fetch("/api/admin/messages", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const payload = (await response.json().catch(() => ({}))) as {
      messages?: AdminMessage[];
      message?: string;
    };

    if (!response.ok) {
      setErrorMessage(payload.message ?? (isAmharic ? "መልእክቶችን መጫን አልተቻለም።" : "Unable to load messages."));
      setMessages([]);
      setIsLoading(false);
      return;
    }

    const nextMessages = payload.messages ?? [];
    setMessages(nextMessages);
    setNoteDrafts((previous) => {
      const next = { ...previous };
      nextMessages.forEach((item) => {
        if (next[item.id] === undefined) {
          next[item.id] = item.adminNote ?? "";
        }
      });
      return next;
    });
    setIsLoading(false);
  }, [isAmharic]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const handleStatusUpdate = async (item: AdminMessage, status: "open" | "resolved") => {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setErrorMessage(isAmharic ? "እንደ አስተዳዳሪ ወይም ሰራተኛ መግባት አለብዎት።" : "You must be signed in as admin or staff.");
      return;
    }

    setUpdatingMessageId(item.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/messages/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status,
          adminNote: noteDrafts[item.id] ?? "",
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        updated?: {
          id: number;
          status: "open" | "resolved";
          adminNote: string | null;
          resolvedAt: string | null;
        };
        message?: string;
      };

      if (!response.ok || !payload.updated) {
        setErrorMessage(payload.message ?? (isAmharic ? "መልእክቱን ማዘመን አልተቻለም።" : "Unable to update message."));
        return;
      }

      setMessages((previous) =>
        previous.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                status: payload.updated?.status ?? entry.status,
                adminNote: payload.updated?.adminNote ?? entry.adminNote,
                resolvedAt: payload.updated?.resolvedAt ?? entry.resolvedAt,
              }
            : entry,
        ),
      );
      setSuccessMessage(status === "resolved" ? (isAmharic ? "መልእክቱ ተፈትቷል ተብሎ ተመልክቷል።" : "Message marked as resolved.") : isAmharic ? "መልእክቱ ዳግም ተከፍቷል።" : "Message reopened.");
    } finally {
      setUpdatingMessageId(null);
    }
  };

  const orderedMessages = useMemo(
    () => [...messages].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    [messages],
  );

  return (
    <section className="app-bg-panel h-full rounded-2xl border border-white/10 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{isAmharic ? "የደንበኛ መልእክቶች" : "Customer Messages"}</h1>
          <p className="mt-1 text-sm text-gray-300">{isAmharic ? "ከትዕዛዞቻቸው ጋር የተያያዙ የድጋፍ መልእክቶችን ይመልከቱ እና ይፍቱ።" : "Review and resolve customer support messages linked to their orders."}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            void loadMessages();
          }}
          className="app-hover-accent-soft rounded-lg border border-white/15 px-3 py-2 text-sm text-gray-200"
        >
          {isAmharic ? "አድስ" : "Refresh"}
        </button>
      </div>

      {errorMessage ? <p className="mt-4 text-sm text-red-300">{errorMessage}</p> : null}
      {successMessage ? <p className="mt-4 text-sm text-emerald-300">{successMessage}</p> : null}

      {isLoading ? (
        <p className="mt-4 text-sm text-gray-400">{isAmharic ? "መልእክቶች በመጫን ላይ..." : "Loading messages..."}</p>
      ) : orderedMessages.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">{isAmharic ? "እስካሁን የደንበኛ መልእክቶች የሉም።" : "No customer messages yet."}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {orderedMessages.map((item) => (
            <article key={item.id} className="app-bg-elevated rounded-xl border border-white/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">{item.orderNumber}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(item.createdAt, locale)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs ${item.status === "resolved" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                  {item.status === "resolved" ? (isAmharic ? "ተፈትቷል" : "Resolved") : isAmharic ? "ክፍት" : "Open"}
                </span>
              </div>

              <p className="mt-3 text-sm text-gray-100">{item.message}</p>

              <div className="mt-3 grid gap-2 text-xs text-gray-300 md:grid-cols-3">
                <p>{isAmharic ? "የመገለጫ ስም:" : "Profile Name:"} {item.customer.fullName ?? "-"}</p>
                <p>{isAmharic ? "የትዕዛዝ ስም:" : "Order Name:"} {item.customer.customerName ?? "-"}</p>
                <p>{isAmharic ? "ስልክ:" : "Phone:"} {item.customer.customerPhone ?? "-"}</p>
              </div>

              {item.orderItems.length > 0 ? (
                <p className="mt-2 text-xs text-gray-400">
                  {isAmharic ? "የታዘዘ ምግብ:" : "Food Ordered:"} {item.orderItems.map((orderItem) => `${orderItem.title} x${orderItem.quantity}`).join(", ")}
                </p>
              ) : null}

              <label className="mt-3 block text-xs text-gray-400">
                {isAmharic ? "የአስተዳዳሪ ማስታወሻ" : "Admin note"}
                <textarea
                  rows={2}
                  value={noteDrafts[item.id] ?? ""}
                  onChange={(event) =>
                    setNoteDrafts((previous) => ({
                      ...previous,
                      [item.id]: event.target.value,
                    }))
                  }
                  className="app-bg-panel mt-2 w-full rounded-lg border border-white/15 px-3 py-2 text-sm text-gray-100 outline-none"
                  placeholder={isAmharic ? "ለዚህ ደንበኛ የተደረገውን ይጻፉ" : "Write what was done for this customer"}
                />
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={updatingMessageId === item.id}
                  onClick={() => {
                    void handleStatusUpdate(item, "resolved");
                  }}
                  className="app-bg-accent rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAmharic ? "እንደ ተፈታ ምልክት አድርግ" : "Mark Resolved"}
                </button>
                <button
                  type="button"
                  disabled={updatingMessageId === item.id}
                  onClick={() => {
                    void handleStatusUpdate(item, "open");
                  }}
                  className="app-hover-accent-soft rounded-lg border border-white/15 px-3 py-1.5 text-xs text-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAmharic ? "እንደገና ክፈት" : "Reopen"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
