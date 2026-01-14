"use server";

import { cookies } from "next/headers";
import crypto from "crypto";
import { getRealUserFromCookies } from "@/lib/get-user";
import { db } from "@/lib/database";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";

const IMPERSONATION_COOKIE = "impersonate";
const IMPERSONATION_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

/**
 * Create a signed impersonation token.
 * Format: userId:adminId:timestamp:signature
 */
function createSignedToken(userId: number, adminId: number): string {
  const timestamp = Date.now();
  const data = `${userId}:${adminId}:${timestamp}`;
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(data)
    .digest("hex");
  return `${data}:${signature}`;
}

/**
 * Start impersonating a user. Only admins can do this.
 */
export async function startImpersonation(
  targetUserId: number,
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getRealUserFromCookies();

  if (!currentUser) {
    logger.warn("Impersonation attempt without authentication");
    return { success: false, error: "Not authenticated" };
  }

  if (!currentUser.is_admin) {
    logger.warn("Non-admin attempted impersonation", {
      userId: currentUser.id,
      targetUserId,
    });
    return { success: false, error: "Not authorized" };
  }

  // Verify target user exists
  const targetUser = await db
    .selectFrom("v_users")
    .selectAll()
    .where("id", "=", targetUserId)
    .executeTakeFirst();

  if (!targetUser) {
    return { success: false, error: "User not found" };
  }

  // Don't allow impersonating yourself
  if (targetUserId === currentUser.id) {
    return { success: false, error: "Cannot impersonate yourself" };
  }

  // Create signed token and set cookie
  const token = createSignedToken(targetUserId, currentUser.id);
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: IMPERSONATION_EXPIRY_MS / 1000,
    sameSite: "lax",
    path: "/",
  });

  logger.info("Admin started impersonation", {
    adminId: currentUser.id,
    adminUsername: currentUser.username,
    targetUserId,
    targetUsername: targetUser.username,
  });

  revalidatePath("/");
  return { success: true };
}

/**
 * Stop impersonating and return to admin's own session.
 */
export async function stopImpersonation(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATION_COOKIE);
  logger.info("Impersonation stopped");
  revalidatePath("/");
}
