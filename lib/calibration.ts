import type { VForecast } from "@/types/db_types";

/**
 * Calibration math for the standalone calibration page.
 *
 * A forecaster is *well calibrated* when, across the forecasts where they said
 * "X%", the event actually happened about X% of the time. We measure that by
 * bucketing resolved forecasts by their predicted probability and, for each
 * bucket, comparing the mean predicted probability to the observed frequency of
 * YES outcomes. Plotted, a perfectly calibrated forecaster sits on the y = x
 * diagonal. (See FiveThirtyEight, "When We Say 70 Percent, It Really Means 70
 * Percent".)
 *
 * Pure and dependency-free so it can be unit tested and run on either side of
 * the server/client boundary.
 */

/** A resolved forecast reduced to the two numbers calibration needs. */
export interface ResolvedForecast {
  /** Predicted probability of YES, in [0, 1]. */
  forecast: number;
  /** Whether the prop actually resolved YES. */
  resolvedYes: boolean;
}

export interface CalibrationBucket {
  /** Bin lower bound (inclusive), in [0, 1]. */
  binStart: number;
  /** Bin upper bound (exclusive, except the final bin which is inclusive). */
  binEnd: number;
  /** Number of resolved forecasts that fell in this bin. */
  count: number;
  /** Mean predicted probability of the forecasts in this bin (0–1). */
  meanPredicted: number;
  /** Fraction of those forecasts that resolved YES (0–1). */
  observedFrequency: number;
}

export interface CalibrationResult {
  /** One entry per non-empty bin, ordered low → high predicted probability. */
  buckets: CalibrationBucket[];
  /** Total resolved forecasts considered. */
  total: number;
  /**
   * Mean Brier score across the resolved forecasts (0–1, lower is better), or
   * `null` when there are no forecasts.
   */
  brierScore: number | null;
}

/** Keep only resolved forecasts and reduce them to the calibration shape. */
export function toResolvedForecasts(forecasts: VForecast[]): ResolvedForecast[] {
  return forecasts
    .filter((f) => f.resolution !== null)
    .map((f) => ({ forecast: f.forecast, resolvedYes: f.resolution === true }));
}

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

/**
 * Bucket resolved forecasts into `binCount` equal-width bins and compute the
 * mean predicted probability, observed YES frequency, and overall Brier score.
 */
export function computeCalibration(
  forecasts: ResolvedForecast[],
  binCount = 10,
): CalibrationResult {
  const total = forecasts.length;
  if (total === 0) {
    return { buckets: [], total: 0, brierScore: null };
  }

  const bins = Array.from({ length: binCount }, () => ({
    count: 0,
    predictedSum: 0,
    yesCount: 0,
  }));
  let brierSum = 0;

  for (const f of forecasts) {
    const p = clamp01(f.forecast);
    const outcome = f.resolvedYes ? 1 : 0;
    brierSum += (p - outcome) ** 2;
    // The top edge (p === 1) belongs to the last bin.
    const index = Math.min(Math.floor(p * binCount), binCount - 1);
    bins[index].count += 1;
    bins[index].predictedSum += p;
    bins[index].yesCount += outcome;
  }

  const buckets: CalibrationBucket[] = bins
    .map((bin, i) => ({
      binStart: i / binCount,
      binEnd: (i + 1) / binCount,
      count: bin.count,
      meanPredicted: bin.count > 0 ? bin.predictedSum / bin.count : 0,
      observedFrequency: bin.count > 0 ? bin.yesCount / bin.count : 0,
    }))
    .filter((bucket) => bucket.count > 0);

  return { buckets, total, brierScore: brierSum / total };
}
