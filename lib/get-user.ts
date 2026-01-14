"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/database";
import { VUser } from "@/types/db_types";
import { redirect } from "next/navigation";
import { validateIDPToken } from "@/lib/idp/client";
import { logger } from "@/lib/logger";

/**
 * Get the current user from cookies.
 * Validates the IDP access token and looks up the user.
 */
export async function getUserFromCookies(): Promise<VUser | null> {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return null;
  }

  return getUserFromIDPToken(token);
}

/**
 * Get user from an IDP access token.
 * These tokens are JWTs signed by the IDP with ES256.
 */
async function getUserFromIDPToken(token: string): Promise<VUser | null> {
  try {
    const claims = await validateIDPToken(token);

    const user = await db
      .selectFrom("v_users")
      .selectAll()
      .where("idp_user_id", "=", claims.sub)
      .executeTakeFirstOrThrow();

    // Check if user is deactivated
    if (user.deactivated_at) {
      logger.warn("Deactivated user attempted access via IDP", {
        userId: user.id,
        idpUserId: claims.sub,
      });
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Get user from a token string.
 */
export async function getUserFromToken(token: string): Promise<VUser | null> {
  return getUserFromIDPToken(token);
}

export async function loginAndRedirect({
  url,
}: {
  url: string;
}): Promise<never> {
  if (url === "/") {
    // The login page redirect to the home page by default, so we don't need to specify
    // it in the query params.
    redirect("/login");
  } else {
    const redirectTo = encodeURIComponent(url);
    redirect(`/login?redirect=${redirectTo}`);
  }
}
