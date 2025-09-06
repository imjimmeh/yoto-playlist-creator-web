import type { OAuth2Config, PKCECodeChallenge, AuthTokens } from "../types";
import { logger } from "./Logger";

export class YotoAuthService {
  private readonly authUrl = "https://login.yotoplay.com/authorize";
  private readonly tokenUrl = "https://login.yotoplay.com/oauth/token";

  private readonly config: OAuth2Config = {
    clientId: "6Sywk5v92ETrGmHf2nv7VOf88XHZwNP1",
    redirectUri: import.meta.env.VITE_YOTO_REDIRECT_URI,
    scope: "offline_access",
    audience: "https://api.yotoplay.com",
  };

  constructor() {
    if (!this.config.redirectUri) {
      throw new Error("VITE_YOTO_REDIRECT_URI is not set");
    }
  }

  /**
   * Generate PKCE code challenge and verifier
   */
  private async generatePKCE(): Promise<PKCECodeChallenge> {
    // Generate random code verifier (43-128 characters)
    const codeVerifier = this.base64URLEncode(
      crypto.getRandomValues(new Uint8Array(32))
    );

    // Create code challenge using SHA256
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    const codeChallenge = this.base64URLEncode(new Uint8Array(digest));

    return {
      codeChallenge,
      codeVerifier,
      codeChallengeMethod: "S256",
    };
  }

  /**
   * Base64 URL encode without padding
   */
  private base64URLEncode(buffer: Uint8Array): string {
    return btoa(String.fromCharCode(...buffer))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  /**
   * Generate a random state value for CSRF protection
   */
  private generateState(): string {
    return this.base64URLEncode(crypto.getRandomValues(new Uint8Array(32)));
  }

  /**
   * Build the authorization URL for OAuth2 flow
   */
  async buildAuthUrl(): Promise<{
    url: string;
    state: string;
    codeVerifier: string;
  }> {
    const pkce = await this.generatePKCE();
    const state = this.generateState();

    const params = new URLSearchParams({
      audience: this.config.audience,
      scope: this.config.scope,
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state,
      code_challenge: pkce.codeChallenge,
      code_challenge_method: pkce.codeChallengeMethod,
    });

    const url = `${this.authUrl}?${params.toString()}`;

    logger.info("Built authorization URL", {
      url: url,
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      scope: this.config.scope,
    });

    return {
      url,
      state,
      codeVerifier: pkce.codeVerifier,
    };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    codeVerifier: string,
    state: string,
    receivedState: string
  ): Promise<AuthTokens> {
    // Verify state to prevent CSRF attacks
    if (state !== receivedState) {
      throw new Error("Invalid state parameter - possible CSRF attack");
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: this.config.clientId,
      code,
      redirect_uri: this.config.redirectUri,
      code_verifier: codeVerifier,
    });

    logger.info("Exchanging authorization code for token");

    const response = await fetch(this.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Token exchange failed", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(
        `Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const tokens = (await response.json()) as AuthTokens;
    logger.info("Token exchange successful", {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });

    return tokens;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: this.config.clientId,
      refresh_token: refreshToken,
    });

    logger.info("Refreshing access token");

    const response = await fetch(this.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Token refresh failed", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(
        `Token refresh failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const tokens = (await response.json()) as AuthTokens;
    logger.info("Token refresh successful", {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });

    return tokens;
  }

  /**
   * Open the authorization URL in the system browser (web version)
   */
  async startAuthFlow(): Promise<{ state: string; codeVerifier: string }> {
    const { url, state, codeVerifier } = await this.buildAuthUrl();

    logger.info("Opening authorization URL in browser", { url });

    try {
      // In web environment, open in a new tab
      window.open(url, "_blank");
      logger.info("Successfully opened browser tab");
    } catch (error) {
      logger.error("Failed to open browser", error);
      throw new Error(`Failed to open browser: ${error}`);
    }

    return { state, codeVerifier };
  }

  /**
   * Parse callback URL to extract authorization code and state
   */
  parseCallbackUrl(
    callbackUrl: string
  ): { code: string; state: string } | null {
    try {
      const url = new URL(callbackUrl);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      if (error) {
        const errorDescription = url.searchParams.get("error_description");
        logger.error("OAuth callback error", {
          error,
          errorDescription,
        });
        throw new Error(`OAuth error: ${error} - ${errorDescription}`);
      }

      if (!code || !state) {
        logger.error("Missing code or state in callback URL");
        return null;
      }

      return { code, state };
    } catch (error) {
      logger.error("Failed to parse callback URL", error);
      return null;
    }
  }

  /**
   * Get the current OAuth2 configuration
   */
  getConfig(): OAuth2Config {
    return { ...this.config };
  }
}
