import { NextResponse } from "next/server";
import { requireAdminOrStaffAccess } from "@/lib/supabase/admin-route-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PAYMENT_RECEIPTS_BUCKET } from "@/lib/supabase/payment-receipt-upload";

type DbOrderStatus = "pending" | "preparing" | "served" | "completed" | "cancelled";
type UiOrderStatus = "pending" | "in_progress" | "delivered";

type OrderRow = {
  id: string;
  order_number: string;
  order_type: "dine_in" | "to_go" | "delivery";
  status: DbOrderStatus;
  total: number;
  created_at: string;
  started_at: string | null;
  delivered_at: string | null;
  note: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
};

type OrderItemRow = {
  order_id: string;
  dish_title_snapshot: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  note: string | null;
};

type ReceiptRow = {
  order_number: string;
  provider: string;
  transaction_reference: string;
  receipt_file_path: string | null;
  receipt_file_name: string | null;
  receipt_mime_type: string | null;
  expected_amount: number | null;
  verified_amount: number | null;
  verified_currency: string | null;
  expected_receiver: string | null;
  verified_receiver: string | null;
  amount_matches_expected: boolean | null;
  receiver_matches_expected: boolean | null;
  review_status: "pending" | "accepted" | "rejected";
  review_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
};

type FeedbackRow = {
  order_id: string;
  comment: string;
  status: "open" | "resolved";
  admin_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

function toUiStatus(status: DbOrderStatus): UiOrderStatus {
  if (status === "pending") return "pending";
  if (status === "preparing") return "in_progress";
  return "delivered";
}

export async function GET(request: Request) {
  try {
    const authResult = await requireAdminOrStaffAccess(request);
    if (!authResult.ok) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").trim();
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "20", 10) || 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = createSupabaseAdminClient();

    let queryBuilder = supabase
      .from("orders")
      .select(
        "id, order_number, order_type, status, total, created_at, started_at, delivered_at, note, customer_name, customer_phone, delivery_address",
        { count: "exact" },
      )
      .in("status", ["pending", "preparing", "served", "completed"])
      .order("created_at", { ascending: false })
      .range(from, to);

    if (query) {
      queryBuilder = queryBuilder.or(
        `order_number.ilike.%${query}%,customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%,delivery_address.ilike.%${query}%`,
      );
    }

    const { data, error, count } = await queryBuilder;

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    const orderRows = (data ?? []) as OrderRow[];
    const orderIds = orderRows.map((order) => order.id);
    const orderNumbers = orderRows.map((order) => order.order_number);

    let orderItemsByOrderId = new Map<string, Array<{
      dishTitle: string;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
      note: string | null;
    }>>();

    if (orderIds.length > 0) {
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from("order_items")
        .select("order_id, dish_title_snapshot, unit_price, quantity, line_total, note")
        .in("order_id", orderIds)
        .order("created_at", { ascending: true });

      if (orderItemsError) {
        return NextResponse.json({ message: orderItemsError.message }, { status: 400 });
      }

      const typedOrderItems = (orderItemsData ?? []) as OrderItemRow[];
      orderItemsByOrderId = typedOrderItems.reduce((accumulator, item) => {
        const previous = accumulator.get(item.order_id) ?? [];
        previous.push({
          dishTitle: item.dish_title_snapshot,
          unitPrice: Number(item.unit_price) || 0,
          quantity: Number(item.quantity) || 0,
          lineTotal: Number(item.line_total) || 0,
          note: item.note,
        });
        accumulator.set(item.order_id, previous);
        return accumulator;
      }, new Map<string, Array<{ dishTitle: string; unitPrice: number; quantity: number; lineTotal: number; note: string | null }>>());
    }

    let latestReceiptByOrderNumber = new Map<string, {
      provider: string;
      transactionReference: string;
      filePath: string | null;
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
    }>();

    let feedbackByOrderId = new Map<string, {
      comment: string;
      status: "open" | "resolved";
      adminNote: string | null;
      resolvedAt: string | null;
      createdAt: string;
      updatedAt: string;
    }>();

    if (orderNumbers.length > 0) {
      const { data: receiptsData, error: receiptsError } = await supabase
        .from("payment_receipt_verifications")
        .select("order_number, provider, transaction_reference, receipt_file_path, receipt_file_name, receipt_mime_type, expected_amount, verified_amount, verified_currency, expected_receiver, verified_receiver, amount_matches_expected, receiver_matches_expected, review_status, review_note, reviewed_at, reviewed_by, created_at")
        .in("order_number", orderNumbers)
        .order("created_at", { ascending: false });

      if (receiptsError) {
        return NextResponse.json({ message: receiptsError.message }, { status: 400 });
      }

      const typedReceipts = (receiptsData ?? []) as ReceiptRow[];
      latestReceiptByOrderNumber = typedReceipts.reduce((accumulator, receipt) => {
        if (!accumulator.has(receipt.order_number)) {
          accumulator.set(receipt.order_number, {
            provider: receipt.provider,
            transactionReference: receipt.transaction_reference,
            filePath: receipt.receipt_file_path,
            fileName: receipt.receipt_file_name,
            fileMimeType: receipt.receipt_mime_type,
            expectedAmount: receipt.expected_amount === null ? null : Number(receipt.expected_amount),
            verifiedAmount: receipt.verified_amount === null ? null : Number(receipt.verified_amount),
            verifiedCurrency: receipt.verified_currency,
            expectedReceiver: receipt.expected_receiver,
            verifiedReceiver: receipt.verified_receiver,
            amountMatchesExpected: receipt.amount_matches_expected,
            receiverMatchesExpected: receipt.receiver_matches_expected,
            reviewStatus: receipt.review_status,
            reviewNote: receipt.review_note,
            reviewedAt: receipt.reviewed_at,
            reviewedBy: receipt.reviewed_by,
            verifiedAt: receipt.created_at,
          });
        }

        return accumulator;
      }, new Map<string, { provider: string; transactionReference: string; filePath: string | null; fileName: string | null; fileMimeType: string | null; expectedAmount: number | null; verifiedAmount: number | null; verifiedCurrency: string | null; expectedReceiver: string | null; verifiedReceiver: string | null; amountMatchesExpected: boolean | null; receiverMatchesExpected: boolean | null; reviewStatus: "pending" | "accepted" | "rejected"; reviewNote: string | null; reviewedAt: string | null; reviewedBy: string | null; verifiedAt: string }>());
    }

    const receiptFilePathToSignedUrl = new Map<string, string>();
    const receiptPaths = [...latestReceiptByOrderNumber.values()]
      .map((receipt) => receipt.filePath)
      .filter((path): path is string => typeof path === "string" && path.length > 0);

    if (receiptPaths.length > 0) {
      const uniqueReceiptPaths = [...new Set(receiptPaths)];
      const { data: signedUrlsData, error: signedUrlsError } = await supabase.storage
        .from(PAYMENT_RECEIPTS_BUCKET)
        .createSignedUrls(uniqueReceiptPaths, 60 * 60);

      if (signedUrlsError) {
        return NextResponse.json({ message: signedUrlsError.message }, { status: 400 });
      }

      for (const signedItem of signedUrlsData ?? []) {
        if (!signedItem.path || !signedItem.signedUrl) {
          continue;
        }

        receiptFilePathToSignedUrl.set(signedItem.path, signedItem.signedUrl);
      }
    }

    if (orderIds.length > 0) {
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("order_feedback")
        .select("order_id, comment, status, admin_note, resolved_at, created_at, updated_at")
        .in("order_id", orderIds)
        .order("updated_at", { ascending: false });

      if (feedbackError) {
        return NextResponse.json({ message: feedbackError.message }, { status: 400 });
      }

      const typedFeedback = (feedbackData ?? []) as FeedbackRow[];
      feedbackByOrderId = typedFeedback.reduce((accumulator, feedback) => {
        if (!accumulator.has(feedback.order_id)) {
          accumulator.set(feedback.order_id, {
            comment: feedback.comment,
            status: feedback.status,
            adminNote: feedback.admin_note,
            resolvedAt: feedback.resolved_at,
            createdAt: feedback.created_at,
            updatedAt: feedback.updated_at,
          });
        }
        return accumulator;
      }, new Map<string, { comment: string; status: "open" | "resolved"; adminNote: string | null; resolvedAt: string | null; createdAt: string; updatedAt: string }>());
    }

    const orders = orderRows.map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      orderType: order.order_type,
      status: toUiStatus(order.status),
      total: Number(order.total) || 0,
      createdAt: order.created_at,
      startedAt: order.started_at,
      deliveredAt: order.delivered_at,
      note: order.note,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      deliveryAddress: order.delivery_address,
      items: orderItemsByOrderId.get(order.id) ?? [],
      receipt: (() => {
        const receipt = latestReceiptByOrderNumber.get(order.order_number);
        if (!receipt) {
          return null;
        }

        return {
          provider: receipt.provider,
          transactionReference: receipt.transactionReference,
          fileUrl: receipt.filePath ? receiptFilePathToSignedUrl.get(receipt.filePath) ?? null : null,
          fileName: receipt.fileName,
          fileMimeType: receipt.fileMimeType,
          expectedAmount: receipt.expectedAmount,
          verifiedAmount: receipt.verifiedAmount,
          verifiedCurrency: receipt.verifiedCurrency,
          expectedReceiver: receipt.expectedReceiver,
          verifiedReceiver: receipt.verifiedReceiver,
          amountMatchesExpected: receipt.amountMatchesExpected,
          receiverMatchesExpected: receipt.receiverMatchesExpected,
          reviewStatus: receipt.reviewStatus,
          reviewNote: receipt.reviewNote,
          reviewedAt: receipt.reviewedAt,
          reviewedBy: receipt.reviewedBy,
          verifiedAt: receipt.verifiedAt,
        };
      })(),
      feedback: feedbackByOrderId.get(order.id) ?? null,
    }));

    const { count: pendingReceiptReviewCount, error: pendingReceiptReviewError } = await supabase
      .from("staff_order_notifications")
      .select("id", { count: "exact", head: true })
      .eq("action_status", "pending");

    if (pendingReceiptReviewError) {
      return NextResponse.json({ message: pendingReceiptReviewError.message }, { status: 400 });
    }

    return NextResponse.json({
      orders,
      alerts: {
        pendingReceiptReviews: pendingReceiptReviewCount ?? 0,
      },
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to load orders.",
      },
      { status: 500 },
    );
  }
}
