/**
 * Parses a sample rate string from environment variables into a valid number.
 * Ensures the result is a finite number between 0 and 1.
 *
 * @param value - The string value to parse (typically from process.env)
 * @param fallback - The fallback value if parsing fails or value is invalid
 * @returns A number between 0 and 1, or the fallback value
 */
export function parseSampleRate(
  value: string | undefined,
  fallback: number,
): number {
  const n = value === undefined ? NaN : parseFloat(value);
  if (!Number.isFinite(n) || n < 0 || n > 1) return fallback;
  return n;
}
