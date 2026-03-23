import { NextResponse } from "next/server";
import { requireAdminOrStaffAccess } from "@/lib/supabase/admin-route-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type MessageRow = {
  id: number;
  customer_user_id: string;
  order_id: string;
  message: string;
  status: "open" | "resolved";
  admin_note: string | null;
  resolved_at: string | null;
  created_at: string;
};

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  order_items:
    | Array<{
        dish_title_snapshot: string;
        quantity: number;
      }>
    | null;
};

type ProfileRow = {
  user_id: string;
  full_name: string | null;
};

export async function GET(request: Request) {
  try {
    const authResult = await requireAdminOrStaffAccess(request);
    if (!authResult.ok) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("customer_messages")
      .select("id, customer_user_id, order_id, message, status, admin_note, resolved_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Failed to load admin messages", { error, adminUserId: authResult.userId });
      return NextResponse.json({ message: "Unable to load messages." }, { status: 400 });
    }

    const messages = (data ?? []) as MessageRow[];
    const orderIds = [...new Set(messages.map((item) => item.order_id))];
    const customerIds = [...new Set(messages.map((item) => item.customer_user_id))];

    let orderById = new Map<string, { orderNumber: string; customerName: string | null; customerPhone: string | null; items: Array<{ title: string; quantity: number }> }>();
    let profileByUserId = new Map<string, string | null>();

    if (orderIds.length > 0) {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_phone, order_items(dish_title_snapshot, quantity)")
        .in("id", orderIds);

      if (!ordersError) {
        orderById = ((ordersData ?? []) as OrderRow[]).reduce((accumulator, order) => {
          accumulator.set(order.id, {
            orderNumber: order.order_number,
            customerName: order.customer_name,
            customerPhone: order.customer_phone,
            items: (order.order_items ?? []).map((item) => ({
              title: item.dish_title_snapshot,
              quantity: Number(item.quantity) || 0,
            })),
          });
          return accumulator;
        }, new Map<string, { orderNumber: string; customerName: string | null; customerPhone: string | null; items: Array<{ title: string; quantity: number }> }>());
      }
    }

    if (customerIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", customerIds);

      if (!profilesError) {
        profileByUserId = ((profilesData ?? []) as ProfileRow[]).reduce((accumulator, profile) => {
          accumulator.set(profile.user_id, profile.full_name);
          return accumulator;
        }, new Map<string, string | null>());
      }
    }

    return NextResponse.json({
      messages: messages.map((item) => ({
        id: item.id,
        orderId: item.order_id,
        orderNumber: orderById.get(item.order_id)?.orderNumber ?? "-",
        message: item.message,
        status: item.status,
        adminNote: item.admin_note,
        resolvedAt: item.resolved_at,
        createdAt: item.created_at,
        customer: {
          userId: item.customer_user_id,
          fullName: profileByUserId.get(item.customer_user_id) ?? null,
          customerName: orderById.get(item.order_id)?.customerName ?? null,
          customerPhone: orderById.get(item.order_id)?.customerPhone ?? null,
        },
        orderItems: orderById.get(item.order_id)?.items ?? [],
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to load messages.",
      },
      { status: 500 },
    );
  }
}
