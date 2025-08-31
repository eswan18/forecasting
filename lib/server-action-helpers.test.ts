import { describe, it, expect, vi, beforeEach } from "vitest";
import { redirect } from "next/navigation";
import {
  handleServerActionResult,
  handleServerActionResultWithFallback,
} from "./server-action-helpers";
import { ERROR_CODES, type ServerActionResult } from "./server-action-result";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

describe("Server Action Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("handleServerActionResult", () => {
    it("should return data on success", () => {
      const result: ServerActionResult<{ id: number; name: string }> = {
        success: true,
        data: { id: 1, name: "Test" },
      };

      const data = handleServerActionResult(result);

      expect(data).toEqual({ id: 1, name: "Test" });
      expect(redirect).not.toHaveBeenCalled();
    });

    it("should redirect to login on unauthorized error", () => {
      const result: ServerActionResult<any> = {
        success: false,
        error: "Unauthorized access",
        code: ERROR_CODES.UNAUTHORIZED,
      };

      expect(() => handleServerActionResult(result)).toThrow("NEXT_REDIRECT");
      expect(redirect).toHaveBeenCalledWith("/login");
    });

    it("should redirect to custom path on unauthorized error when specified", () => {
      const result: ServerActionResult<any> = {
        success: false,
        error: "Unauthorized access",
        code: ERROR_CODES.UNAUTHORIZED,
      };

      expect(() =>
        handleServerActionResult(result, {
          unauthorizedRedirect: "/custom-login",
        }),
      ).toThrow("NEXT_REDIRECT");
      expect(redirect).toHaveBeenCalledWith("/custom-login");
    });

    it("should throw error on non-unauthorized errors by default", () => {
      const result: ServerActionResult<any> = {
        success: false,
        error: "Database error occurred",
        code: ERROR_CODES.DATABASE_ERROR,
      };

      expect(() => handleServerActionResult(result)).toThrow(
        "Database error occurred",
      );
      expect(redirect).not.toHaveBeenCalled();
    });

    it("should not throw error when throwOnError is false", () => {
      const result: ServerActionResult<any> = {
        success: false,
        error: "Some error",
      };

      const data = handleServerActionResult(result, { throwOnError: false });

      expect(data).toBeUndefined();
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe("handleServerActionResultWithFallback", () => {
    it("should return data on success", () => {
      const result: ServerActionResult<string[]> = {
        success: true,
        data: ["item1", "item2"],
      };

      const data = handleServerActionResultWithFallback(result, []);

      expect(data).toEqual(["item1", "item2"]);
      expect(redirect).not.toHaveBeenCalled();
    });

    it("should redirect on unauthorized error", () => {
      const result: ServerActionResult<string[]> = {
        success: false,
        error: "Unauthorized",
        code: ERROR_CODES.UNAUTHORIZED,
      };

      expect(() => handleServerActionResultWithFallback(result, [])).toThrow(
        "NEXT_REDIRECT",
      );
      expect(redirect).toHaveBeenCalledWith("/login");
    });

    it("should return fallback value on non-unauthorized error", () => {
      const result: ServerActionResult<string[]> = {
        success: false,
        error: "Failed to fetch data",
      };

      const fallback = ["fallback1", "fallback2"];
      const data = handleServerActionResultWithFallback(result, fallback);

      expect(data).toBe(fallback);
      expect(console.error).toHaveBeenCalledWith(
        "Server action error:",
        "Failed to fetch data",
      );
      expect(redirect).not.toHaveBeenCalled();
    });

    it("should use custom unauthorized redirect path", () => {
      const result: ServerActionResult<any> = {
        success: false,
        error: "Not authorized",
        code: ERROR_CODES.UNAUTHORIZED,
      };

      expect(() =>
        handleServerActionResultWithFallback(result, null, {
          unauthorizedRedirect: "/auth/signin",
        }),
      ).toThrow("NEXT_REDIRECT");

      expect(redirect).toHaveBeenCalledWith("/auth/signin");
    });

    it("should handle complex fallback objects", () => {
      interface UserData {
        id: number;
        name: string;
        roles: string[];
      }

      const result: ServerActionResult<UserData> = {
        success: false,
        error: "User not found",
        code: ERROR_CODES.NOT_FOUND,
      };

      const fallback: UserData = {
        id: 0,
        name: "Guest",
        roles: ["visitor"],
      };

      const data = handleServerActionResultWithFallback(result, fallback);

      expect(data).toEqual(fallback);
      expect(console.error).toHaveBeenCalledWith(
        "Server action error:",
        "User not found",
      );
    });
  });
});
