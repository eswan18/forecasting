import type { VForecast } from "@/types/db_types";
/** A v_forecasts row for a binary prop, with the scalar forecast narrowed to non-null. */
export type BinaryForecast = VForecast & { forecast: number };
export const isBinaryForecast = (f: VForecast): f is BinaryForecast =>
  f.prop_kind === "binary" && f.forecast !== null;
