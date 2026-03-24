import { NextResponse } from "next/server";
import { requireRoleAccess } from "@/lib/supabase/admin-route-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type CheckoutItem = {
  title: string;
  price: number;
  quantity: number;
  note?: string;
};

type CheckoutPayload = {
  selectedOrderType?: string;
  discount?: number;
  items?: CheckoutItem[];
  deliveryDetails?: {
    destination?: string;
    customerName?: string;
    customerPhone?: string;
  };
};

type DbOrderType = "dine_in" | "to_go" | "delivery";

function mapOrderTypeToDb(value: string): DbOrderType {
  const normalized = value.trim().toLowerCase();

  if (normalized === "delivery") {
    return "delivery";
  }

  if (normalized === "to go" || normalized === "to_go" || normalized === "togo") {
    return "to_go";
  }

  return "dine_in";
}

function buildOrderNumber() {
  return `ORD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export async function POST(request: Request) {
  try {
    const authResult = await requireRoleAccess(request, ["customer"]);
    if (!authResult.ok) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const body = (await request.json()) as CheckoutPayload;

    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ message: "At least one order item is required." }, { status: 400 });
    }

    const normalizedItems = items.map((item) => ({
      title: String(item.title ?? "").trim(),
      price: Number(item.price ?? 0),
      quantity: Number(item.quantity ?? 0),
      note: typeof item.note === "string" ? item.note.trim() : "",
    }));

    const hasInvalidItem = normalizedItems.some(
      (item) => !item.title || !Number.isFinite(item.price) || item.price < 0 || !Number.isInteger(item.quantity) || item.quantity <= 0,
    );

    if (hasInvalidItem) {
      return NextResponse.json(
        { message: "Each item must include title, non-negative price, and quantity greater than 0." },
        { status: 400 },
      );
    }

    const orderType = mapOrderTypeToDb(body.selectedOrderType ?? "dine_in");
    const subtotal = roundCurrency(normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
    const discount = Number(body.discount ?? 0);

    if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) {
      return NextResponse.json(
        { message: "Discount must be a non-negative number and cannot exceed subtotal." },
        { status: 400 },
      );
    }

    const deliveryDetails = body.deliveryDetails ?? {};
    const destination = String(deliveryDetails.destination ?? "").trim();
    const customerName = String(deliveryDetails.customerName ?? "").trim();
    const customerPhone = String(deliveryDetails.customerPhone ?? "").trim();

    if (orderType === "delivery") {
      if (!destination || !customerName || !customerPhone) {
        return NextResponse.json(
          { message: "Delivery orders require destination, customer name, and customer phone." },
          { status: 400 },
        );
      }
    }

    const orderNumber = buildOrderNumber();
    const supabase = createSupabaseAdminClient();

    const { data: createdOrder, error: orderInsertError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        order_type: orderType,
        status: "pending",
        discount,
        subtotal,
        customer_user_id: authResult.userId,
        delivery_address: destination || null,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
      })
      .select("id, order_number")
      .single();

    if (orderInsertError || !createdOrder?.id) {
      return NextResponse.json(
        { message: orderInsertError?.message ?? "Could not create order record." },
        { status: 400 },
      );
    }

    const orderItemsPayload = normalizedItems.map((item) => ({
      order_id: createdOrder.id,
      dish_title_snapshot: item.title,
      unit_price: item.price,
      quantity: item.quantity,
      note: item.note || null,
    }));

    const { error: orderItemsInsertError } = await supabase.from("order_items").insert(orderItemsPayload);

    if (orderItemsInsertError) {
      return NextResponse.json({ message: orderItemsInsertError.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        id: createdOrder.id,
        orderNumber: createdOrder.order_number,
        message: "Order created.",
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to create order.",
      },
      { status: 500 },
    );
  }
}
