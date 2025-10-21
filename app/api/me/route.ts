import { NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/get-user";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getUserFromCookies();
  return NextResponse.json(user);
}
