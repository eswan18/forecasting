"use server";

import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { getLoginByUsername } from "@/lib/db_actions";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getUserFromCookies } from "../get-user";
import {
  isIdentityLoginEnabled,
  setUserIdpUserId,
} from "@/lib/db_actions/identity-login-flag";
import { IDPAdminClient, IDPUserExistsError } from "@/lib/idp/client";
import { logger } from "@/lib/logger";

const JWT_SECRET = process.env.JWT_SECRET;
const SALT = process.env.ARGON2_SALT;

type LoginResponseSuccess = {
  success: true;
};
type LoginResponseError = {
  success: false;
  error: string;
  useOAuth?: boolean; // Indicates the client should redirect to OAuth flow
};
export type LoginResponse = LoginResponseSuccess | LoginResponseError;

export async function login({
  username,
  password,
}: {
  username: string;
  password: string;
}): Promise<LoginResponse> {
  // Check if this user should use IDP login
  const { enabled: useIDP, user } = await isIdentityLoginEnabled(username);

  if (useIDP) {
    // Check if user needs migration (has no idp_user_id yet)
    if (user && user.idp_user_id === null) {
      // Legacy user - verify password locally, then migrate to IDP
      return await legacyLoginWithMigration({ username, password, user });
    } else if (user && user.idp_user_id !== null) {
      // User has already been migrated - they should use OAuth flow
      return {
        success: false,
        error: "Please use the new login method.",
        useOAuth: true,
      };
    } else {
      // Unknown user with IDP enabled - they should register via IDP
      return {
        success: false,
        error: "Please use the new login method.",
        useOAuth: true,
      };
    }
  }

  // Original legacy login flow
  return await legacyLogin({ username, password });
}

/**
 * Standard legacy login flow - verify password and create JWT.
 */
async function legacyLogin({
  username,
  password,
}: {
  username: string;
  password: string;
}): Promise<LoginResponse> {
  // Fetch the user from the database
  const loginResult = await getLoginByUsername(username);
  if (!loginResult.success) {
    logger.warn("Failed to retrieve login", { username, error: loginResult.error });
    return { success: false, error: "Invalid username or password." };
  }
  const login = loginResult.data;
  if (!login) {
    logger.warn("Attempted login with invalid username", { username });
    return { success: false, error: "Invalid username or password." };
  }

  // Verify the password
  const isValid = await argon2.verify(login.password_hash, SALT + password);
  if (!isValid) {
    logger.warn("Attempted login with invalid password", { username });
    return { success: false, error: "Invalid username or password." };
  }

  // Create a JWT token
  if (!JWT_SECRET) {
    logger.error("JWT_SECRET is not set");
    return { success: false, error: "Internal error." };
  }
  const token = jwt.sign({ loginId: login.id }, JWT_SECRET, {
    expiresIn: "3h",
  });
  // Set the token in an HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 10800, // 3 hours
    sameSite: "lax",
    path: "/",
  });
  revalidatePath("/");
  return { success: true };
}

/**
 * Legacy login with migration to IDP.
 * Verifies credentials locally, creates user in IDP, then logs in normally.
 */
async function legacyLoginWithMigration({
  username,
  password,
  user,
}: {
  username: string;
  password: string;
  user: { id: number; email: string };
}): Promise<LoginResponse> {
  // 1. Verify credentials locally (existing logic)
  const loginResult = await getLoginByUsername(username);
  if (!loginResult.success || !loginResult.data) {
    return { success: false, error: "Invalid username or password." };
  }

  const isValid = await argon2.verify(
    loginResult.data.password_hash,
    SALT + password,
  );
  if (!isValid) {
    return { success: false, error: "Invalid username or password." };
  }

  // 2. Create user in IDP (using admin client credentials)
  const idpClient = new IDPAdminClient();

  try {
    const idpUser = await idpClient.createUser(username, user.email, password);

    // 3. Update local user with IDP user ID
    await setUserIdpUserId(user.id, idpUser.id);

    logger.info("Successfully migrated user to IDP", {
      userId: user.id,
      idpUserId: idpUser.id,
      username,
    });
  } catch (error) {
    if (error instanceof IDPUserExistsError) {
      // User already exists in IDP - this could happen if migration was
      // partially completed. Log but continue with login.
      logger.warn("User already exists in IDP during migration", {
        userId: user.id,
        username,
        error: error.message,
      });
    } else {
      // If IDP creation fails for other reasons, log but continue with legacy login
      logger.error("Failed to create IDP user during migration", error as Error, {
        userId: user.id,
        username,
      });
    }
    // Still allow login with legacy system
  }

  // 4. Create session using legacy JWT (for simplicity during transition)
  if (!JWT_SECRET) {
    logger.error("JWT_SECRET is not set");
    return { success: false, error: "Internal error." };
  }

  const token = jwt.sign({ loginId: loginResult.data.id }, JWT_SECRET, {
    expiresIn: "3h",
  });

  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 10800, // 3 hours
    sameSite: "lax",
    path: "/",
  });
  revalidatePath("/");

  return { success: true };
}

export async function loginViaImpersonation(username: string) {
  const user = await getUserFromCookies();
  if (!user || !user.is_admin) {
    throw new Error("Not authorized.");
  }

  const loginResult = await getLoginByUsername(username);
  if (!loginResult.success || !loginResult.data) {
    throw new Error(
      loginResult.success ? "Invalid username." : loginResult.error,
    );
  }
  const login = loginResult.data;

  // Create a JWT token
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set.");
  }
  const token = jwt.sign({ loginId: login.id }, JWT_SECRET, {
    expiresIn: "3h",
  });

  // Set the token in an HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 10800, // 3 hours
    sameSite: "lax",
    path: "/",
  });
  revalidatePath("/");
}
