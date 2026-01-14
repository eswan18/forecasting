"use server";

import { getUserFromCookies } from "../get-user";
import { registerNewUser } from "./register-internal";

/**
 * Creates a new user with proper authorization checks.
 *
 * This server action validates that the requesting user has permission to create
 * a new account. Only admin users can create new accounts.
 *
 * @param params - The user registration parameters
 * @param params.username - Unique username for login (required)
 * @param params.password - Plain text password, must meet strength requirements (required)
 * @param params.name - Display name for the user (required)
 * @param params.email - Email address for the user (required)
 *
 * @throws {Error} When user is not an admin
 * @throws {Error} When user registration fails (see registerNewUser for details)
 *
 * @example
 * ```typescript
 * // Admin creating user
 * await registerNewUserIfAuthorized({
 *   username: "newuser",
 *   password: "securepass123",
 *   name: "New User",
 *   email: "new@example.com"
 * });
 * ```
 */
export async function registerNewUserIfAuthorized({
  username,
  password,
  name,
  email,
}: {
  username: string;
  password: string;
  name: string;
  email: string;
}) {
  const requestingUser = await getUserFromCookies();
  // Only admins can create new users.
  if (!requestingUser?.is_admin) {
    throw new Error("Only admins can register new users.");
  }

  await registerNewUser({ username, password, name, email });
}
