import "server-only";
import argon2 from "argon2";
import { createLogin, createUser, getLoginByUsername } from "@/lib/db_actions";

const SALT = process.env.ARGON2_SALT;

/**
 * Creates a new user with login credentials in the database.
 *
 * This function handles the complete user registration process including:
 * - Validating username uniqueness and password strength
 * - Hashing the password with Argon2
 * - Creating login and user records in the database
 *
 * @param params - The user registration parameters
 * @param params.username - Unique username for login (required)
 * @param params.password - Plain text password, must be at least 8 characters (required)
 * @param params.name - Display name for the user (required)
 * @param params.email - Email address for the user (required)
 * @param params.isAdmin - Whether the user should have admin privileges (optional, defaults to false)
 *
 * @returns ServerActionResult containing the created user ID on success
 *
 * @throws {Error} When username/password are missing
 * @throws {Error} When username already exists
 * @throws {Error} When password is less than 8 characters
 * @throws {Error} When database operations fail
 *
 * @example
 * ```typescript
 * const result = await registerNewUser({
 *   username: "johndoe",
 *   password: "securepassword123",
 *   name: "John Doe",
 *   email: "john@example.com",
 *   isAdmin: false
 * });
 * ```
 */
export async function registerNewUser({
  username,
  password,
  name,
  email,
  isAdmin = false,
}: {
  username: string;
  password: string;
  name: string;
  email: string;
  isAdmin?: boolean;
}) {
  if (!username || !password) {
    throw new Error("Username and password are required.");
  }

  const existingLogin = await getLoginByUsername(username);
  if (existingLogin) {
    throw new Error("Username already exists.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  const passwordHash = await argon2.hash(SALT + password, {
    type: argon2.argon2id,
  });
  const login = { username, password_hash: passwordHash };
  const loginId = await createLogin({ login });

  if (!loginId) {
    throw new Error("Failed to create login record");
  }

  const user = { name, email, login_id: loginId, is_admin: isAdmin };
  const result = await createUser({ user });

  return result;
}
