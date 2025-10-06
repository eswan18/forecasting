import { NextResponse } from "next/server";
import { getCompetitions } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";

export async function GET() {
  try {
    const user = await getUserFromCookies();

    if (!user) {
      return NextResponse.json({ competitions: [] }, { status: 401 });
    }

    const competitions = await getCompetitions();
    return NextResponse.json({ competitions });
  } catch (error) {
    console.error("Failed to load competitions", error);
    return NextResponse.json({ error: "Failed to load competitions" }, { status: 500 });
  }
}
