import "server-only";
import * as jose from "jose";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

// IDP_BASE_URL: server-to-server calls (internal K8s URL in cluster).
// IDP_PUBLIC_URL: browser-facing redirects and JWT issuer validation (external URL, baked at build time via NEXT_PUBLIC_IDP_BASE_URL).
const IDP_BASE_URL = requiredEnv("IDP_BASE_URL");
const IDP_PUBLIC_URL = requiredEnv("NEXT_PUBLIC_IDP_BASE_URL");
const IDP_CLIENT_ID = process.env.IDP_CLIENT_ID || "";
const IDP_CLIENT_SECRET = process.env.IDP_CLIENT_SECRET || "";
const IDP_ADMIN_CLIENT_ID = process.env.IDP_ADMIN_CLIENT_ID || "";
const IDP_ADMIN_CLIENT_SECRET = process.env.IDP_ADMIN_CLIENT_SECRET || "";

// Types
export interface IDPUser {
  id: string; // UUID
  username: string;
  email: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface IDPClaims {
  sub: string; // User UUID
  username: string;
  email: string;
  email_verified: boolean;
  scope?: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

export interface UserInfoResponse {
  sub: string;
  username?: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  picture?: string; // Avatar URL
}

/**
 * Admin client for IDP operations using client credentials flow.
 * Used for creating users during migration.
 */
export class IDPAdminClient {
  private token: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Get an admin access token using client credentials flow.
   * Caches the token until it's about to expire.
   */
  async getToken(): Promise<string> {
    // Return cached token if still valid (with 60 second buffer)
    if (this.token && Date.now() < this.tokenExpiry - 60000) {
      return this.token;
    }

    const response = await fetch(`${IDP_BASE_URL}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: IDP_ADMIN_CLIENT_ID,
        client_secret: IDP_ADMIN_CLIENT_SECRET,
        scope: "admin:users:read admin:users:write",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get admin token: ${error}`);
    }

    const data: TokenResponse = await response.json();
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;

    return this.token;
  }

  /**
   * Get a user by username from the IDP.
   * Uses the list users endpoint and filters by username.
   * Returns null if user not found.
   */
  async getUserByUsername(username: string): Promise<IDPUser | null> {
    const token = await this.getToken();

    // The IDP doesn't have a by-username endpoint, so we list users and filter
    // This is fine for small user counts during migration
    const response = await fetch(
      `${IDP_BASE_URL}/admin/users?limit=100`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list users from IDP: ${error}`);
    }

    const data: { users: IDPUser[] } = await response.json();
    const user = data.users.find((u) => u.username === username);
    return user ?? null;
  }

  /**
   * Create a new user in the IDP.
   * Used during migration when a legacy user logs in.
   */
  async createUser(
    username: string,
    email: string,
    password: string,
  ): Promise<IDPUser> {
    const token = await this.getToken();

    const response = await fetch(`${IDP_BASE_URL}/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      // 409 means user already exists - caller should handle this
      if (response.status === 409) {
        throw new IDPUserExistsError(`User already exists: ${error}`);
      }
      throw new Error(`Failed to create user in IDP: ${error}`);
    }

    return response.json();
  }
}

export class IDPUserExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IDPUserExistsError";
  }
}

/**
 * Generate the OAuth authorization URL for initiating the login flow.
 * Uses PKCE for security.
 */
export function getAuthorizationUrl(
  state: string,
  codeChallenge: string,
  redirectUri: string,
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: IDP_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "openid profile email",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${IDP_PUBLIC_URL}/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange an authorization code for tokens.
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const response = await fetch(`${IDP_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: IDP_CLIENT_ID,
      client_secret: IDP_CLIENT_SECRET,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }

  return response.json();
}

/**
 * Refresh an access token using a refresh token.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenResponse> {
  const response = await fetch(`${IDP_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: IDP_CLIENT_ID,
      client_secret: IDP_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return response.json();
}

// JWKS cache
let jwksCache: jose.JWTVerifyGetKey | null = null;
let jwksCacheExpiry: number = 0;

/**
 * Get the JWKS for validating IDP tokens.
 * Caches the JWKS for 1 hour.
 */
async function getJWKS(): Promise<jose.JWTVerifyGetKey> {
  // Return cached JWKS if still valid
  if (jwksCache && Date.now() < jwksCacheExpiry) {
    return jwksCache;
  }

  const jwksUrl = new URL("/.well-known/jwks.json", IDP_BASE_URL);
  jwksCache = jose.createRemoteJWKSet(jwksUrl);
  jwksCacheExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

  return jwksCache;
}

/**
 * Validate an IDP access token and return its claims.
 *
 * NOTE: This validates the token signature locally using JWKS.
 * It does NOT check if the token has been revoked on the IDP.
 * For high-security scenarios, consider using the /oauth/introspect endpoint
 * to verify the token is still active. This adds network latency but catches
 * revoked tokens.
 */
export async function validateIDPToken(token: string): Promise<IDPClaims> {
  const jwks = await getJWKS();

  const { payload } = await jose.jwtVerify(token, jwks, {
    issuer: IDP_PUBLIC_URL,
    // We don't strictly validate audience since it varies by client
  });

  return {
    sub: payload.sub as string,
    username: payload.username as string,
    email: payload.email as string,
    email_verified: payload.email_verified as boolean,
    scope: payload.scope as string | undefined,
    iss: payload.iss as string,
    aud: payload.aud as string,
    exp: payload.exp as number,
    iat: payload.iat as number,
  };
}

/**
 * Fetch user info from the IDP's /oauth/userinfo endpoint.
 * This returns profile information including the avatar URL.
 */
export async function fetchUserInfo(accessToken: string): Promise<UserInfoResponse> {
  const response = await fetch(`${IDP_BASE_URL}/oauth/userinfo`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch user info: ${error}`);
  }

  return response.json();
}

/**
 * Generate a cryptographically secure random string for PKCE and state.
 */
export function generateRandomString(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Generate a PKCE code challenge from a code verifier.
 * Uses SHA-256 as required by the IDP.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return jose.base64url.encode(new Uint8Array(hash));
}

/**
 * Construct a full name from given_name and family_name fields.
 * Returns null if neither field is provided or if they contain only whitespace.
 */
export function buildNameFromUserInfo(userInfo: UserInfoResponse): string | null {
  const parts = [userInfo.given_name, userInfo.family_name]
    .map((n) => n?.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}
