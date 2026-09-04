import { describe, it, expect, vi, beforeEach } from "vitest";
import * as getUser from "@/lib/get-user";
import * as pubsub from "@/lib/pubsub/client";

vi.mock("@/lib/get-user", () => ({
  getUserFromCookies: vi.fn(),
}));

vi.mock("@/lib/pubsub/client", () => ({
  publishEvent: vi.fn().mockResolvedValue("msg-mock"),
}));

const executeTakeFirst = vi.fn();
vi.mock("@/lib/database", () => ({
  db: {
    selectFrom: () => ({
      select: () => ({
        where: () => ({ executeTakeFirst: () => executeTakeFirst() }),
      }),
    }),
  },
}));

import { sendManualEmail } from "./admin-email";

const admin = { id: 2, name: "Admin", email: "admin@example.com", is_admin: true };
const nonAdmin = { id: 1, name: "User", email: "u@example.com", is_admin: false };
const recipient = { name: "Alice", email: "alice@example.com" };

const valid = { userId: 9, subject: "About your account", body: "Please read." };

describe("sendManualEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeTakeFirst.mockResolvedValue(recipient);
    vi.mocked(pubsub.publishEvent).mockResolvedValue("msg-mock");
  });

  it("publishes an admin.manual_email event for the recipient", async () => {
    vi.mocked(getUser.getUserFromCookies).mockResolvedValue(admin as never);

    const result = await sendManualEmail(valid);

    expect(result.success).toBe(true);
    expect(pubsub.publishEvent).toHaveBeenCalledOnce();
    expect(pubsub.publishEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: "admin.manual_email",
        // The source is what comms keys the haruspex From address on.
        source: "forecasting",
        notify: [{ email: "alice@example.com", name: "Alice" }],
        data: { subject: "About your account", body: "Please read." },
      }),
    );
  });

  it("refuses when signed out", async () => {
    vi.mocked(getUser.getUserFromCookies).mockResolvedValue(null as never);

    const result = await sendManualEmail(valid);

    expect(result.success).toBe(false);
    expect(pubsub.publishEvent).not.toHaveBeenCalled();
  });

  it("refuses a non-admin, since the layout gate does not cover server actions", async () => {
    vi.mocked(getUser.getUserFromCookies).mockResolvedValue(nonAdmin as never);

    const result = await sendManualEmail(valid);

    expect(result.success).toBe(false);
    expect(pubsub.publishEvent).not.toHaveBeenCalled();
  });

  it("refuses an empty or whitespace-only subject or body", async () => {
    vi.mocked(getUser.getUserFromCookies).mockResolvedValue(admin as never);

    for (const bad of [
      { ...valid, subject: "   " },
      { ...valid, body: "\n\n" },
    ]) {
      const result = await sendManualEmail(bad);
      expect(result.success).toBe(false);
    }
    expect(pubsub.publishEvent).not.toHaveBeenCalled();
  });

  it("trims before publishing, so comms never sees padded content", async () => {
    vi.mocked(getUser.getUserFromCookies).mockResolvedValue(admin as never);

    await sendManualEmail({ userId: 9, subject: "  Hi  ", body: "  There  " });

    expect(pubsub.publishEvent).toHaveBeenCalledWith(
      expect.objectContaining({ data: { subject: "Hi", body: "There" } }),
    );
  });

  it("refuses an over-long subject or body", async () => {
    vi.mocked(getUser.getUserFromCookies).mockResolvedValue(admin as never);

    expect(
      (await sendManualEmail({ ...valid, subject: "x".repeat(201) })).success,
    ).toBe(false);
    expect(
      (await sendManualEmail({ ...valid, body: "x".repeat(10_001) })).success,
    ).toBe(false);
    expect(pubsub.publishEvent).not.toHaveBeenCalled();
  });

  it("refuses when the user does not exist", async () => {
    vi.mocked(getUser.getUserFromCookies).mockResolvedValue(admin as never);
    executeTakeFirst.mockResolvedValue(undefined);

    const result = await sendManualEmail(valid);

    expect(result.success).toBe(false);
    expect(pubsub.publishEvent).not.toHaveBeenCalled();
  });

  it("refuses when the user has a blank email rather than addressing nobody", async () => {
    vi.mocked(getUser.getUserFromCookies).mockResolvedValue(admin as never);
    executeTakeFirst.mockResolvedValue({ name: "Alice", email: "  " });

    const result = await sendManualEmail(valid);

    expect(result.success).toBe(false);
    expect(pubsub.publishEvent).not.toHaveBeenCalled();
  });

  it("reports failure when publishing throws, rather than claiming success", async () => {
    vi.mocked(getUser.getUserFromCookies).mockResolvedValue(admin as never);
    vi.mocked(pubsub.publishEvent).mockRejectedValue(new Error("no topic"));

    const result = await sendManualEmail(valid);

    expect(result.success).toBe(false);
  });

  it("sets a correlation id, which is what joins this log to comms' log", async () => {
    vi.mocked(getUser.getUserFromCookies).mockResolvedValue(admin as never);

    await sendManualEmail(valid);

    const published = vi.mocked(pubsub.publishEvent).mock.calls[0]![0];
    expect(published.correlation_id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
