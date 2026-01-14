"use server";

import argon2 from "argon2";
import { db } from "@/lib/database";
const SALT = process.env.ARGON2_SALT;

type UpdateLoginPasswordResponseSuccess = {
  success: true;
};
type UpdateLoginPasswordResponseError = {
  success: false;
  error: string;
};
export type UpdateLoginPasswordResponse =
  | UpdateLoginPasswordResponseSuccess
  | UpdateLoginPasswordResponseError;

export async function updateLoginPassword({
  id,
  currentPassword,
  newPassword,
}: {
  id: number;
  currentPassword: string;
  newPassword: string;
}): Promise<UpdateLoginPasswordResponse> {
  // Validate the current password.
  const login = await db
    .selectFrom("logins")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirstOrThrow();
  const isValid = await argon2.verify(
    login.password_hash,
    SALT + currentPassword,
  );
  if (!isValid) {
    console.log(
      `Attempted password update for login_id ${id} with invalid current password`,
    );
    return { success: false, error: "Incorrect current password" };
  }
  // Update the password.
  const newHash = await argon2.hash(SALT + newPassword, {
    type: argon2.argon2id,
  });
  await db
    .updateTable("logins")
    .set({ password_hash: newHash })
    .where("id", "=", id)
    .execute();
  return { success: true };
}
