import { NextResponse } from "next/server";
import { requireAdminOrStaffAccess } from "@/lib/supabase/admin-route-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { uploadDishImage } from "@/lib/supabase/dish-image-upload";
import { getSafeDishImageUrl, validateDishTitle } from "@/lib/dishes/quality";
import { parseDishPayload, toNonNegativeInteger, toNonNegativeNumber } from "../_lib/parsing";

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const authResult = await requireAdminOrStaffAccess(request);
    if (!authResult.ok) {
      return NextResponse.json(
        {
          message: authResult.message,
        },
        { status: authResult.status },
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: "Dish id is required." }, { status: 400 });
    }

    const body = await parseDishPayload(request, { includeIsActive: true });

    const supabase = createSupabaseAdminClient();

    const isStatusOnlyPatch =
      typeof body.isActive === "boolean" &&
      body.title === undefined &&
      body.price === undefined &&
      body.availabilityCount === undefined &&
      body.imageUrl === undefined &&
      (body.categoryId === undefined || body.categoryId === null) &&
      !body.imageFile;

    if (isStatusOnlyPatch) {
      const { error } = await supabase
        .from("dishes")
        .update({
          is_active: body.isActive,
        })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }

      return NextResponse.json({ message: "Dish status updated." }, { status: 200 });
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const price = toNonNegativeNumber(body.price);
    const availabilityCount = toNonNegativeInteger(body.availabilityCount);
    const isActive = typeof body.isActive === "boolean" ? body.isActive : null;

    const titleValidationError = validateDishTitle(title);
    if (titleValidationError) {
      return NextResponse.json({ message: titleValidationError }, { status: 400 });
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

    if (isActive === null) {
      return NextResponse.json({ message: "Dish active status is required." }, { status: 400 });
    }

    const uploadedImageUrl = body.imageFile ? await uploadDishImage(body.imageFile) : null;
    const imageUrl = uploadedImageUrl || getSafeDishImageUrl(body.imageUrl);

    const { error } = await supabase
      .from("dishes")
      .update({
        title,
        price,
        availability_count: availabilityCount,
        image_url: imageUrl,
        category_id: body.categoryId ?? null,
        is_active: isActive,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Dish updated." }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to update dish.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const authResult = await requireAdminOrStaffAccess(request);
    if (!authResult.ok) {
      return NextResponse.json(
        {
          message: authResult.message,
        },
        { status: authResult.status },
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: "Dish id is required." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { error: detachError } = await supabase
      .from("order_items")
      .update({ dish_id: null })
      .eq("dish_id", id);

    if (detachError) {
      return NextResponse.json({ message: detachError.message }, { status: 400 });
    }

    const { data: deletedRows, error } = await supabase
      .from("dishes")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (!deletedRows || deletedRows.length === 0) {
      return NextResponse.json({ message: "Dish already deleted." }, { status: 200 });
    }

    return NextResponse.json({ message: "Dish deleted." }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to delete dish.",
      },
      { status: 500 },
    );
  }
}
