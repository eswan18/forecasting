/**
 * Probability → color mapping for forecast surfaces.
 *
 * This is a genuine *data encoding* (low = red, high = green), the same graded
 * scale used by the `upcoming-deadlines` heatmap. Per the design language in
 * CLAUDE.md, graded scales are the sanctioned exception to the "semantic colors
 * only" rule because the color *is* information here, not decoration.
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
 * heatmap color set. Buckets at 20% intervals: ≤20 red, ≤40 orange, ≤60
 * yellow, ≤80 lime, else green.
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
      bg: "bg-red-100 dark:bg-red-950",
      text: "text-red-700 dark:text-red-400",
      bar: "bg-red-400",
      border: "border-red-400",
    };
  }
  if (prob <= 0.4) {
    return {
      bg: "bg-orange-100 dark:bg-orange-950",
      text: "text-orange-700 dark:text-orange-400",
      bar: "bg-orange-400",
      border: "border-orange-400",
    };
  }
  if (prob <= 0.6) {
    return {
      bg: "bg-yellow-100 dark:bg-yellow-950",
      text: "text-yellow-700 dark:text-yellow-400",
      bar: "bg-yellow-500",
      border: "border-yellow-500",
    };
  }
  if (prob <= 0.8) {
    return {
      bg: "bg-lime-100 dark:bg-lime-950",
      text: "text-lime-700 dark:text-lime-400",
      bar: "bg-lime-500",
      border: "border-lime-500",
    };
  }
  return {
    bg: "bg-green-100 dark:bg-green-950",
    text: "text-green-700 dark:text-green-400",
    bar: "bg-green-500",
    border: "border-green-500",
  };
}
