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
    if (!id) {
      return NextResponse.json({ message: "Order id is required." }, { status: 400 });
    }

    const body = (await request.json()) as {
      status?: unknown;
      adminNote?: unknown;
    };

    const nextStatus = String(body.status ?? "").trim();
    if (nextStatus !== "open" && nextStatus !== "resolved") {
      return NextResponse.json({ message: "Status must be open or resolved." }, { status: 400 });
    }

    const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim() : "";

    const supabase = createSupabaseAdminClient();
    const { data: existing, error: existingError } = await supabase
      .from("order_feedback")
      .select("id")
      .eq("order_id", id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ message: existingError.message }, { status: 400 });
    }

    if (!existing?.id) {
      return NextResponse.json({ message: "No customer feedback found for this order." }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const updatePayload: {
      status: "open" | "resolved";
      admin_note: string | null;
      resolved_at: string | null;
      resolved_by: string | null;
    } = {
      status: nextStatus,
      admin_note: adminNote || null,
      resolved_at: nextStatus === "resolved" ? nowIso : null,
      resolved_by: nextStatus === "resolved" ? authResult.userId : null,
    };

    const { data, error } = await supabase
      .from("order_feedback")
      .update(updatePayload)
      .eq("order_id", id)
      .select("id, order_id, comment, status, admin_note, resolved_at, created_at, updated_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ message: error?.message ?? "Failed to update feedback." }, { status: 400 });
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
      message: "Feedback updated.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to update feedback.",
      },
      { status: 500 },
    );
  }
}
