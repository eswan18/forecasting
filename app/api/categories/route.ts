import { NextResponse } from "next/server";
import { getCategories } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";

export async function GET() {
  try {
    const user = await getUserFromCookies();

    if (!user) {
      return NextResponse.json({ categories: [] }, { status: 401 });
    }

    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to load categories", error);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
