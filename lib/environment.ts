import * as dotenv from "dotenv";
import * as path from "path";

/**
 * Environment management utility that loads the appropriate .env file
 * based on the ENV environment variable.
 *
 * Usage:
 * - ENV=local npm run dev (loads .env.local)
 * - ENV=dev npm run dev (loads .env.dev)
 * - ENV=staging npm run dev (loads .env.staging)
 * - ENV=prod npm run dev (loads .env.prod)
 *
 * If ENV is not set, defaults to 'local'
 */

/**
 * Every environment the app can be pointed at, and the file each reads.
 *
 * Declared rather than inlined so the check and the error message cannot drift
 * apart: the message lists these keys, so an environment added here is offered
 * to anyone who mistypes one.
 */
const ENV_FILES: Record<string, string> = {
  local: ".env.local",
  dev: ".env.dev",
  staging: ".env.staging",
  prod: ".env.prod",
};

/**
 * The dotenv file an environment name reads, or a throw naming the ones that
 * would have worked.
 */
export function envFileFor(env: string): string {
  const envFile = ENV_FILES[env];

  if (!envFile) {
    throw new Error(
      `Invalid ENV value: ${env}. Must be one of: ${Object.keys(ENV_FILES).join(", ")}`,
    );
  }

  return envFile;
}

export function loadEnvironment(): void {
  const env = process.env.ENV || "local";
  const envFile = envFileFor(env);

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
