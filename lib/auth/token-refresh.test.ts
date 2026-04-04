import { describe, it, expect } from "vitest";
import { decodeJwtExp, isTokenNearExpiry } from "./token-refresh";

function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.fake-signature`;
}

describe("decodeJwtExp", () => {
  it("returns null for an empty string", () => {
    expect(decodeJwtExp("")).toBeNull();
  });

  it("returns null for a token missing dot separators", () => {
    expect(decodeJwtExp("notajwt")).toBeNull();
  });

  it("returns null when the payload is not valid base64 JSON", () => {
    expect(decodeJwtExp("abc.###notbase64###.xyz")).toBeNull();
  });

  it("returns null when the payload has no exp claim", () => {
    expect(decodeJwtExp(makeJwt({ sub: "u1" }))).toBeNull();
  });

  it("returns the exp claim (seconds) from a valid payload", () => {
    expect(decodeJwtExp(makeJwt({ sub: "u1", exp: 1700000000 }))).toBe(
      1700000000,
    );
  });
});

describe("isTokenNearExpiry", () => {
  it("returns true when the token is malformed", () => {
    expect(isTokenNearExpiry("notajwt", Date.now(), 60)).toBe(true);
  });

  it("returns true when the token has no exp claim", () => {
    expect(isTokenNearExpiry(makeJwt({ sub: "u1" }), Date.now(), 60)).toBe(
      true,
    );
  });

  it("returns false when exp is comfortably beyond now + buffer", () => {
    const nowMs = 1_700_000_000_000;
    const expSec = 1_700_000_000 + 3600; // 1 hour in the future
    expect(isTokenNearExpiry(makeJwt({ exp: expSec }), nowMs, 60)).toBe(false);
  });

  it("returns true when exp is within the buffer window", () => {
    const nowMs = 1_700_000_000_000;
    const expSec = 1_700_000_000 + 30; // 30s in future, buffer is 60
    expect(isTokenNearExpiry(makeJwt({ exp: expSec }), nowMs, 60)).toBe(true);
  });

  it("returns true when exp is already in the past", () => {
    const nowMs = 1_700_000_000_000;
    const expSec = 1_700_000_000 - 100;
    expect(isTokenNearExpiry(makeJwt({ exp: expSec }), nowMs, 60)).toBe(true);
  });
});
