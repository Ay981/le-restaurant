import { NextResponse } from "next/server";
import { requireRoleAccess } from "@/lib/supabase/admin-route-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type NotificationRow = {
  id: number;
  order_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

export async function GET(request: Request) {
  try {
    const authResult = await requireRoleAccess(request, ["customer"]);
    if (!authResult.ok) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("order_notifications")
      .select("id, order_id, title, message, is_read, created_at, read_at")
      .eq("customer_user_id", authResult.userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    const notifications = ((data ?? []) as NotificationRow[]).map((row) => ({
      id: row.id,
      orderId: row.order_id,
      title: row.title,
      message: row.message,
      isRead: row.is_read,
      createdAt: row.created_at,
      readAt: row.read_at,
    }));

    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to load notifications.",
      },
      { status: 500 },
    );
  }
}
