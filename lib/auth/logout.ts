"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function logout() {
  // Accomplish a logout by updating the user's cookie to one that expires immediately.
  const cookieStore = await cookies();
  cookieStore.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // expires immediately
    path: "/",
  });
  revalidatePath("/");
}
