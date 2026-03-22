import { NextResponse } from "next/server";
import { requireAdminOrStaffAccess } from "@/lib/supabase/admin-route-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DbOrderStatus = "pending" | "preparing" | "served" | "completed" | "cancelled";
type UiOrderStatus = "pending" | "in_progress" | "delivered";

type OrderRow = {
  id: string;
  order_number: string;
  order_type: "dine_in" | "to_go" | "delivery";
  status: DbOrderStatus;
  total: number;
  created_at: string;
  started_at: string | null;
  delivered_at: string | null;
  note: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
};

function toUiStatus(status: DbOrderStatus): UiOrderStatus {
  if (status === "pending") return "pending";
  if (status === "preparing") return "in_progress";
  return "delivered";
}

export async function GET(request: Request) {
  try {
    const authResult = await requireAdminOrStaffAccess(request);
    if (!authResult.ok) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").trim();
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "20", 10) || 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = createSupabaseAdminClient();

    let queryBuilder = supabase
      .from("orders")
      .select(
        "id, order_number, order_type, status, total, created_at, started_at, delivered_at, note, customer_name, customer_phone, delivery_address",
        { count: "exact" },
      )
      .in("status", ["pending", "preparing", "served", "completed"])
      .order("created_at", { ascending: false })
      .range(from, to);

    if (query) {
      queryBuilder = queryBuilder.or(
        `order_number.ilike.%${query}%,customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%,delivery_address.ilike.%${query}%`,
      );
    }

    const { data, error, count } = await queryBuilder;

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    const orders = ((data ?? []) as OrderRow[]).map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      orderType: order.order_type,
      status: toUiStatus(order.status),
      total: Number(order.total) || 0,
      createdAt: order.created_at,
      startedAt: order.started_at,
      deliveredAt: order.delivered_at,
      note: order.note,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      deliveryAddress: order.delivery_address,
    }));

    return NextResponse.json({
      orders,
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to load orders.",
      },
      { status: 500 },
    );
  }
}
