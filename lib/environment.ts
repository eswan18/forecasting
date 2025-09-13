import * as dotenv from "dotenv";
import * as path from "path";

/**
 * Environment management utility that loads the appropriate .env file
 * based on the ENV environment variable.
 *
 * Usage:
 * - ENV=local npm run dev (loads .env.local)
 * - ENV=dev npm run dev (loads .env.dev)
 * - ENV=prod npm run dev (loads .env.prod)
 *
 * If ENV is not set, defaults to 'local'
 */
export function loadEnvironment(): void {
  const env = process.env.ENV || "local";

  // Map environment names to .env file names
  const envMap: Record<string, string> = {
    local: ".env.local",
    dev: ".env.dev",
    prod: ".env.prod",
  };

  const envFile = envMap[env];

  if (!envFile) {
    throw new Error(
      `Invalid ENV value: ${env}. Must be one of: local, dev, prod`,
    );
  }

  // Load the appropriate .env file
  const result = dotenv.config({
    path: path.resolve(process.cwd(), envFile),
    override: true, // Override existing environment variables
  });

  if (result.error) {
    throw new Error(`Failed to load ${envFile}: ${result.error.message}`);
  }

  console.log(`🌍 Loaded environment: ${env} (${envFile})`);
}

/**
 * Get the current environment name
 */
export function getCurrentEnvironment(): string {
  return process.env.ENV || "local";
}

/**
 * Check if we're in a specific environment
 */
export function isEnvironment(env: "local" | "dev" | "prod"): boolean {
  return getCurrentEnvironment() === env;
}
