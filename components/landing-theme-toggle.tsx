"use client";

import { useTheme } from "next-themes";

/**
 * Colourway switch for the landing page.
 *
 * Both labels are always rendered and CSS picks one from the `.dark` class on
 * the root, so the server markup is already correct for the active theme — no
 * mounted flag, no hydration mismatch, nothing flipping after paint.
 *
 * The label names the stock you'd be switching TO, which makes it its own
 * accessible name: the inactive one is `display: none` and therefore out of the
 * accessibility tree, so exactly one directional name is ever exposed. On
 * narrow screens the text is clipped rather than hidden, so it stays available
 * to a screen reader after it stops being visible.
 */
export function LandingThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      className="btn small swatch"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <span className="ink-light">Black stock</span>
      <span className="ink-dark">White stock</span>
    </button>
  );
}
