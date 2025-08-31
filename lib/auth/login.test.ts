import { describe, it, expect, vi, beforeEach } from "vitest";
import * as dbActions from "@/lib/db_actions";
import * as getUser from "@/lib/get-user";

// Mock database actions
vi.mock("@/lib/db_actions", () => ({
  getLoginByUsername: vi.fn(),
}));

// Mock get-user
vi.mock("@/lib/get-user", () => ({
  getUserFromCookies: vi.fn(),
}));

describe("Authentication - Login Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login flow validation", () => {
    it("should validate that getLoginByUsername is called with correct username", async () => {
      // This test verifies the integration point with the database layer
      const { getLoginByUsername } = await import("@/lib/db_actions");

      vi.mocked(getLoginByUsername).mockResolvedValue(undefined);

      // Dynamic import to ensure fresh module
      const { login } = await import("./login");

      await login({ username: "testuser", password: "password123" });

      expect(getLoginByUsername).toHaveBeenCalledWith("testuser");
    });

    it("should handle missing user gracefully", async () => {
      const { getLoginByUsername } = await import("@/lib/db_actions");
      vi.mocked(getLoginByUsername).mockResolvedValue(undefined);

      const { login } = await import("./login");
      const result = await login({
        username: "nonexistent",
        password: "password123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid username or password.");
      }
    });
  });

  describe("impersonation flow validation", () => {
    it("should require admin privileges for impersonation", async () => {
      const mockUser = {
        id: 1,
        login_id: 1,
        is_admin: false,
        username: "regularuser",
      };

      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockUser as any);

      const { loginViaImpersonation } = await import("./login");

      await expect(loginViaImpersonation("targetuser")).rejects.toThrow(
        "Not authorized.",
      );
    });

    it("should deny impersonation when not logged in", async () => {
      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(null);

      const { loginViaImpersonation } = await import("./login");

      await expect(loginViaImpersonation("targetuser")).rejects.toThrow(
        "Not authorized.",
      );
    });

    it("should validate target username exists", async () => {
      const mockAdmin = {
        id: 1,
        login_id: 1,
        is_admin: true,
        username: "admin",
      };

      vi.mocked(getUser.getUserFromCookies).mockResolvedValue(mockAdmin as any);
      vi.mocked(dbActions.getLoginByUsername).mockResolvedValue(undefined);

      const { loginViaImpersonation } = await import("./login");

      await expect(loginViaImpersonation("nonexistent")).rejects.toThrow(
        "Invalid username.",
      );
    });
  });
});
