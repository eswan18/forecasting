import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only to allow importing in tests
vi.mock("server-only", () => ({}));

// Mock jose to avoid issues with crypto in tests
vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn(),
  jwtVerify: vi.fn(),
  base64url: { encode: vi.fn() },
}));

describe("IDP Client", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("buildNameFromUserInfo", () => {
    it("should return full name when both given_name and family_name are provided", async () => {
      const { buildNameFromUserInfo } = await import("./client");

      const result = buildNameFromUserInfo({
        sub: "user-123",
        given_name: "John",
        family_name: "Doe",
      });

      expect(result).toBe("John Doe");
    });

    it("should return given_name only when family_name is missing", async () => {
      const { buildNameFromUserInfo } = await import("./client");

      const result = buildNameFromUserInfo({
        sub: "user-123",
        given_name: "John",
      });

      expect(result).toBe("John");
    });

    it("should return family_name only when given_name is missing", async () => {
      const { buildNameFromUserInfo } = await import("./client");

      const result = buildNameFromUserInfo({
        sub: "user-123",
        family_name: "Doe",
      });

      expect(result).toBe("Doe");
    });

    it("should return null when neither given_name nor family_name are provided", async () => {
      const { buildNameFromUserInfo } = await import("./client");

      const result = buildNameFromUserInfo({
        sub: "user-123",
      });

      expect(result).toBeNull();
    });

    it("should return null when given_name and family_name are empty strings", async () => {
      const { buildNameFromUserInfo } = await import("./client");

      const result = buildNameFromUserInfo({
        sub: "user-123",
        given_name: "",
        family_name: "",
      });

      expect(result).toBeNull();
    });

    it("should handle undefined values correctly", async () => {
      const { buildNameFromUserInfo } = await import("./client");

      const result = buildNameFromUserInfo({
        sub: "user-123",
        given_name: undefined,
        family_name: undefined,
      });

      expect(result).toBeNull();
    });
  });
});
