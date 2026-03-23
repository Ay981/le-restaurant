import { NextResponse } from "next/server";
import { requireAdminOrStaffAccess } from "@/lib/supabase/admin-route-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const authResult = await requireAdminOrStaffAccess(request);
    if (!authResult.ok) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const { id } = await context.params;
    const messageId = Number(id);

    if (!Number.isInteger(messageId) || messageId <= 0) {
      return NextResponse.json({ message: "Invalid message id." }, { status: 400 });
    }

    const body = (await request.json()) as {
      status?: unknown;
      adminNote?: unknown;
    };

    const status = String(body.status ?? "").trim();
    if (status !== "open" && status !== "resolved") {
      return NextResponse.json({ message: "Status must be open or resolved." }, { status: 400 });
    }

    const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim() : "";
    const nowIso = new Date().toISOString();

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("customer_messages")
      .update({
        status,
        admin_note: adminNote || null,
        resolved_at: status === "resolved" ? nowIso : null,
        resolved_by: status === "resolved" ? authResult.userId : null,
      })
      .eq("id", messageId)
      .select("id, status, admin_note, resolved_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ message: error?.message ?? "Failed to update message." }, { status: 400 });
    }

    return NextResponse.json({
      updated: {
        id: data.id,
        status: data.status,
        adminNote: data.admin_note,
        resolvedAt: data.resolved_at,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to update message.",
      },
      { status: 500 },
    );
  }
}
