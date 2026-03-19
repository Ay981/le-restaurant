import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/supabase/admin-route-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { uploadDishImage } from "@/lib/supabase/dish-image-upload";
import { parseDishPayload, toNonNegativeInteger, toNonNegativeNumber } from "./_lib/parsing";

export async function POST(request: Request) {
  try {
    const authResult = await requireAdminAccess(request);
    if (!authResult.ok) {
      return NextResponse.json(
        {
          message: authResult.message,
        },
        { status: authResult.status },
      );
    }

    const body = await parseDishPayload(request);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const price = toNonNegativeNumber(body.price);
    const availabilityCount = toNonNegativeInteger(body.availabilityCount);

    if (!title) {
      return NextResponse.json({ message: "Dish title is required." }, { status: 400 });
    }

    if (price === null) {
      return NextResponse.json({ message: "Dish price must be a non-negative number." }, { status: 400 });
    }

    if (availabilityCount === null) {
      return NextResponse.json(
        { message: "Availability must be a non-negative whole number." },
        { status: 400 },
      );
    }

    const uploadedImageUrl = body.imageFile ? await uploadDishImage(body.imageFile) : null;
    const imageUrl =
      uploadedImageUrl ||
      (typeof body.imageUrl === "string" && body.imageUrl.trim().length > 0
        ? body.imageUrl.trim()
        : "/image/pizza.png");

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("dishes")
      .insert({
        title,
        price,
        availability_count: availabilityCount,
        image_url: imageUrl,
        category_id: body.categoryId ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ id: data.id, message: "Dish created." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to create dish.",
      },
      { status: 500 },
    );
  }
}
