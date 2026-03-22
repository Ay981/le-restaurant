import { NextResponse } from "next/server";
import { requireAdminOrStaffAccess } from "@/lib/supabase/admin-route-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type UiOrderStatus = "pending" | "in_progress" | "delivered";
type DbOrderStatus = "pending" | "preparing" | "completed";

type OrderRow = {
  id: string;
  status: DbOrderStatus | "served";
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

function toUiStatus(status: DbOrderStatus): UiOrderStatus {
  if (status === "pending") return "pending";
  if (status === "preparing") return "in_progress";
  return "delivered";
}

function parseStatus(value: unknown): UiOrderStatus | null {
  if (value === "pending" || value === "in_progress" || value === "delivered") {
    return value;
  }

  return null;
}

function canTransition(current: UiOrderStatus, next: UiOrderStatus) {
  if (current === next) return true;

  if (current === "pending") {
    return next === "in_progress";
  }

  if (current === "in_progress") {
    return next === "delivered";
  }

  return false;
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

    const body = (await request.json()) as { status?: unknown };
    const nextStatus = parseStatus(body.status);

    if (!nextStatus) {
      return NextResponse.json(
        { message: "Status must be one of: pending, in_progress, delivered." },
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

    const currentStatus = toUiStatus(currentOrder.status === "served" ? "completed" : currentOrder.status);
    if (!canTransition(currentStatus, nextStatus)) {
      return NextResponse.json(
        {
          message: `Invalid status transition from ${currentStatus} to ${nextStatus}. Allowed flow is pending → in_progress → delivered.`,
        },
        { status: 400 },
      );
    }

    const nowIso = new Date().toISOString();
    const nextDbStatus = toDbStatus(nextStatus);
    const updatePayload: {
      status: DbOrderStatus;
      started_at?: string;
      delivered_at?: string;
      last_status_changed_by?: string;
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
      const nextStatusLabel = nextStatus === "in_progress" ? "In Progress" : nextStatus === "pending" ? "Pending" : "Delivered";

      const { error: notificationError } = await supabase.from("order_notifications").insert({
        order_id: id,
        customer_user_id: currentOrder.customer_user_id,
        title: "Order Status Updated",
        message: `${currentOrder.order_number} is now ${nextStatusLabel}.`,
        status_from: currentOrder.status,
        status_to: nextDbStatus,
      });

      if (notificationError) {
        return NextResponse.json({ message: notificationError.message }, { status: 400 });
      }
    }

    const order = data as OrderRow;

    return NextResponse.json({
      id: order.id,
      status: toUiStatus(order.status === "served" ? "completed" : order.status),
      startedAt: order.started_at,
      deliveredAt: order.delivered_at,
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
