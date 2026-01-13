"use server";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/lib/database";
import { VUser } from "@/types/db_types";
import { redirect } from "next/navigation";
import { validateIDPToken } from "@/lib/idp/client";
import { logger } from "@/lib/logger";

const JWT_SECRET = process.env.JWT_SECRET as string;

/**
 * Get the current user from cookies.
 * Supports both legacy JWT tokens and IDP tokens.
 */
export async function getUserFromCookies(): Promise<VUser | null> {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return null;
  }

  // Try legacy JWT first
  const legacyUser = await getUserFromLegacyToken(token);
  if (legacyUser) {
    return legacyUser;
  }

  // Try IDP token
  const idpUser = await getUserFromIDPToken(token);
  return idpUser;
}

/**
 * Get user from a legacy JWT token.
 * These tokens contain { loginId: number } and are signed with JWT_SECRET.
 */
async function getUserFromLegacyToken(token: string): Promise<VUser | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { loginId: number };
    const user = await db
      .selectFrom("v_users")
      .selectAll()
      .where("login_id", "=", decoded.loginId)
      .executeTakeFirstOrThrow();

    // Check if user is deactivated
    if (user.deactivated_at) {
      logger.warn("Deactivated user attempted access", { userId: user.id });
      return null;
    }

    return user;
  } catch {
    return null;
  }
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
 * Get user from a token string (supports both legacy and IDP tokens).
 * This is primarily used for backwards compatibility.
 */
export async function getUserFromToken(token: string): Promise<VUser | null> {
  // Try legacy JWT first
  const legacyUser = await getUserFromLegacyToken(token);
  if (legacyUser) {
    return legacyUser;
  }

  // Try IDP token
  const idpUser = await getUserFromIDPToken(token);
  return idpUser;
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
