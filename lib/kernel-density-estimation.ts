/**
 * Kernel Density Estimation (KDE) utilities for forecast visualization.
 *
 * These functions implement Gaussian kernel density estimation to visualize
 * the distribution of forecast values as a smooth probability density curve.
 */

export interface DensityPoint {
  probability: number;
  density: number;
  percentage: string;
}

/**
 * Gaussian kernel function for KDE.
 * Returns the probability density of the standard normal distribution at x.
 */
export function gaussianKernel(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Creates a kernel density estimator function.
 *
 * @param kernel - The kernel function to use (e.g., gaussianKernel)
 * @param bandwidth - The bandwidth (smoothing parameter)
 * @param data - The array of data points
 * @returns A function that estimates density at any point x
 */
export function kernelDensityEstimator(
  kernel: (x: number) => number,
  bandwidth: number,
  data: number[]
) {
  return function (x: number): number {
    return (
      data.reduce((sum, xi) => sum + kernel((x - xi) / bandwidth), 0) /
      (data.length * bandwidth)
    );
  };
}

/**
 * Computes KDE values across the [0, 1] range.
 *
 * @param data - Array of data values (expected to be in [0, 1] range)
 * @param bandwidth - The bandwidth for smoothing
 * @param numPoints - Number of points to compute (default 100)
 * @returns Array of density points with probability, density, and percentage
 */
export function computeKDE(
  data: number[],
  bandwidth: number,
  numPoints = 100
): DensityPoint[] {
  if (data.length === 0) return [];

  // Always use full 0-1 range for consistent visualization
  const step = 1 / (numPoints - 1);
  const kde = kernelDensityEstimator(gaussianKernel, bandwidth, data);

  const density: DensityPoint[] = [];
  for (let i = 0; i < numPoints; i++) {
    const x = i * step;
    density.push({
      probability: x,
      density: kde(x),
      percentage: (x * 100).toFixed(1),
    });
  }

  // Ensure we have exact data points at our desired tick locations
  const tickValues = [0, 0.25, 0.5, 0.75, 1];
  tickValues.forEach((tick) => {
    if (!density.some((d) => Math.abs(d.probability - tick) < 0.001)) {
      density.push({
        probability: tick,
        density: kde(tick),
        percentage: (tick * 100).toFixed(1),
      });
    }
  });

  // Sort by probability to maintain order
  return density.sort((a, b) => a.probability - b.probability);
}

/**
 * Calculates optimal bandwidth using Silverman's rule of thumb.
 *
 * @param data - Array of data values
 * @returns Optimal bandwidth for the given data
 */
export function calculateBandwidth(data: number[]): number {
  if (data.length <= 1) return 0.1;

  const n = data.length;
  const mean = data.reduce((sum, x) => sum + x, 0) / n;

  // Use sample variance (n-1) instead of population variance (n)
  const variance =
    data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  // Handle edge case where all values are identical (stdDev = 0)
  if (stdDev === 0) {
    return 0.05; // Use a small fixed bandwidth for identical values
  }

  // Silverman's rule of thumb
  const bandwidth = 1.06 * stdDev * Math.pow(n, -0.2);

  // Ensure bandwidth is not too small or too large for probability data
  return Math.max(0.01, Math.min(0.2, bandwidth));
}

/**
 * Creates a Gaussian-like peak for single data point visualization.
 *
 * @param value - The single data point value
 * @param numPoints - Number of points to generate (default 100)
 * @returns Array of density points representing a narrow peak at the value
 */
export function createSinglePointPeak(
  value: number,
  numPoints = 100
): DensityPoint[] {
  const step = 1 / (numPoints - 1);
  const data: DensityPoint[] = [];

  for (let i = 0; i < numPoints; i++) {
    const x = i * step;
    const distance = Math.abs(x - value);
    const density = Math.exp(-Math.pow(distance / 0.05, 2)); // Gaussian-like peak
    data.push({
      probability: x,
      density: density,
      percentage: (x * 100).toFixed(1),
    });
  }

  // Ensure we have exact data points at our desired tick locations
  const tickValues = [0, 0.25, 0.5, 0.75, 1];
  tickValues.forEach((tick) => {
    if (!data.some((d) => Math.abs(d.probability - tick) < 0.001)) {
      const distance = Math.abs(tick - value);
      const density = Math.exp(-Math.pow(distance / 0.05, 2));
      data.push({
        probability: tick,
        density: density,
        percentage: (tick * 100).toFixed(1),
      });
    }
  });

  // Sort by probability to maintain order
  return data.sort((a, b) => a.probability - b.probability);
}
