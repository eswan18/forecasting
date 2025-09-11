"use server";

import { getUserFromCookies } from "../get-user";
import {
  consumeInviteToken,
  inviteTokenIsValid,
} from "../db_actions/invite-tokens";
import { registerNewUser } from "./register-internal";

/**
 * Creates a new user with proper authorization checks.
 *
 * This server action validates that the requesting user has permission to create
 * a new account. Authorization is granted if the requesting user is an admin OR
 * a valid invite token is provided.
 *
 * @param params - The user registration parameters
 * @param params.username - Unique username for login (required)
 * @param params.password - Plain text password, must meet strength requirements (required)
 * @param params.name - Display name for the user (required)
 * @param params.email - Email address for the user (required)
 * @param params.inviteToken - Optional invite token for non-admin registrations
 *
 * @throws {Error} When no invite token is provided and user is not admin
 * @throws {Error} When provided invite token is invalid
 * @throws {Error} When user registration fails (see registerNewUser for details)
 *
 * @example
 * ```typescript
 * // Admin creating user without token
 * await registerNewUserIfAuthorized({
 *   username: "newuser",
 *   password: "securepass123",
 *   name: "New User",
 *   email: "new@example.com"
 * });
 *
 * // Non-admin using invite token
 * await registerNewUserIfAuthorized({
 *   username: "inviteduser",
 *   password: "securepass123",
 *   name: "Invited User",
 *   email: "invited@example.com",
 *   inviteToken: "abc123"
 * });
 * ```
 */
export async function registerNewUserIfAuthorized({
  username,
  password,
  name,
  email,
  inviteToken,
}: {
  username: string;
  password: string;
  name: string;
  email: string;
  inviteToken?: string;
}) {
  const requestingUser = await getUserFromCookies();
  // The user must be an admin OR provide a valid invite token.
  if (requestingUser?.is_admin) {
    console.log("User is an admin.");
  } else {
    if (!inviteToken) {
      throw new Error("No invite token provided.");
    }
    // Check if the invite token is valid
    const tokenIsValid = await inviteTokenIsValid(inviteToken);
    if (!tokenIsValid) {
      throw new Error("Invalid invite token.");
    }
    console.log("Confirmed valid invite token.");
  }

  await registerNewUser({ username, password, name, email });

  // Consume the invite token, if one was provided.
  if (inviteToken) {
    await consumeInviteToken(inviteToken);
  }
}
