import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Shared keyboard focus indicator for custom interactive elements (plain
 * `<button>`s, clickable cards/links) that don't go through the `Button`
 * primitive. Token-based and `focus-visible`-only, so it shows for keyboard
 * users without ringing on mouse clicks.
 */
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
