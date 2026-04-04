import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

const { mockRefreshAccessToken } = vi.hoisted(() => ({
  mockRefreshAccessToken: vi.fn(),
}));
vi.mock("@/lib/idp/client", () => ({
  refreshAccessToken: mockRefreshAccessToken,
}));


const FRESH_JWT = (() => {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify({ exp: 4_000_000_000 })).toString(
    "base64url",
  );
  return `${header}.${body}.sig`;
})();

const EXPIRED_JWT = (() => {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify({ exp: 1_000_000_000 })).toString(
    "base64url",
  );
  return `${header}.${body}.sig`;
})();

function makeRequest(path: string, cookieHeader = ""): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
}

afterEach(() => mockRefreshAccessToken.mockReset());

describe("proxy: public routes", () => {

  it("passes /login through without touching the token", async () => {
    const { proxy } = await import("./proxy");
  const res = await proxy(makeRequest("/login"));
    expect(res.status).toBe(200);
    expect(mockRefreshAccessToken).not.toHaveBeenCalled();
  });

  it("passes /oauth/callback through", async () => {
    const { proxy } = await import("./proxy");
  const res = await proxy(makeRequest("/oauth/callback"));
    expect(res.status).toBe(200);
    expect(mockRefreshAccessToken).not.toHaveBeenCalled();
  });
});

describe("proxy: protected routes with no token", () => {

  it("redirects to /login when no token cookie exists", async () => {
    const { proxy } = await import("./proxy");
  const res = await proxy(makeRequest("/forecasts"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
    expect(mockRefreshAccessToken).not.toHaveBeenCalled();
  });

  it("preserves the original path in the redirect query string", async () => {
    const { proxy } = await import("./proxy");
  const res = await proxy(makeRequest("/forecasts"));
    const url = new URL(res.headers.get("location") ?? "");
    const redirect = url.searchParams.get("redirect") ?? "";
    // proxy.ts double-encodes (encodeURIComponent + searchParams.set).
    expect(decodeURIComponent(redirect)).toBe("/forecasts");
  });
});

describe("proxy: protected routes with fresh token", () => {

  it("passes the request through without calling refresh", async () => {
    const { proxy } = await import("./proxy");
  const res = await proxy(makeRequest("/forecasts", `token=${FRESH_JWT}`));
    expect(res.status).toBe(200);
    expect(mockRefreshAccessToken).not.toHaveBeenCalled();
    expect(res.cookies.get("token")).toBeUndefined();
  });
});

describe("proxy: protected routes with expired token", () => {

  it("redirects to /login when no refresh_token cookie exists", async () => {
    const { proxy } = await import("./proxy");
  const res = await proxy(makeRequest("/forecasts", `token=${EXPIRED_JWT}`));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
    expect(mockRefreshAccessToken).not.toHaveBeenCalled();
  });

  it("sets a new token cookie when refresh succeeds", async () => {
    mockRefreshAccessToken.mockResolvedValue({
      access_token: "new-access",
      token_type: "Bearer",
      expires_in: 3600,
    });

    const { proxy } = await import("./proxy");
  const res = await proxy(
      makeRequest(
        "/forecasts",
        `token=${EXPIRED_JWT}; refresh_token=refresh-xyz`,
      ),
    );

    expect(mockRefreshAccessToken).toHaveBeenCalledWith("refresh-xyz");
    expect(res.status).toBe(200);
    const tokenCookie = res.cookies.get("token");
    expect(tokenCookie?.value).toBe("new-access");
    expect(tokenCookie?.maxAge).toBe(3600);
    expect(res.cookies.get("refresh_token")).toBeUndefined();
  });

  it("updates both cookies when refresh response rotates the refresh_token", async () => {
    mockRefreshAccessToken.mockResolvedValue({
      access_token: "new-access",
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: "rotated-refresh",
    });

    const { proxy } = await import("./proxy");
  const res = await proxy(
      makeRequest(
        "/forecasts",
        `token=${EXPIRED_JWT}; refresh_token=refresh-xyz`,
      ),
    );

    expect(res.status).toBe(200);
    expect(res.cookies.get("token")?.value).toBe("new-access");
    const refreshCookie = res.cookies.get("refresh_token");
    expect(refreshCookie?.value).toBe("rotated-refresh");
    expect(refreshCookie?.maxAge).toBe(30 * 24 * 60 * 60);
  });

  it("redirects to /login and clears the token when refresh fails", async () => {
    mockRefreshAccessToken.mockRejectedValue(new Error("refresh failed"));

    const { proxy } = await import("./proxy");
  const res = await proxy(
      makeRequest(
        "/forecasts",
        `token=${EXPIRED_JWT}; refresh_token=refresh-xyz`,
      ),
    );

    expect(mockRefreshAccessToken).toHaveBeenCalled();
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
    const tokenCookie = res.cookies.get("token");
    expect(tokenCookie?.value).toBe("");
    expect(tokenCookie?.maxAge).toBe(0);
  });
});
