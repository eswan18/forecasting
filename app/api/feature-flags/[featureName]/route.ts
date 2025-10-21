import { NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/get-user";
import { hasFeatureEnabled } from "@/lib/db_actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ featureName: string }> },
) {
  const { featureName } = await params;
  const user = await getUserFromCookies();

  if (!user) {
    return NextResponse.json(false);
  }

  try {
    const enabled = await hasFeatureEnabled({
      featureName,
      userId: user.id,
    });
    return NextResponse.json(enabled);
  } catch (error) {
    console.error(`Failed to check feature flag ${featureName}:`, error);
    return NextResponse.json(false);
  }
}
