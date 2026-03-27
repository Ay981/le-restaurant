import { NextResponse } from "next/server";
import { requireAdminOrStaffAccess } from "@/lib/supabase/admin-route-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type UiOrderStatus = "pending" | "in_progress" | "delivered" | "rejected";
type DbOrderStatus = "pending" | "preparing" | "completed";

type OrderRow = {
  id: string;
  status: DbOrderStatus | "served" | "cancelled";
  started_at: string | null;
  delivered_at: string | null;
  customer_user_id: string | null;
  order_number: string;
};

function toDbStatus(status: UiOrderStatus): DbOrderStatus {
  if (status === "pending") return "pending";
  if (status === "in_progress") return "preparing";
  return "completed";
}

function toUiStatusFromDb(status: OrderRow["status"]): UiOrderStatus {
  if (status === "pending") return "pending";
  if (status === "preparing") return "in_progress";
  if (status === "cancelled") return "rejected";
  return "delivered";
}

function parseStatus(value: unknown): UiOrderStatus | null {
  if (value === "pending" || value === "in_progress" || value === "delivered" || value === "rejected") {
    return value;
  }

  return null;
}

function canTransition(current: UiOrderStatus, next: UiOrderStatus) {
  if (current === next) return true;

  if (current === "pending") {
    return next === "in_progress" || next === "rejected";
  }

  if (current === "in_progress") {
    return next === "delivered";
  }

  return false;
}

function normalizeReason(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const authResult = await requireAdminOrStaffAccess(request);
    if (!authResult.ok) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: "Order id is required." }, { status: 400 });
    }

    const body = (await request.json()) as { status?: unknown; reason?: unknown };
    const nextStatus = parseStatus(body.status);
    const rejectionReason = normalizeReason(body.reason);

    if (!nextStatus) {
      return NextResponse.json(
        { message: "Status must be one of: pending, in_progress, delivered, rejected." },
        { status: 400 },
      );
    }

    if (nextStatus === "rejected" && rejectionReason.length < 3) {
      return NextResponse.json(
        { message: "A rejection reason with at least 3 characters is required." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: currentOrder, error: currentOrderError } = await supabase
      .from("orders")
      .select("id, status, started_at, delivered_at, customer_user_id, order_number")
      .eq("id", id)
      .single();

    if (currentOrderError || !currentOrder) {
      return NextResponse.json({ message: currentOrderError?.message ?? "Order not found." }, { status: 404 });
    }

    const currentStatus = toUiStatusFromDb(currentOrder.status);
    if (!canTransition(currentStatus, nextStatus)) {
      return NextResponse.json(
        {
          message: `Invalid status transition from ${currentStatus} to ${nextStatus}. Allowed flow is pending → in_progress → delivered or pending → rejected.`,
        },
        { status: 400 },
      );
    }

    if (currentStatus === "pending" && nextStatus === "in_progress") {
      const { data: latestReceiptReview, error: latestReceiptReviewError } = await supabase
        .from("payment_receipt_verifications")
        .select("review_status")
        .eq("order_number", currentOrder.order_number)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestReceiptReviewError) {
        return NextResponse.json({ message: latestReceiptReviewError.message }, { status: 400 });
      }

      if (!latestReceiptReview) {
        return NextResponse.json(
          { message: "A verified receipt is required before moving this order to in progress." },
          { status: 400 },
        );
      }

      if (latestReceiptReview.review_status !== "accepted") {
        return NextResponse.json(
          {
            message:
              latestReceiptReview.review_status === "rejected"
                ? "The latest receipt was rejected. Upload and approve a valid receipt before continuing."
                : "The latest receipt is still pending staff review. Accept or reject it first.",
          },
          { status: 400 },
        );
      }
    }

    const nowIso = new Date().toISOString();
    const nextDbStatus = nextStatus === "rejected" ? "cancelled" : toDbStatus(nextStatus);
    const updatePayload: {
      status: DbOrderStatus | "cancelled";
      started_at?: string;
      delivered_at?: string;
      last_status_changed_by?: string;
      admin_decision_note?: string | null;
    } = {
      status: nextDbStatus,
      last_status_changed_by: authResult.userId,
    };

    if (nextStatus === "in_progress" && !currentOrder.started_at) {
      updatePayload.started_at = nowIso;
    }

    if (nextStatus === "delivered") {
      if (!currentOrder.started_at) {
        updatePayload.started_at = nowIso;
      }
      if (!currentOrder.delivered_at) {
        updatePayload.delivered_at = nowIso;
      }
    }

    if (nextStatus === "rejected") {
      updatePayload.admin_decision_note = rejectionReason;
    } else {
      updatePayload.admin_decision_note = null;
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", id)
      .select("id, status, started_at, delivered_at")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    const { error: auditError } = await supabase.from("order_status_audit").insert({
      order_id: id,
      old_status: currentOrder.status,
      new_status: nextDbStatus,
      changed_by: authResult.userId,
    });

    if (auditError) {
      return NextResponse.json({ message: auditError.message }, { status: 400 });
    }

    if (currentStatus !== nextStatus && currentOrder.customer_user_id) {
      const nextStatusLabel =
        nextStatus === "in_progress"
          ? "Accepted"
          : nextStatus === "pending"
            ? "Pending"
            : nextStatus === "rejected"
              ? "Rejected"
              : "Delivered";

      const message =
        nextStatus === "rejected"
          ? `${currentOrder.order_number} was rejected. Reason: ${rejectionReason}`
          : nextStatus === "in_progress"
            ? `${currentOrder.order_number} was accepted and is now in progress.`
            : `${currentOrder.order_number} is now ${nextStatusLabel}.`;

      const { error: notificationError } = await supabase.from("order_notifications").insert({
        order_id: id,
        customer_user_id: currentOrder.customer_user_id,
        title: "Order Status Updated",
        message,
        status_from: currentOrder.status,
        status_to: nextDbStatus,
      });

      if (notificationError) {
        console.error("Non-fatal notification insertion failure in order status update", {
          orderId: id,
          notificationError,
        });
      }
    }

    const order = data as OrderRow;

    return NextResponse.json({
      id: order.id,
      status: toUiStatusFromDb(order.status),
      startedAt: order.started_at,
      deliveredAt: order.delivered_at,
      reason: nextStatus === "rejected" ? rejectionReason : null,
      message: "Order status updated.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to update order status.",
      },
      { status: 500 },
    );
  }
}
