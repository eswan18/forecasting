import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockPublishMessage = vi.fn().mockResolvedValue("msg-123");
const mockTopic = vi.fn().mockReturnValue({ publishMessage: mockPublishMessage });

vi.mock("@google-cloud/pubsub", () => ({
  PubSub: class {
    topic = mockTopic;
  },
}));

describe("publishEvent", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockTopic.mockReturnValue({ publishMessage: mockPublishMessage });
    mockPublishMessage.mockResolvedValue("msg-123");
    vi.stubEnv("GCP_PROJECT_ID", "test-project");
    vi.stubEnv("PUBSUB_TOPIC", "test-topic");
  });

  it("publishes a BaseEvent to the configured topic", async () => {
    const { publishEvent } = await import("./client");

    const event = {
      event_type: "test.notification",
      source: "forecasting",
      timestamp: "2026-04-07T00:00:00Z",
      notify: [{ email: "test@example.com", name: "Test" }],
      data: { message: "hello" },
    };

    const messageId = await publishEvent(event);

    expect(messageId).toBe("msg-123");
    expect(mockTopic).toHaveBeenCalledWith("test-topic");
    expect(mockPublishMessage).toHaveBeenCalledWith({ json: event });
  });

  it("returns the message ID from Pub/Sub", async () => {
    mockPublishMessage.mockResolvedValue("msg-456");
    const { publishEvent } = await import("./client");

    const event = {
      event_type: "some.event",
      source: "forecasting",
      timestamp: "2026-04-07T00:00:00Z",

      data: {},
    };

    const messageId = await publishEvent(event);
    expect(messageId).toBe("msg-456");
  });

  it("throws when GCP_PROJECT_ID is missing", async () => {
    vi.stubEnv("GCP_PROJECT_ID", "");
    const { publishEvent } = await import("./client");

    const event = {
      event_type: "test.notification",
      source: "forecasting",
      timestamp: "2026-04-07T00:00:00Z",

      data: {},
    };

    await expect(publishEvent(event)).rejects.toThrow("GCP_PROJECT_ID");
  });

  it("throws when PUBSUB_TOPIC is missing", async () => {
    vi.stubEnv("PUBSUB_TOPIC", "");
    const { publishEvent } = await import("./client");

    const event = {
      event_type: "test.notification",
      source: "forecasting",
      timestamp: "2026-04-07T00:00:00Z",

      data: {},
    };

    await expect(publishEvent(event)).rejects.toThrow("PUBSUB_TOPIC");
  });
});
