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
    const result = await hasFeatureEnabled({
      featureName,
      userId: user.id,
    });
    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      console.error(
        `Failed to check feature flag ${featureName}:`,
        result.error,
      );
      return NextResponse.json(false);
    }
  } catch (error) {
    console.error(`Failed to check feature flag ${featureName}:`, error);
    return NextResponse.json(false);
  }
}
