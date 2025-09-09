import "server-only";

import argon2 from "argon2";
import { createLogin, createUser, getLoginByUsername } from "@/lib/db_actions";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SALT = process.env.ARGON2_SALT;

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

  const passwordHash = await argon2.hash(String(SALT) + password, {
    type: argon2.argon2id,
  });
  const login = { username, password_hash: passwordHash };
  const loginId = await createLogin({ login });

  const user = { name, email, login_id: loginId, is_admin: isAdmin };
  return await createUser({ user });
}
