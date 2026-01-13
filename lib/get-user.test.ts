import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock cookies
const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: mockCookieGet,
  }),
}));

// Mock jsonwebtoken
const mockJwtVerify = vi.fn();
vi.mock("jsonwebtoken", () => ({
  default: {
    verify: mockJwtVerify,
  },
}));

// Mock database
const mockExecuteTakeFirstOrThrow = vi.fn();
const mockWhere = vi.fn(() => ({
  executeTakeFirstOrThrow: mockExecuteTakeFirstOrThrow,
}));
const mockSelectAll = vi.fn(() => ({ where: mockWhere }));
const mockSelectFrom = vi.fn(() => ({ selectAll: mockSelectAll }));

vi.mock("@/lib/database", () => ({
  db: {
    selectFrom: mockSelectFrom,
  },
}));

// Mock IDP client
const mockValidateIDPToken = vi.fn();
vi.mock("@/lib/idp/client", () => ({
  validateIDPToken: mockValidateIDPToken,
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("getUserFromCookies - Dual Token Support", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when no token cookie exists", () => {
    it("should return null", async () => {
      mockCookieGet.mockReturnValue(undefined);

      const { getUserFromCookies } = await import("./get-user");
      const result = await getUserFromCookies();

      expect(result).toBeNull();
    });
  });

  describe("with legacy JWT token", () => {
    it("should return user when legacy token is valid", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        username: "testuser",
        idp_user_id: null,
        is_admin: false,
        deactivated_at: null,
        login_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockCookieGet.mockReturnValue({ value: "legacy-jwt-token" });
      mockJwtVerify.mockReturnValue({ loginId: 1 });
      mockExecuteTakeFirstOrThrow.mockResolvedValue(mockUser);

      const { getUserFromCookies } = await import("./get-user");
      const result = await getUserFromCookies();

      expect(mockJwtVerify).toHaveBeenCalledWith("legacy-jwt-token", expect.any(String));
      expect(result).toEqual(mockUser);
    });

    it("should return null for deactivated user with legacy token", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        username: "testuser",
        idp_user_id: null,
        is_admin: false,
        deactivated_at: new Date(), // Deactivated!
        login_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockCookieGet.mockReturnValue({ value: "legacy-jwt-token" });
      mockJwtVerify.mockReturnValue({ loginId: 1 });
      mockExecuteTakeFirstOrThrow.mockResolvedValue(mockUser);

      const { getUserFromCookies } = await import("./get-user");
      const result = await getUserFromCookies();

      expect(result).toBeNull();
    });

    it("should try IDP token when legacy token verification fails", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        username: "testuser",
        idp_user_id: "idp-uuid-123",
        is_admin: false,
        deactivated_at: null,
        login_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockCookieGet.mockReturnValue({ value: "idp-access-token" });
      mockJwtVerify.mockImplementation(() => {
        throw new Error("Invalid token");
      });
      mockValidateIDPToken.mockResolvedValue({
        sub: "idp-uuid-123",
        username: "testuser",
        email: "test@example.com",
        email_verified: true,
      });
      mockExecuteTakeFirstOrThrow.mockResolvedValue(mockUser);

      const { getUserFromCookies } = await import("./get-user");
      const result = await getUserFromCookies();

      expect(mockValidateIDPToken).toHaveBeenCalledWith("idp-access-token");
      expect(result).toEqual(mockUser);
    });
  });

  describe("with IDP token", () => {
    it("should return user when IDP token is valid", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        username: "testuser",
        idp_user_id: "idp-uuid-123",
        is_admin: false,
        deactivated_at: null,
        login_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockCookieGet.mockReturnValue({ value: "idp-access-token" });
      // Legacy JWT verification fails
      mockJwtVerify.mockImplementation(() => {
        throw new Error("Invalid signature");
      });
      mockValidateIDPToken.mockResolvedValue({
        sub: "idp-uuid-123",
        username: "testuser",
        email: "test@example.com",
        email_verified: true,
      });
      mockExecuteTakeFirstOrThrow.mockResolvedValue(mockUser);

      const { getUserFromCookies } = await import("./get-user");
      const result = await getUserFromCookies();

      expect(result).toEqual(mockUser);
    });

    it("should return null for deactivated user with IDP token", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        username: "testuser",
        idp_user_id: "idp-uuid-123",
        is_admin: false,
        deactivated_at: new Date(), // Deactivated!
        login_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockCookieGet.mockReturnValue({ value: "idp-access-token" });
      mockJwtVerify.mockImplementation(() => {
        throw new Error("Invalid signature");
      });
      mockValidateIDPToken.mockResolvedValue({
        sub: "idp-uuid-123",
        username: "testuser",
        email: "test@example.com",
        email_verified: true,
      });
      mockExecuteTakeFirstOrThrow.mockResolvedValue(mockUser);

      const { getUserFromCookies } = await import("./get-user");
      const result = await getUserFromCookies();

      expect(result).toBeNull();
    });

    it("should return null when IDP token validation fails", async () => {
      mockCookieGet.mockReturnValue({ value: "invalid-token" });
      mockJwtVerify.mockImplementation(() => {
        throw new Error("Invalid signature");
      });
      mockValidateIDPToken.mockRejectedValue(new Error("Token expired"));

      const { getUserFromCookies } = await import("./get-user");
      const result = await getUserFromCookies();

      expect(result).toBeNull();
    });
  });

  describe("getUserFromToken", () => {
    it("should work with legacy token", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        username: "testuser",
        idp_user_id: null,
        is_admin: false,
        deactivated_at: null,
        login_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockJwtVerify.mockReturnValue({ loginId: 1 });
      mockExecuteTakeFirstOrThrow.mockResolvedValue(mockUser);

      const { getUserFromToken } = await import("./get-user");
      const result = await getUserFromToken("legacy-jwt-token");

      expect(result).toEqual(mockUser);
    });

    it("should work with IDP token", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        username: "testuser",
        idp_user_id: "idp-uuid-123",
        is_admin: false,
        deactivated_at: null,
        login_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockJwtVerify.mockImplementation(() => {
        throw new Error("Invalid signature");
      });
      mockValidateIDPToken.mockResolvedValue({
        sub: "idp-uuid-123",
        username: "testuser",
        email: "test@example.com",
        email_verified: true,
      });
      mockExecuteTakeFirstOrThrow.mockResolvedValue(mockUser);

      const { getUserFromToken } = await import("./get-user");
      const result = await getUserFromToken("idp-access-token");

      expect(result).toEqual(mockUser);
    });
  });
});
