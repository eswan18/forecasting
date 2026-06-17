/**
 * Probability → color mapping for forecast surfaces.
 *
 * This is a genuine *data encoding*, the same graded scale used by the
 * `upcoming-deadlines` heatmap. Per the design language in CLAUDE.md, graded
 * scales are the sanctioned exception to the "semantic colors only" rule
 * because the color *is* information here, not decoration.
 *
 * The ramp is a single-hue *indigo* sequential scale (the brand hue), not a
 * red→green diverging one: probability is a magnitude, not a good/bad axis, so
 * a stoplight ramp both reads as garish and implies a value judgment that
 * doesn't apply. Higher probability = more prominent indigo in *both* themes
 * (light: pale → deep; dark: dim → bright), so the encoding survives a theme
 * switch.
 *
 * Centralized so every probability surface (stats, distribution chart,
 * forecaster list, the competition prop view, upcoming deadlines) reads from a
 * single source instead of re-deriving the same five-stop ramp.
 */

export interface ProbabilityColors {
  /** Tinted background for a heatmap chip. */
  bg: string;
  /** Tinted foreground that reads on top of `bg`. */
  text: string;
  /** Solid fill for a bar / dot. */
  bar: string;
  /** Solid border matching `bar`. */
  border: string;
}

/**
 * Map a probability in [0, 1] (or `null` for "no forecast") to the shared
 * indigo ramp. Buckets at 20% intervals: ≤20 palest, ≤40, ≤60, ≤80, else
 * deepest.
 */
export function getProbabilityColors(prob: number | null): ProbabilityColors {
  if (prob === null) {
    return {
      bg: "bg-muted",
      text: "text-muted-foreground",
      bar: "bg-muted-foreground/30",
      border: "border-muted-foreground/30",
    };
  }
  if (prob <= 0.2) {
    return {
      bg: "bg-indigo-100 dark:bg-indigo-950",
      text: "text-indigo-700 dark:text-indigo-300",
      bar: "bg-indigo-300 dark:bg-indigo-700",
      border: "border-indigo-300 dark:border-indigo-700",
    };
  }
  if (prob <= 0.4) {
    return {
      bg: "bg-indigo-200 dark:bg-indigo-900",
      text: "text-indigo-800 dark:text-indigo-200",
      bar: "bg-indigo-400 dark:bg-indigo-600",
      border: "border-indigo-400 dark:border-indigo-600",
    };
  }
  if (prob <= 0.6) {
    return {
      bg: "bg-indigo-300 dark:bg-indigo-800",
      text: "text-indigo-900 dark:text-indigo-100",
      bar: "bg-indigo-500 dark:bg-indigo-500",
      border: "border-indigo-500 dark:border-indigo-500",
    };
  }
  if (prob <= 0.8) {
    return {
      bg: "bg-indigo-400 dark:bg-indigo-700",
      text: "text-indigo-950 dark:text-indigo-50",
      bar: "bg-indigo-600 dark:bg-indigo-400",
      border: "border-indigo-600 dark:border-indigo-400",
    };
  }
  return {
    bg: "bg-indigo-600 dark:bg-indigo-500",
    text: "text-white dark:text-indigo-50",
    bar: "bg-indigo-700 dark:bg-indigo-300",
    border: "border-indigo-700 dark:border-indigo-300",
  };
}
