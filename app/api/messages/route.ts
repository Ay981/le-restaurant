import { NextResponse } from "next/server";
import { requireRoleAccess } from "@/lib/supabase/admin-route-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type MessageRow = {
  id: number;
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
  order_items:
    | Array<{
        dish_title_snapshot: string;
        quantity: number;
      }>
    | null;
};

export async function GET(request: Request) {
  try {
    const authResult = await requireRoleAccess(request, ["customer"]);
    if (!authResult.ok) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("customer_messages")
      .select("id, order_id, message, status, admin_note, resolved_at, created_at")
      .eq("customer_user_id", authResult.userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Failed to load customer messages", { error, userId: authResult.userId });
      return NextResponse.json({ message: "Unable to load messages." }, { status: 400 });
    }

    const messages = (data ?? []) as MessageRow[];
    const orderIds = [...new Set(messages.map((item) => item.order_id))];

    let orderById = new Map<string, { orderNumber: string; items: Array<{ title: string; quantity: number }> }>();

    if (orderIds.length > 0) {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, order_number, order_items(dish_title_snapshot, quantity)")
        .in("id", orderIds);

      if (ordersError) {
        console.error("Failed to load related orders for messages", { ordersError, userId: authResult.userId });
      } else {
        orderById = ((ordersData ?? []) as OrderRow[]).reduce((accumulator, order) => {
          accumulator.set(order.id, {
            orderNumber: order.order_number,
            items: (order.order_items ?? []).map((item) => ({
              title: item.dish_title_snapshot,
              quantity: Number(item.quantity) || 0,
            })),
          });
          return accumulator;
        }, new Map<string, { orderNumber: string; items: Array<{ title: string; quantity: number }> }>());
      }
    }

    return NextResponse.json({
      messages: messages.map((item) => ({
        id: item.id,
        orderId: item.order_id,
        message: item.message,
        status: item.status,
        adminNote: item.admin_note,
        resolvedAt: item.resolved_at,
        createdAt: item.created_at,
        orderNumber: orderById.get(item.order_id)?.orderNumber ?? "-",
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

export async function POST(request: Request) {
  try {
    const authResult = await requireRoleAccess(request, ["customer"]);
    if (!authResult.ok) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const body = (await request.json()) as { orderId?: unknown; message?: unknown };
    const orderId = String(body.orderId ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!orderId) {
      return NextResponse.json({ message: "Order is required." }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ message: "Message is required." }, { status: 400 });
    }

    if (message.length > 1000) {
      return NextResponse.json({ message: "Message must be 1000 characters or less." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .eq("customer_user_id", authResult.userId)
      .maybeSingle();

    if (orderError || !order?.id) {
      return NextResponse.json({ message: "Order not found for current customer." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("customer_messages")
      .insert({
        customer_user_id: authResult.userId,
        order_id: order.id,
        message,
        status: "open",
      })
      .select("id, order_id, message, status, admin_note, resolved_at, created_at")
      .single();

    if (error || !data) {
      console.error("Failed to create customer message", { error, userId: authResult.userId, orderId });
      return NextResponse.json({ message: "Unable to send message." }, { status: 400 });
    }

    return NextResponse.json(
      {
        message: {
          id: data.id,
          orderId: data.order_id,
          message: data.message,
          status: data.status,
          adminNote: data.admin_note,
          resolvedAt: data.resolved_at,
          createdAt: data.created_at,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to send message.",
      },
      { status: 500 },
    );
  }
}
