"use server";

import * as dotenv from "dotenv";
import { getUserFromCookies } from "../get-user";
import {
  consumeInviteToken,
  inviteTokenIsValid,
} from "../db_actions/invite-tokens";
import { createUserWithCredentials } from "./register-internal";
dotenv.config({ path: ".env.local" });

/// Create a new user.
export async function registerNewUser({
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

  await createUserWithCredentials({ username, password, name, email });

  // Consume the invite token, if one was provided.
  if (inviteToken) {
    await consumeInviteToken(inviteToken);
  }
}
