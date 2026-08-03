/**
 * Builds and runs the compiled migration runner the way the image does.
 *
 * Both the unit and the container test for `lib/migrations/runner.ts` exercise
 * the real artifact — a bundle produced by `scripts/build-migration-runner.ts`
 * and executed as `node <file>.js` in its own process — rather than calling the
 * runner's functions in-process. The artifact is what an initContainer runs, so
 * it is what the tests should be about: its exit code, its output, and the fact
 * that it needs nothing from `node_modules`.
 */

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { buildMigrationRunner } from "@/scripts/build-migration-runner";

export interface RunnerArtifact {
  /** Directory holding index.js and its package.json. */
  outDir: string;
  /** The script an initContainer would run. */
  outFile: string;
  /** Cleans up the temporary directory. */
  cleanup: () => Promise<void>;
}

export async function buildRunnerArtifact(): Promise<RunnerArtifact> {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "fc-migrate-"));
  const { outFile } = await buildMigrationRunner(outDir);

  return {
    outDir,
    outFile,
    cleanup: () => fs.rm(outDir, { recursive: true, force: true }),
  };
}

export interface RunResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

/**
 * Runs the artifact in a fresh process with a deliberately minimal environment,
 * so a stray `DATABASE_URL` in the test runner cannot mask a failure.
 */
export function runArtifact(
  outFile: string,
  env: Record<string, string> = {},
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [outFile], {
      env: {
        ...env,
        PATH: process.env.PATH ?? "",
        NODE_ENV: process.env.NODE_ENV,
      },
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}
