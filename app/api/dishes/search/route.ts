import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type DishRow = {
  title: string;
  price: number;
  image_url: string | null;
  availability_count: number;
  is_active: boolean;
  categories:
    | {
        name: string;
      }
    | Array<{
        name: string;
      }>
    | null;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").trim();

    if (!query) {
      return NextResponse.json({ dishes: [] });
    }

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("dishes")
      .select("title, price, image_url, availability_count, is_active, categories(name)")
      .ilike("title", `%${query}%`)
      .order("created_at", { ascending: true })
      .limit(60);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    const dishes = ((data ?? []) as DishRow[]).map((dishRow) => {
      const categoryName = Array.isArray(dishRow.categories)
        ? dishRow.categories[0]?.name
        : dishRow.categories?.name;

      return {
        title: dishRow.title,
        price: Number(dishRow.price),
        availability: `${dishRow.availability_count} Bowls available`,
        image: dishRow.image_url || "/image/pizza.png",
        categories: categoryName ? [categoryName] : [],
        isActive: dishRow.is_active,
      };
    });

    return NextResponse.json({ dishes });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to search dishes." },
      { status: 500 },
    );
  }
}