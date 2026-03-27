import { NextResponse } from "next/server";
import { requireRoleAccess } from "@/lib/supabase/admin-route-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type CheckoutItem = {
  title: string;
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

  if (normalized === "delivery" || normalized === "ዴሊቨሪ") {
    return "delivery";
  }

  if (normalized === "to go" || normalized === "to_go" || normalized === "togo" || normalized === "ለመውሰድ") {
    return "to_go";
  }

  if (normalized === "dine in" || normalized === "dine_in" || normalized === "በሬስቶራንት") {
    return "dine_in";
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
    const authResult = await requireRoleAccess(request, ["customer", "admin", "staff"]);
    if (!authResult.ok) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    let body: CheckoutPayload;
    try {
      body = (await request.json()) as CheckoutPayload;
    } catch {
      return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
    }

    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ message: "At least one order item is required." }, { status: 400 });
    }

    const normalizedItems = items.map((item) => ({
      title: String(item.title ?? "").trim(),
      quantity: Number(item.quantity ?? 0),
      note: typeof item.note === "string" ? item.note.trim() : "",
    }));

    const hasInvalidItem = normalizedItems.some(
      (item) => !item.title || !Number.isInteger(item.quantity) || item.quantity <= 0,
    );

    if (hasInvalidItem) {
      return NextResponse.json(
        { message: "Each item must include title and quantity greater than 0." },
        { status: 400 },
      );
    }

    const uniqueTitles = [...new Set(normalizedItems.map((item) => item.title))];
    const supabase = createSupabaseAdminClient();
    const { data: dishRows, error: dishLookupError } = await supabase
      .from("dishes")
      .select("id, title, price, is_active")
      .in("title", uniqueTitles);

    if (dishLookupError) {
      return NextResponse.json({ message: "Could not validate order items." }, { status: 400 });
    }

    const dishByTitle = new Map(
      (dishRows ?? []).map((row) => [
        String(row.title),
        {
          id: String(row.id),
          price: Number(row.price ?? 0),
          isActive: Boolean(row.is_active),
        },
      ]),
    );

    const unknownOrInactiveDish = uniqueTitles.find((title) => {
      const dish = dishByTitle.get(title);
      return !dish || !dish.isActive;
    });
    if (unknownOrInactiveDish) {
      return NextResponse.json(
        { message: `Dish is unavailable: ${unknownOrInactiveDish}` },
        { status: 400 },
      );
    }

    const normalizedItemsWithPrice = normalizedItems.map((item) => {
      const dish = dishByTitle.get(item.title);
      if (!dish) {
        return null;
      }

      return {
        title: item.title,
        dishId: dish.id,
        quantity: item.quantity,
        note: item.note,
        unitPrice: dish.price,
      };
    });

    if (normalizedItemsWithPrice.some((item) => item === null)) {
      return NextResponse.json({ message: "Could not validate order items." }, { status: 400 });
    }
    const validatedItems = normalizedItemsWithPrice.filter(
      (
        item,
      ): item is {
        title: string;
        dishId: string;
        quantity: number;
        note: string;
        unitPrice: number;
      } => item !== null,
    );

    const orderType = mapOrderTypeToDb(body.selectedOrderType ?? "dine_in");
    const subtotal = roundCurrency(
      validatedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    );
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

    const orderItemsPayload = validatedItems.map((item) => ({
      order_id: createdOrder.id,
      dish_id: item.dishId,
      dish_title_snapshot: item.title,
      unit_price: item.unitPrice,
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
