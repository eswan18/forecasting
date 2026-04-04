/**
 * Decodes the `exp` claim from a JWT payload without verifying the signature.
 *
 * Middleware uses this to decide whether to attempt a refresh — it does NOT
 * trust the token. Full verification happens downstream via jose in
 * lib/get-user.ts.
 *
 * Returns the exp claim (seconds since epoch) or null if the token is
 * malformed or has no exp claim.
 */
export function decodeJwtExp(token: string): number | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    );
    if (typeof payload.exp !== "number") return null;
    return payload.exp;
  } catch {
    return null;
  }
}

/**
 * Returns true if the token should be refreshed: either it can't be decoded,
 * has no exp claim, or expires within `bufferSec` of `nowMs`.
 */
export function isTokenNearExpiry(
  token: string,
  nowMs: number,
  bufferSec: number,
): boolean {
  const expSec = decodeJwtExp(token);
  if (expSec === null) return true;
  return expSec * 1000 < nowMs + bufferSec * 1000;
}
