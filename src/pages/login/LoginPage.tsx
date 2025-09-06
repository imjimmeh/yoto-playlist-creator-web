import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useError } from "@/contexts/ErrorContext";
import { YotoAuthService } from "@/services/YotoAuthService";
import "./LoginPage.css";
import { logger } from "@/services/Logger";

const LoginPage: React.FC = () => {
  const { login, authState } = useAuth();
  const { showError } = useError();
  const [isLoading, setIsLoading] = useState(false);
  const [authService] = useState(() => new YotoAuthService());

  // Handle the callback URL if we're on the callback page
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const receivedState = urlParams.get("state");
      const error = urlParams.get("error");

      if (error) {
        const errorDescription = urlParams.get("error_description");
        showError(`Authentication error: ${error} - ${errorDescription}`);
        return;
      }

      if (code && receivedState) {
        setIsLoading(true);

        try {
          // Retrieve stored auth data from localStorage (instead of electronStore)
          const storedState = localStorage.getItem("yoto-auth-state");
          const storedVerifier = localStorage.getItem("yoto-auth-verifier");

          if (!storedState || !storedVerifier) {
            throw new Error("Missing stored authentication data");
          }

          const tokens = await authService.exchangeCodeForToken(
            code,
            storedVerifier,
            storedState,
            receivedState
          );

          // Clean up stored auth data
          localStorage.removeItem("yoto-auth-state");
          localStorage.removeItem("yoto-auth-verifier");

          await login(
            tokens.access_token,
            tokens.refresh_token,
            tokens.expires_in
          );
          logger.info("Login successful");

          // Navigate back to the main app
          window.location.href = "/";
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error occurred";
          showError(`Login failed: ${errorMessage}`);
          logger.error("Login failed", err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (window.location.pathname.includes("/auth/callback")) {
      void handleCallback();
    }
  }, [authService, login, showError]);

  const handleLogin = async () => {
    setIsLoading(true);

    try {
      const { url, state, codeVerifier } = await authService.buildAuthUrl();

      // Store auth flow data before navigating
      localStorage.setItem("yoto-auth-state", state);
      localStorage.setItem("yoto-auth-verifier", codeVerifier);

      logger.info("Navigating to Yoto login page");

      // Navigate to the auth URL in the same window
      window.location.href = url;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      showError(`Failed to start authentication: ${errorMessage}`);
      logger.error("Failed to start auth flow", err);
      setIsLoading(false);
    }
  };

  // If already authenticated, show a different view
  if (authState.isAuthenticated) {
    return (
      <div className="login-page authenticated">
        <div className="login-container">
          <h1>Already Logged In</h1>
          <p>You are already authenticated with Yoto.</p>
          <div className="login-actions">
            <button
              type="button"
              onClick={() => (window.location.href = "/")}
              className="btn btn-primary"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Welcome to Yoto Playlist Creator</h1>
          <p>Create custom audio playlists for your Yoto Player</p>

          <div className="app-features">
            <div className="feature">
              <span className="feature-icon">🎵</span>
              <span>
                Random playlist generation; create a random playlist from your
                existing tracks!
              </span>
            </div>
            <div className="feature">
              <span className="feature-icon">📋</span>
              <span>Playlist searching + sorting functionality</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🎨</span>
              <span>
                Use AI to pick icons for your tracks; no need to do it manually
                for loads of songs!
              </span>
            </div>
            <div className="feature">
              <span className="feature-icon">☁️</span>
              <span>Syncs directly to your Yoto library</span>
            </div>
          </div>

          <p className="login-subtitle">
            Sign in to your Yoto account to get started
          </p>
        </div>

        <div className="login-form">
          <div className="login-actions">
            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoading}
              className="btn btn-primary btn-large"
            >
              {isLoading ? "Redirecting to Yoto..." : "Sign In with Yoto"}
            </button>
          </div>
        </div>

        <div className="login-footer">
          <p>
            Need a Yoto account?{" "}
            <a
              href="https://my.yotoplay.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sign up at yotoplay.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
