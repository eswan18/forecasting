import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/database";
import { success } from "@/lib/server-action-result";

// Mock the database module
vi.mock("@/lib/database", () => ({
  db: {
    transaction: vi.fn(),
  },
}));

// Note: withRLS uses Kysely's sql template tag which requires a real executor
// to compile. Full integration testing is done via the server action tests.
// Here we just verify the transaction setup behavior.

describe("withRLS", () => {
  const mockExecute = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(db.transaction).mockReturnValue({
      execute: mockExecute,
    } as any);
  });

  it("should start a transaction", async () => {
    const { withRLS } = await import("./db-helpers");

    mockExecute.mockRejectedValue(new Error("Expected test error"));

    try {
      await withRLS(123, async () => "result");
    } catch {
      // Expected - sql template compilation fails in test environment
    }

    expect(db.transaction).toHaveBeenCalled();
  });

  it("should propagate transaction-level errors", async () => {
    const { withRLS } = await import("./db-helpers");

    mockExecute.mockRejectedValue(new Error("Connection refused"));

    await expect(withRLS(123, async () => "result")).rejects.toThrow(
      "Connection refused",
    );
  });
});

describe("withRLSAction", () => {
  const mockExecute = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(db.transaction).mockReturnValue({
      execute: mockExecute,
    } as any);
  });

  it("should start a transaction", async () => {
    const { withRLSAction } = await import("./db-helpers");

    mockExecute.mockRejectedValue(new Error("Expected test error"));

    try {
      await withRLSAction(123, async () => success("result"));
    } catch {
      // Expected - sql template compilation fails in test environment
    }

    expect(db.transaction).toHaveBeenCalled();
  });

  it("should propagate transaction-level errors", async () => {
    const { withRLSAction } = await import("./db-helpers");

    mockExecute.mockRejectedValue(new Error("Connection refused"));

    await expect(
      withRLSAction(123, async () => success("result")),
    ).rejects.toThrow("Connection refused");
  });
});
