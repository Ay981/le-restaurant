import { NextResponse } from "next/server";
import { requireRoleAccess } from "@/lib/supabase/admin-route-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const authResult = await requireRoleAccess(request, ["customer", "admin", "staff"]);
    if (!authResult.ok) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const body = (await request.json().catch(() => ({}))) as { ids?: unknown };
    const ids = Array.isArray(body.ids)
      ? body.ids
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0)
          .slice(0, 50)
      : [];

    const supabase = createSupabaseAdminClient();
    const nowIso = new Date().toISOString();

    let updateQuery = supabase
      .from("order_notifications")
      .update({ is_read: true, read_at: nowIso })
      .eq("customer_user_id", authResult.userId)
      .eq("is_read", false);

    if (ids.length > 0) {
      updateQuery = updateQuery.in("id", ids);
    }

    const { error } = await updateQuery;

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Notifications marked as read." });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to update notifications.",
      },
      { status: 500 },
    );
  }
}
