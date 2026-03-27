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
    <section className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">{isAmharic ? "የደንበኛ መልእክቶች" : "Customer Messages"}</h1>
          <p className="mt-2 text-sm text-gray-400">{isAmharic ? "ከትዕዛዞቻቸው ጋር የተያያዙ የድጋፍ መልእክቶችን ይመልከቱ እና ይፍቱ።" : "Review and resolve customer support messages linked to their orders."}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            void loadMessages();
          }}
          className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors"
        >
          {isAmharic ? "አድስ" : "Refresh"}
        </button>
      </div>

      {errorMessage ? <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">{errorMessage}</p> : null}
      {successMessage ? <p className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-200">{successMessage}</p> : null}

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin">
            <svg className="h-8 w-8 text-white/40" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="mt-3 text-sm text-gray-400">{isAmharic ? "መልእክቶች በመጫን ላይ..." : "Loading messages..."}</p>
        </div>
      ) : orderedMessages.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
          <p className="text-gray-400">{isAmharic ? "እስካሁን የደንበኛ መልእክቶች የሉም።" : "No customer messages yet."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orderedMessages.map((item) => (
            <article key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-white/15">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">{item.orderNumber}</p>
                  <p className="mt-1 text-xs text-gray-500">{formatDateTime(item.createdAt, locale)}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium border ${
                    item.status === "resolved"
                      ? "border-green-500/20 bg-green-500/5 text-green-300"
                      : "border-amber-500/20 bg-amber-500/5 text-amber-300"
                  }`}
                >
                  {item.status === "resolved" ? (isAmharic ? "ተፈትቷል" : "Resolved") : isAmharic ? "ክፍት" : "Open"}
                </span>
              </div>

              <p className="mt-4 text-sm text-gray-200">{item.message}</p>

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="grid gap-3 text-sm text-gray-400 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{isAmharic ? "የመገለጫ ስም" : "Profile Name"}</p>
                    <p className="mt-1 text-gray-300">{item.customer.fullName ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{isAmharic ? "የትዕዛዝ ስም" : "Order Name"}</p>
                    <p className="mt-1 text-gray-300">{item.customer.customerName ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{isAmharic ? "ስልክ" : "Phone"}</p>
                    <p className="mt-1 text-gray-300">{item.customer.customerPhone ?? "-"}</p>
                  </div>
                </div>

                {item.orderItems.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{isAmharic ? "የታዘዘ ምግብ" : "Food Ordered"}</p>
                    <p className="mt-1 text-sm text-gray-300">{item.orderItems.map((orderItem) => `${orderItem.title} ×${orderItem.quantity}`).join(", ")}</p>
                  </div>
                )}
              </div>

              {item.status === "resolved" ? (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{isAmharic ? "የአስተዳዳሪ ማስታወሻ" : "Admin note"}</p>
                  <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300">
                    {(item.adminNote ?? noteDrafts[item.id] ?? "").trim() ||
                      (isAmharic ? "ማስታወሻ አልተጨመረም።" : "No admin note added.")}
                  </div>
                </div>
              ) : (
                <label className="mt-4 block text-xs text-gray-500 uppercase tracking-wide">
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
                    className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 outline-none placeholder:text-gray-600"
                    placeholder={isAmharic ? "ለዚህ ደንበኛ የተደረገውን ይጻፉ" : "Write what was done for this customer"}
                  />
                </label>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {item.status === "open" ? (
                  <button
                    type="button"
                    disabled={updatingMessageId === item.id}
                    onClick={() => {
                      void handleStatusUpdate(item, "resolved");
                    }}
                    className="rounded-lg bg-green-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  >
                    {isAmharic ? "እንደ ተፈታ ምልክት አድርግ" : "Mark Resolved"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={updatingMessageId === item.id}
                    onClick={() => {
                      void handleStatusUpdate(item, "open");
                    }}
                    className="rounded-lg border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  >
                    {isAmharic ? "እንደገና ክፈት" : "Reopen"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
