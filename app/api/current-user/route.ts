import { NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/get-user";

export async function GET() {
  const user = await getUserFromCookies();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
