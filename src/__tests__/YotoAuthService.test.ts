import { YotoAuthService } from "../services/YotoAuthService";

// Mock the rendererLogger
jest.mock("../services/Logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Mock crypto API
Object.defineProperty(global, "crypto", {
  value: {
    getRandomValues: jest.fn().mockImplementation((array) => {
      // Fill the array with random values
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
    subtle: {
      digest: jest.fn().mockImplementation((_algorithm, _data) => {
        // Return a mock digest
        return Promise.resolve(
          new Uint8Array([
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
          ])
        );
      }),
    },
  },
});

describe("YotoAuthService", () => {
  let authService: YotoAuthService;

  beforeEach(() => {
    authService = new YotoAuthService();
    jest.clearAllMocks();
  });

  describe("buildAuthUrl", () => {
    it("should build a valid authorization URL", async () => {
      const result = await authService.buildAuthUrl();

      expect(result.url).toContain("https://login.yotoplay.com/authorize");
      expect(result.url).toContain(
        "client_id=6Sywk5v92ETrGmHf2nv7VOf88XHZwNP1"
      );
      expect(result.url).toContain(
        "redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback"
      );
      expect(result.url).toContain("scope=offline_access");
      expect(result.url).toContain("audience=https%3A%2F%2Fapi.yotoplay.com");
      expect(result.url).toContain("response_type=code");
      expect(result.url).toContain("code_challenge_method=S256");
      expect(result.state).toBeDefined();
      expect(result.codeVerifier).toBeDefined();
    });

    it("should generate a valid PKCE code challenge and verifier", async () => {
      const result = await authService.buildAuthUrl();

      // Check that code challenge and verifier are properly formatted
      expect(result.codeVerifier).toMatch(/^[A-Za-z0-9-_]+$/);
      // The URL should contain the code challenge
      expect(result.url).toMatch(/code_challenge=[A-Za-z0-9-_]+/);
    });
  });

  describe("parseCallbackUrl", () => {
    it("should parse a valid callback URL and extract code and state", () => {
      const callbackUrl =
        "http://localhost:3000/auth/callback?code=test-code&state=test-state";
      const result = authService.parseCallbackUrl(callbackUrl);

      expect(result).toEqual({
        code: "test-code",
        state: "test-state",
      });
    });

    it("should return null for invalid callback URL", () => {
      const callbackUrl = "http://localhost:3000/auth/callback";
      const result = authService.parseCallbackUrl(callbackUrl);

      expect(result).toBeNull();
    });

    it("should return null if OAuth error is present in callback URL", () => {
      const callbackUrl =
        "http://localhost:3000/auth/callback?error=access_denied&error_description=User%20denied%20access";
      const result = authService.parseCallbackUrl(callbackUrl);

      expect(result).toBeNull();
      expect(require("../services/Logger").logger.error).toHaveBeenCalled();
    });
  });

  describe("exchangeCodeForToken", () => {
    it("should exchange authorization code for tokens", async () => {
      const mockTokens = {
        access_token: "access-token",
        refresh_token: "refresh-token",
        expires_in: 3600,
        token_type: "Bearer",
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockTokens),
      });

      const result = await authService.exchangeCodeForToken(
        "test-code",
        "test-verifier",
        "test-state",
        "test-state"
      );

      expect(result).toEqual(mockTokens);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://login.yotoplay.com/oauth/token",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
        })
      );
    });

    it("should throw an error if states do not match", async () => {
      await expect(
        authService.exchangeCodeForToken(
          "test-code",
          "test-verifier",
          "test-state",
          "different-state"
        )
      ).rejects.toThrow("Invalid state parameter - possible CSRF attack");
    });

    it("should throw an error if token exchange fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: jest.fn().mockResolvedValue("Invalid code"),
      });

      await expect(
        authService.exchangeCodeForToken(
          "invalid-code",
          "test-verifier",
          "test-state",
          "test-state"
        )
      ).rejects.toThrow(
        "Token exchange failed: 400 Bad Request - Invalid code"
      );
    });
  });

  describe("refreshToken", () => {
    it("should refresh access token using refresh token", async () => {
      const mockTokens = {
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
        expires_in: 3600,
        token_type: "Bearer",
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockTokens),
      });

      const result = await authService.refreshToken("refresh-token");

      expect(result).toEqual(mockTokens);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://login.yotoplay.com/oauth/token",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
        })
      );
    });

    it("should throw an error if token refresh fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: jest.fn().mockResolvedValue("Invalid refresh token"),
      });

      await expect(
        authService.refreshToken("invalid-refresh-token")
      ).rejects.toThrow(
        "Token refresh failed: 400 Bad Request - Invalid refresh token"
      );
    });
  });

  describe("getConfig", () => {
    it("should return the OAuth2 configuration", () => {
      const config = authService.getConfig();

      expect(config).toEqual({
        clientId: "6Sywk5v92ETrGmHf2nv7VOf88XHZwNP1",
        redirectUri: "http://localhost:3000/auth/callback",
        scope: "offline_access",
        audience: "https://api.yotoplay.com",
      });
    });

    it("should return a copy of the configuration to prevent mutation", () => {
      const config1 = authService.getConfig();
      const config2 = authService.getConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });
});
