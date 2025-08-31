"use server";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/lib/database";
import { VUser } from "@/types/db_types";
import { redirect } from "next/navigation";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function getUserFromCookies(): Promise<VUser | null> {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return null;
  }
  return await getUserFromToken(token);
}

export async function getUserFromToken(token: string): Promise<VUser | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { loginId: number };
    const user = await db
      .selectFrom("v_users")
      .selectAll()
      .where("login_id", "=", decoded.loginId)
      .executeTakeFirstOrThrow();
    return user;
  } catch {
    return null;
  }
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
