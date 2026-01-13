import { describe, it, expect, vi, beforeEach } from "vitest";
import * as dbActions from "@/lib/db_actions";
import * as getUser from "@/lib/get-user";
import * as identityLoginFlag from "@/lib/db_actions/identity-login-flag";

// Mock database actions
vi.mock("@/lib/db_actions", () => ({
  getLoginByUsername: vi.fn(),
}));

// Mock get-user
vi.mock("@/lib/get-user", () => ({
  getUserFromCookies: vi.fn(),
}));

// Mock identity-login-flag module
vi.mock("@/lib/db_actions/identity-login-flag", () => ({
  isIdentityLoginEnabled: vi.fn().mockResolvedValue({ enabled: false, user: null }),
  setUserIdpUserId: vi.fn().mockResolvedValue(true),
}));

// Create a mock IDP admin client
const mockCreateUser = vi.fn();
const MockIDPAdminClient = vi.fn().mockImplementation(() => ({
  createUser: mockCreateUser,
  getToken: vi.fn(),
}));

// Mock IDP client
vi.mock("@/lib/idp/client", () => ({
  IDPAdminClient: MockIDPAdminClient,
  IDPUserExistsError: class IDPUserExistsError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "IDPUserExistsError";
    }
  },
}));

describe("Authentication - Login Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login flow validation", () => {
    it("should validate that getLoginByUsername is called with correct username", async () => {
      // This test verifies the integration point with the database layer
      const { getLoginByUsername } = await import("@/lib/db_actions");

      vi.mocked(getLoginByUsername).mockResolvedValue({
        success: true,
        data: null,
      });

      // Dynamic import to ensure fresh module
      const { login } = await import("./login");

      await login({ username: "testuser", password: "password123" });

      expect(getLoginByUsername).toHaveBeenCalledWith("testuser");
    });

    it("should handle missing user gracefully", async () => {
      const { getLoginByUsername } = await import("@/lib/db_actions");
      vi.mocked(getLoginByUsername).mockResolvedValue({
        success: true,
        data: null,
      });

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
      vi.mocked(dbActions.getLoginByUsername).mockResolvedValue({
        success: true,
        data: null,
      });

      const { loginViaImpersonation } = await import("./login");

      await expect(loginViaImpersonation("nonexistent")).rejects.toThrow(
        "Invalid username.",
      );
    });
  });

  describe("IDP login flow paths", () => {
    it("should use legacy login when IDP is disabled", async () => {
      // Setup: IDP disabled
      vi.mocked(identityLoginFlag.isIdentityLoginEnabled).mockResolvedValue({
        enabled: false,
        user: null,
      });
      vi.mocked(dbActions.getLoginByUsername).mockResolvedValue({
        success: true,
        data: null,
      });

      const { login } = await import("./login");
      const result = await login({ username: "testuser", password: "password123" });

      expect(identityLoginFlag.isIdentityLoginEnabled).toHaveBeenCalledWith("testuser");
      expect(result.success).toBe(false);
      expect(result).not.toHaveProperty("useOAuth");
    });

    it("should redirect to OAuth when IDP enabled and user already migrated", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        username: "testuser",
        idp_user_id: "existing-idp-uuid", // Already migrated
        is_admin: false,
        deactivated_at: null,
        login_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Setup: IDP enabled, user already has idp_user_id
      vi.mocked(identityLoginFlag.isIdentityLoginEnabled).mockResolvedValue({
        enabled: true,
        user: mockUser,
      });

      const { login } = await import("./login");
      const result = await login({ username: "testuser", password: "password123" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.useOAuth).toBe(true);
        expect(result.error).toBe("Please use the new login method.");
      }
    });

    it("should redirect to OAuth for unknown user when IDP is enabled", async () => {
      // Setup: IDP enabled, user not found
      vi.mocked(identityLoginFlag.isIdentityLoginEnabled).mockResolvedValue({
        enabled: true,
        user: null,
      });

      const { login } = await import("./login");
      const result = await login({ username: "unknownuser", password: "password123" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.useOAuth).toBe(true);
        expect(result.error).toBe("Please use the new login method.");
      }
    });

    it("should attempt migration path for legacy user when IDP enabled", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        username: "testuser",
        idp_user_id: null, // Not yet migrated
        is_admin: false,
        deactivated_at: null,
        login_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Setup: IDP enabled, user found but not migrated, but no login found
      // This tests that we go through the migration path (not OAuth redirect)
      vi.mocked(identityLoginFlag.isIdentityLoginEnabled).mockResolvedValue({
        enabled: true,
        user: mockUser,
      });
      vi.mocked(dbActions.getLoginByUsername).mockResolvedValue({
        success: true,
        data: null, // No login record found
      });

      const { login } = await import("./login");
      const result = await login({ username: "testuser", password: "anypassword" });

      // The login should fail due to no login record, but the important thing
      // is that it went through the migration path (checked isIdentityLoginEnabled)
      // and did NOT redirect to OAuth
      expect(identityLoginFlag.isIdentityLoginEnabled).toHaveBeenCalledWith("testuser");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid username or password.");
        // Should NOT have useOAuth since this is migration path, not OAuth redirect
        expect(result.useOAuth).toBeUndefined();
      }
    });

    it("should continue with legacy login if IDP user creation fails", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        username: "testuser",
        idp_user_id: null, // Not yet migrated
        is_admin: false,
        deactivated_at: null,
        login_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Setup: IDP enabled, user found but not migrated
      vi.mocked(identityLoginFlag.isIdentityLoginEnabled).mockResolvedValue({
        enabled: true,
        user: mockUser,
      });
      vi.mocked(dbActions.getLoginByUsername).mockResolvedValue({
        success: true,
        data: null, // No login found
      });

      // IDP user creation would fail, but login should still work
      mockCreateUser.mockRejectedValue(new Error("IDP unavailable"));

      const { login } = await import("./login");
      const result = await login({ username: "testuser", password: "password123" });

      // Should fail due to invalid credentials, not IDP error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid username or password.");
      }
    });
  });
});
