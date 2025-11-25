import { describe, it, expect } from "vitest";
import { GET, OPTIONS } from "./route";

describe("GET /api/health", () => {
  it("should return 200 OK with status ok", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("status", "ok");
    expect(data).toHaveProperty("timestamp");
    expect(typeof data.timestamp).toBe("string");
    // Verify timestamp is a valid ISO string
    expect(() => new Date(data.timestamp)).not.toThrow();
  });

  it("should return a valid timestamp", async () => {
    const response = await GET();
    const data = await response.json();

    const timestamp = new Date(data.timestamp);
    expect(timestamp.getTime()).toBeGreaterThan(0);
    expect(timestamp.toISOString()).toBe(data.timestamp);
  });

  it("should include CORS headers in GET response", async () => {
    const response = await GET();

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, OPTIONS",
    );
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe("*");
  });
});

describe("OPTIONS /api/health", () => {
  it("should return 200 OK with CORS headers", async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, OPTIONS",
    );
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe("*");
  });
});
