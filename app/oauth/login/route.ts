import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAuthorizationUrl,
  generateRandomString,
  generateCodeChallenge,
} from "@/lib/idp/client";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const returnUrl = searchParams.get("returnUrl") || "/";

  try {
    // Generate PKCE values
    const state = generateRandomString(32);
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Determine redirect URI
    const redirectUri = `${request.nextUrl.origin}/oauth/callback`;

    // Store state and code verifier in cookies for validation in callback
    const cookieStore = await cookies();

    // State cookie - short lived, only needed until callback
    cookieStore.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 600, // 10 minutes
      sameSite: "lax",
      path: "/",
    });

    // Code verifier cookie - needed to exchange code for tokens
    cookieStore.set("oauth_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 600, // 10 minutes
      sameSite: "lax",
      path: "/",
    });

    // Store return URL to redirect back after login
    cookieStore.set("oauth_return_url", returnUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 600, // 10 minutes
      sameSite: "lax",
      path: "/",
    });

    // Generate authorization URL
    const authUrl = getAuthorizationUrl(state, codeChallenge, redirectUri);

    logger.debug("Initiating OAuth login", {
      redirectUri,
      returnUrl,
    });

    // Redirect to IDP
    return NextResponse.redirect(authUrl);
  } catch (err) {
    logger.error("Failed to initiate OAuth login", err as Error);
    return NextResponse.redirect(
      new URL("/login?error=Failed+to+start+login", request.url),
    );
  }
}
