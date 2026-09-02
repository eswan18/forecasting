import type { VForecast } from "@/types/db_types";
/** A v_forecasts row for a binary prop, with the scalar forecast narrowed to non-null. */
export type BinaryForecast = VForecast & { forecast: number };
/**
 * Generic in the row type so callers that carry extra fields (e.g. the option
 * summaries attached by `getRecentlyResolvedForecasts`) keep them after
 * `filter(isBinaryForecast)`.
 */
export const isBinaryForecast = <T extends VForecast>(
  f: T,
): f is T & { forecast: number } =>
  f.prop_kind === "binary" && f.forecast !== null;
