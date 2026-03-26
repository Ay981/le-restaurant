import { NextResponse } from "next/server";
import { requireRoleAccess } from "@/lib/supabase/admin-route-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type OrderRow = {
  id: string;
  order_number: string;
  status: "pending" | "preparing" | "served" | "completed" | "cancelled";
  customer_user_id: string | null;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const authResult = await requireRoleAccess(request, ["customer", "admin", "staff"]);
    if (!authResult.ok) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: "Order id is required." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, status, customer_user_id")
      .eq("id", id)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json({ message: orderError.message }, { status: 400 });
    }

    if (!orderData) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    const order = orderData as OrderRow;
    const isAdminOrStaff = authResult.role === "admin" || authResult.role === "staff";

    if (!isAdminOrStaff && order.customer_user_id !== authResult.userId) {
      return NextResponse.json({ message: "You can only delete your own orders." }, { status: 403 });
    }

    if (order.status !== "pending") {
      return NextResponse.json({ message: "Only pending orders can be deleted." }, { status: 400 });
    }

    const { data: receiptData, error: receiptError } = await supabase
      .from("payment_receipt_verifications")
      .select("id")
      .eq("order_number", order.order_number)
      .limit(1)
      .maybeSingle();

    if (receiptError) {
      return NextResponse.json({ message: receiptError.message }, { status: 400 });
    }

    if (receiptData) {
      return NextResponse.json({ message: "Cannot delete an order that already has a verified receipt." }, { status: 400 });
    }

    const { error: deleteError } = await supabase.from("orders").delete().eq("id", order.id);

    if (deleteError) {
      return NextResponse.json({ message: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Order deleted." });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to delete order.",
      },
      { status: 500 },
    );
  }
}
