import { logger } from "./Logger";
import type { Settings } from "../types/app";

interface SettingsProvider {
  getSettings(): Settings;
}

export type YotoRequestOptions = {
  headers?: Record<string, string>;
  body?: unknown;
  bodyType?: "json" | "binary" | "form";
};

export type AuthFailureCallback = () => void;

export class YotoHttpClient {
  private readonly baseUrl = "https://api.yotoplay.com";
  private settingsProvider?: SettingsProvider;
  private authFailureCallback?: AuthFailureCallback;

  /**
   * Set the settings provider for automatic dependency retrieval
   */
  setSettingsProvider(provider: SettingsProvider): void {
    this.settingsProvider = provider;
  }

  /**
   * Set callback to handle auth failures (401/403)
   */
  setAuthFailureCallback(callback: AuthFailureCallback): void {
    this.authFailureCallback = callback;
  }

  /**
   * Get access token from provider
   */
  private getAuthToken(): string | null {
    if (this.settingsProvider) {
      const settings = this.settingsProvider.getSettings();
      if (settings.yotoAuthToken) {
        return settings.yotoAuthToken;
      }
    }
    return null;
  }

  private getDefaultHeaders(authToken: string): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: authToken.startsWith("Bearer ")
        ? authToken
        : `Bearer ${authToken}`,
    };

    return {
      ...headers,
      Accept: "application/json",
    };
  }

  private async makeRequest(
    path: string,
    method: string,
    options: YotoRequestOptions = {}
  ): Promise<unknown> {
    const token = this.getAuthToken();
    if (!token) {
      if (this.authFailureCallback) {
        this.authFailureCallback();
      }
      throw new Error("No authentication token available");
    }
    const url = path.startsWith("http")
      ? path
      : `${this.baseUrl}/${path.replace(/^\//, "")}`;

    const { headers: customHeaders = {}, body, bodyType = "json" } = options;

    const headers = {
      ...this.getDefaultHeaders(token),
      ...customHeaders,
    };

    const requestOptions: RequestInit = {
      method,
      headers,
    };

    if (body) {
      switch (bodyType) {
        case "json":
          headers["Content-Type"] = "application/json;charset=utf-8";
          requestOptions.body = JSON.stringify(body);
          break;
        case "binary":
          requestOptions.body = body as BodyInit;
          break;
        case "form":
          requestOptions.body = body as FormData;
          break;
      }
    }

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();

      // Handle auth failures (401 Unauthorized, 403 Forbidden)
      if (response.status === 401 || response.status === 403) {
        logger.warn(
          `Auth failure detected: ${response.status} ${response.statusText}`
        );
        if (this.authFailureCallback) {
          this.authFailureCallback();
        }
      }

      throw new Error(
        `HTTP error! status: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response.json();
  }

  async get(
    path: string,
    options?: Omit<YotoRequestOptions, "body" | "bodyType">
  ): Promise<unknown> {
    return this.makeRequest(path, "GET", options);
  }

  async post(
    path: string,
    body?: unknown,
    options?: YotoRequestOptions
  ): Promise<unknown> {
    return this.makeRequest(path, "POST", { ...options, body });
  }

  async put(
    path: string,
    body?: unknown,
    options?: YotoRequestOptions
  ): Promise<unknown> {
    return this.makeRequest(path, "PUT", { ...options, body });
  }

  async delete(
    path: string,
    options?: Omit<YotoRequestOptions, "body" | "bodyType">
  ): Promise<unknown> {
    return this.makeRequest(path, "DELETE", options);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Export a singleton instance for convenience
export const yotoHttpClient = new YotoHttpClient();
