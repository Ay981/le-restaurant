import { NextResponse } from "next/server";
import { requireAdminOrStaffAccess } from "@/lib/supabase/admin-route-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ReviewDecision = "accepted" | "rejected";
type DbOrderStatus = "pending" | "preparing" | "served" | "completed" | "cancelled";

type OrderLookupRow = {
  id: string;
  order_number: string;
  status: DbOrderStatus;
  customer_user_id: string | null;
};

type ReceiptVerificationRow = {
  id: string;
  review_status: "pending" | ReviewDecision;
};

function parseDecision(value: unknown): ReviewDecision | null {
  if (value === "accepted" || value === "rejected") {
    return value;
  }

  return null;
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

    const body = (await request.json().catch(() => ({}))) as { decision?: unknown; note?: unknown };
    const decision = parseDecision(body.decision);

    if (!decision) {
      return NextResponse.json({ message: "Decision must be either accepted or rejected." }, { status: 400 });
    }

    const reviewNote = typeof body.note === "string" ? body.note.trim() : "";
    const nowIso = new Date().toISOString();

    const supabase = createSupabaseAdminClient();

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, status, customer_user_id")
      .eq("id", id)
      .single();

    if (orderError || !orderData) {
      return NextResponse.json({ message: orderError?.message ?? "Order not found." }, { status: 404 });
    }

    const order = orderData as OrderLookupRow;

    const { data: receiptData, error: receiptError } = await supabase
      .from("payment_receipt_verifications")
      .select("id, review_status")
      .eq("order_number", order.order_number)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (receiptError) {
      return NextResponse.json({ message: receiptError.message }, { status: 400 });
    }

    if (!receiptData) {
      return NextResponse.json({ message: "No receipt verification found for this order." }, { status: 404 });
    }

    const receiptVerification = receiptData as ReceiptVerificationRow;
    const previousOrderStatus = order.status;
    let nextOrderStatus: DbOrderStatus = order.status;

    const { error: updateError } = await supabase
      .from("payment_receipt_verifications")
      .update({
        review_status: decision,
        review_note: reviewNote.length > 0 ? reviewNote : null,
        reviewed_at: nowIso,
        reviewed_by: authResult.userId,
      })
      .eq("id", receiptVerification.id);

    if (updateError) {
      return NextResponse.json({ message: updateError.message }, { status: 400 });
    }

    if (decision === "accepted" && order.status === "pending") {
      const { data: updatedOrder, error: orderUpdateError } = await supabase
        .from("orders")
        .update({
          status: "preparing",
          started_at: nowIso,
          last_status_changed_by: authResult.userId,
        })
        .eq("id", order.id)
        .select("status")
        .single();

      if (orderUpdateError) {
        return NextResponse.json({ message: orderUpdateError.message }, { status: 400 });
      }

      nextOrderStatus = (updatedOrder?.status as DbOrderStatus | undefined) ?? "preparing";

      const { error: auditError } = await supabase.from("order_status_audit").insert({
        order_id: order.id,
        old_status: previousOrderStatus,
        new_status: nextOrderStatus,
        changed_by: authResult.userId,
      });

      if (auditError) {
        console.error("Non-fatal order status audit insertion failure in receipt review", {
          orderId: order.id,
          receiptVerificationId: receiptVerification.id,
          auditError,
        });
      }
    }

    const { error: staffNotificationUpdateError } = await supabase
      .from("staff_order_notifications")
      .update({
        action_status: decision,
        actioned_at: nowIso,
        actioned_by: authResult.userId,
        is_read: true,
        read_at: nowIso,
      })
      .eq("receipt_verification_id", receiptVerification.id);

    if (staffNotificationUpdateError) {
      console.error("Non-fatal staff notification update failure in receipt review", {
        orderId: order.id,
        receiptVerificationId: receiptVerification.id,
        staffNotificationUpdateError,
      });
    }

    if (order.customer_user_id) {
      const noteSuffix = reviewNote.length > 0 ? ` Note: ${reviewNote}` : "";
      const isOrderAccepted = decision === "accepted";

      const { error: customerNotificationError } = await supabase.from("order_notifications").insert({
        order_id: order.id,
        customer_user_id: order.customer_user_id,
        title: isOrderAccepted ? "Order accepted" : "Payment receipt rejected",
        message: isOrderAccepted
          ? `Your order ${order.order_number} was accepted and is now being prepared.${noteSuffix}`
          : `Your receipt for ${order.order_number} was rejected by our staff.${noteSuffix}`,
        status_from: previousOrderStatus,
        status_to: nextOrderStatus,
      });

      if (customerNotificationError) {
        console.error("Non-fatal customer notification insertion failure in receipt review", {
          orderId: order.id,
          receiptVerificationId: receiptVerification.id,
          customerNotificationError,
        });
      }
    }

    return NextResponse.json({
      message: decision === "accepted" ? "Receipt accepted. Order accepted and moved to preparation." : "Receipt rejected.",
      receiptReview: {
        status: decision,
        note: reviewNote.length > 0 ? reviewNote : null,
        reviewedAt: nowIso,
        reviewedBy: authResult.userId,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to review receipt.",
      },
      { status: 500 },
    );
  }
}
