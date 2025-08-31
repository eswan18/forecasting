import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("should merge class names correctly", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toBe("text-red-500 bg-blue-500");
  });

  it("should handle conditional classes with clsx", () => {
    const isActive = true;
    const isDisabled = false;

    const result = cn(
      "base-class",
      isActive && "active-class",
      isDisabled && "disabled-class",
    );

    expect(result).toBe("base-class active-class");
  });

  it("should merge tailwind classes correctly with tailwind-merge", () => {
    // tailwind-merge should resolve conflicts by keeping the last one
    const result = cn("px-2 py-1", "px-3");
    expect(result).toBe("py-1 px-3");
  });

  it("should handle arrays of classes", () => {
    const result = cn(["text-sm", "font-bold"], "text-lg");
    // tailwind-merge should resolve the text size conflict
    expect(result).toBe("font-bold text-lg");
  });

  it("should handle objects with conditional classes", () => {
    const result = cn({
      "text-red-500": true,
      "text-blue-500": false,
      "font-bold": true,
    });

    expect(result).toBe("text-red-500 font-bold");
  });

  it("should handle undefined and null values", () => {
    const result = cn("base", undefined, null, "end");
    expect(result).toBe("base end");
  });

  it("should handle empty strings", () => {
    const result = cn("", "text-sm", "");
    expect(result).toBe("text-sm");
  });

  it("should return empty string when no valid classes provided", () => {
    const result = cn(undefined, null, false, "");
    expect(result).toBe("");
  });

  it("should handle complex tailwind class merging", () => {
    const result = cn(
      "rounded-md bg-blue-500 px-4 py-2",
      "bg-red-500 rounded-lg px-6",
    );
    // Should keep the last of each conflicting class
    expect(result).toBe("py-2 bg-red-500 rounded-lg px-6");
  });

  it("should preserve non-conflicting tailwind modifiers", () => {
    const result = cn(
      "hover:bg-blue-500 focus:outline-none",
      "hover:bg-red-500 active:scale-95",
    );
    // tailwind-merge preserves the order but deduplicates conflicting classes
    expect(result).toBe("focus:outline-none hover:bg-red-500 active:scale-95");
  });
});
