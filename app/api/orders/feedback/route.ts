import { NextResponse } from "next/server";
import { requireRoleAccess } from "@/lib/supabase/admin-route-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type FeedbackRow = {
  id: number;
  order_id: string;
  customer_user_id: string;
  comment: string;
  status: "open" | "resolved";
  admin_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function GET(request: Request) {
  try {
    const authResult = await requireRoleAccess(request, ["customer", "admin", "staff"]);
    if (!authResult.ok) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const orderIdsParam = (searchParams.get("orderIds") ?? "").trim();
    const orderIds = orderIdsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 50);

    if (orderIds.length === 0) {
      return NextResponse.json({ feedback: [] });
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("order_feedback")
      .select("id, order_id, customer_user_id, comment, status, admin_note, resolved_at, created_at, updated_at")
      .eq("customer_user_id", authResult.userId)
      .in("order_id", orderIds)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    const feedback = ((data ?? []) as FeedbackRow[]).map((row) => ({
      id: row.id,
      orderId: row.order_id,
      comment: row.comment,
      status: row.status,
      adminNote: row.admin_note,
      resolvedAt: row.resolved_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ feedback });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to load feedback.",
      },
      { status: 500 },
    );
  }
}
