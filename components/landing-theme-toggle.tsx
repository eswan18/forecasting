"use client";

import { useTheme } from "next-themes";

/**
 * Colourway switch for the landing page.
 *
 * Both labels are always rendered and CSS picks one from the `.dark` class on
 * the root, so the server markup is already correct for the active theme — no
 * mounted flag, no hydration mismatch, nothing flipping after paint.
 *
 * The label names the stock you'd switch TO, which makes it its own accessible
 * name: the inactive one is `display: none` and therefore out of the
 * accessibility tree, so exactly one directional name is ever exposed.
 */

/** Which treatment to render. Temporary, while we pick one. */
export type ToggleVariant =
  | "press"
  | "link"
  | "chip"
  | "bar"
  | "colophon";

export function LandingThemeToggle({
  variant = "link",
}: {
  variant?: ToggleVariant;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const flip = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  // The original: a full press button. Reads as a peer of Sign in, which is
  // the problem — it competes with the page's only real action.
  if (variant === "press") {
    return (
      <button type="button" className="btn small swatch" onClick={flip}>
        <span className="ink-light">Black stock</span>
        <span className="ink-dark">White stock</span>
      </button>
    );
  }

  // A chip of the stock you'd get, then the words. Keeps the swatch idea but
  // drops the border and the red plate, so it stops looking like a button.
  if (variant === "chip") {
    return (
      <button type="button" className="stock-chip" onClick={flip}>
        <i className="chip" aria-hidden="true" />
        <span className="ink-light">Black stock</span>
        <span className="ink-dark">White stock</span>
      </button>
    );
  }

  // A press colour bar: both inks shown, the one you're printing on marked.
  if (variant === "bar") {
    return (
      <button type="button" className="stock-bar" onClick={flip}>
        <i className="c-white" aria-hidden="true" />
        <i className="c-black" aria-hidden="true" />
        <span className="sr ink-light">Black stock</span>
        <span className="sr ink-dark">White stock</span>
      </button>
    );
  }

  // In the colophon the label sits at the end of a list of inks, so it has to
  // read as an instruction rather than as one more colour.
  if (variant === "colophon") {
    return (
      <button type="button" className="stock-link" onClick={flip}>
        <span className="ink-light">Print it on black</span>
        <span className="ink-dark">Print it on white</span>
      </button>
    );
  }

  // Default: just the words, set like every other kicker on the sheet.
  return (
    <button type="button" className="stock-link" onClick={flip}>
      <span className="ink-light">Black stock</span>
      <span className="ink-dark">White stock</span>
    </button>
  );
}
