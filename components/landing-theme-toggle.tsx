"use client";

import { useTheme } from "next-themes";

/**
 * The stock switch, which lives in the colophon.
 *
 * Both labels are always rendered and CSS picks one from the `.dark` class on
 * the root, so the server markup is already correct for the active theme — no
 * mounted flag, no hydration mismatch, nothing flipping after paint. The
 * inactive label is `display: none` and therefore out of the accessibility
 * tree, so exactly one directional name is ever exposed.
 *
 * The label is phrased as an instruction rather than as a colour: it sits at
 * the end of a line listing the inks, where "White stock" would read as one
 * more of them.
 */
export function LandingThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      className="stock-link"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <span className="ink-light">Print it on black</span>
      <span className="ink-dark">Print it on white</span>
    </button>
  );
}
