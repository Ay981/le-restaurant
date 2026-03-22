import { NextResponse } from "next/server";
import { requireRoleAccess } from "@/lib/supabase/admin-route-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type OrderRow = {
  id: string;
  status: "pending" | "preparing" | "served" | "completed" | "cancelled";
  customer_user_id: string | null;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const authResult = await requireRoleAccess(request, ["customer", "admin", "staff"]);
    if (!authResult.ok) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: "Order id is required." }, { status: 400 });
    }

    const body = (await request.json()) as { comment?: unknown };
    const comment = String(body.comment ?? "").trim();

    if (!comment) {
      return NextResponse.json({ message: "Comment is required." }, { status: 400 });
    }

    if (comment.length > 800) {
      return NextResponse.json({ message: "Comment must be 800 characters or less." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, customer_user_id")
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ message: orderError?.message ?? "Order not found." }, { status: 404 });
    }

    const typedOrder = order as OrderRow;

    if (!typedOrder.customer_user_id || typedOrder.customer_user_id !== authResult.userId) {
      return NextResponse.json({ message: "You can only comment on your own orders." }, { status: 403 });
    }

    if (!["served", "completed"].includes(typedOrder.status)) {
      return NextResponse.json({ message: "You can comment only after your order is delivered." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("order_feedback")
      .upsert(
        {
          order_id: typedOrder.id,
          customer_user_id: authResult.userId,
          comment,
          status: "open",
          admin_note: null,
          resolved_at: null,
          resolved_by: null,
        },
        { onConflict: "order_id,customer_user_id" },
      )
      .select("id, order_id, comment, status, admin_note, resolved_at, created_at, updated_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ message: error?.message ?? "Failed to submit feedback." }, { status: 400 });
    }

    return NextResponse.json({
      feedback: {
        id: data.id,
        orderId: data.order_id,
        comment: data.comment,
        status: data.status,
        adminNote: data.admin_note,
        resolvedAt: data.resolved_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
      message: "Feedback submitted.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to submit feedback.",
      },
      { status: 500 },
    );
  }
}
