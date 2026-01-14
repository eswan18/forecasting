/**
 * Migration script to create all forecasting users in the IDP.
 *
 * Usage:
 *   npx tsx scripts/migrate-users-to-idp.ts [env-file]
 *
 * Examples:
 *   npx tsx scripts/migrate-users-to-idp.ts .env.idp.dev
 *   npx tsx scripts/migrate-users-to-idp.ts .env.prod
 *
 * Defaults to .env.id-dev if no env file is specified.
 */

import dotenv from "dotenv";
import path from "path";
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { Database } from "@/types/db_types";
import crypto from "crypto";

// Load environment file
const envFile = process.argv[2];
const envPath = path.resolve(process.cwd(), envFile);
console.log(`Loading environment from: ${envPath}`);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error(`Error loading ${envFile}:`, result.error.message);
  process.exit(1);
}


// IDP Configuration from environment
const IDP_BASE_URL = process.env.IDP_BASE_URL || "";
const IDP_ADMIN_CLIENT_ID = process.env.IDP_ADMIN_CLIENT_ID || "";
const IDP_ADMIN_CLIENT_SECRET = process.env.IDP_ADMIN_CLIENT_SECRET || "";

if (!IDP_ADMIN_CLIENT_ID || !IDP_ADMIN_CLIENT_SECRET) {
  console.error(
    "Error: IDP_ADMIN_CLIENT_ID and IDP_ADMIN_CLIENT_SECRET must be set",
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL must be set");
  process.exit(1);
}

// Initialize database connection
const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
});

// IDP types
interface IDPUser {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Simple IDP admin client for the script
class IDPAdminClient {
  private token: string | null = null;
  private tokenExpiry: number = 0;

  async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry - 60000) {
      return this.token;
    }

    const response = await fetch(`${IDP_BASE_URL}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: IDP_ADMIN_CLIENT_ID,
        client_secret: IDP_ADMIN_CLIENT_SECRET,
        scope: "admin:users:read admin:users:write",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get admin token: ${error}`);
    }

    const data: TokenResponse = await response.json();
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;

    return this.token;
  }

  async listUsers(): Promise<IDPUser[]> {
    const token = await this.getToken();
    const response = await fetch(`${IDP_BASE_URL}/admin/users?limit=100`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list users from IDP: ${error}`);
    }

    const data: { users: IDPUser[] } = await response.json();
    return data.users;
  }

  async createUser(
    username: string,
    email: string,
    password: string,
  ): Promise<IDPUser> {
    const token = await this.getToken();

    const response = await fetch(`${IDP_BASE_URL}/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      if (response.status === 409) {
        throw new Error(`User already exists: ${error}`);
      }
      throw new Error(`Failed to create user in IDP: ${error}`);
    }

    return response.json();
  }
}

function generateRandomPassword(): string {
  // Generate a random 24-character password
  return crypto.randomBytes(18).toString("base64");
}

async function main() {
  console.log("Starting IDP migration...\n");
  console.log(`IDP Base URL: ${IDP_BASE_URL}`);

  const idpClient = new IDPAdminClient();

  // Fetch existing IDP users
  console.log("\nFetching existing IDP users...");
  const existingIdpUsers = await idpClient.listUsers();
  const idpUsersByUsername = new Map(
    existingIdpUsers.map((u) => [u.username, u]),
  );
  console.log(`Found ${existingIdpUsers.length} existing IDP users`);

  // Fetch all active forecasting users
  console.log("\nFetching forecasting users...");
  const users = await db
    .selectFrom("v_users")
    .selectAll()
    .where("deactivated_at", "is", null)
    .execute();
  console.log(`Found ${users.length} active forecasting users`);

  // Track results
  const results = {
    alreadyLinked: [] as string[],
    linked: [] as string[],
    created: [] as string[],
    failed: [] as { username: string; error: string }[],
  };

  for (const user of users) {
    const username = user.username;

    // Skip users without usernames
    if (!username) {
      console.log(`Skipping user ${user.id} - no username`);
      continue;
    }

    // Skip if already linked
    if (user.idp_user_id) {
      results.alreadyLinked.push(username);
      continue;
    }

    try {
      // Check if user exists in IDP
      const existingIdpUser = idpUsersByUsername.get(username);

      if (existingIdpUser) {
        // Link existing IDP user
        await db
          .updateTable("users")
          .set({ idp_user_id: existingIdpUser.id })
          .where("id", "=", user.id)
          .execute();
        results.linked.push(username);
        console.log(`Linked: ${username} (${user.email}) -> ${existingIdpUser.id}`);
      } else {
        // Create new IDP user with random password
        const password = generateRandomPassword();
        const newIdpUser = await idpClient.createUser(
          username,
          user.email,
          password,
        );

        // Link the new user
        await db
          .updateTable("users")
          .set({ idp_user_id: newIdpUser.id })
          .where("id", "=", user.id)
          .execute();
        results.created.push(username);
        console.log(`Created: ${username} (${user.email}) -> ${newIdpUser.id}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.failed.push({ username, error: message });
      console.error(`Failed: ${username} (${user.email}) - ${message}`);
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(50));
  console.log("Migration Summary");
  console.log("=".repeat(50));
  console.log(`Already linked: ${results.alreadyLinked.length}`);
  console.log(`Linked to existing IDP user: ${results.linked.length}`);
  console.log(`Created in IDP: ${results.created.length}`);
  console.log(`Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log("\nFailed users:");
    for (const { username, error } of results.failed) {
      console.log(`  - ${username}: ${error}`);
    }
  }

  // Close database connection
  await db.destroy();

  console.log("\nMigration complete!");
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
