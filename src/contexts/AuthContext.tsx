import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import type { AuthState, UserInfo } from "@/types";
import { useWebAPI } from "../hooks/useWebAPI";
import { useNavigate } from "react-router-dom";
import { logger } from "@/services/Logger";

interface AuthContextType {
  authState: AuthState;
  isLoading: boolean;
  login: (
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  isTokenExpired: () => boolean;
  handleAuthFailure: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const webAPI = useWebAPI();
  const navigate = useNavigate();

  // Load authentication state from storage on app start
  const loadAuthState = async () => {
    try {
      setIsLoading(true);
      const [accessToken, refreshToken, expiresAt, userInfo] =
        await Promise.all([
          Promise.resolve(
            webAPI.appStorage.get("yoto-access-token") as string | undefined
          ),
          Promise.resolve(
            webAPI.appStorage.get("yoto-refresh-token") as string | undefined
          ),
          Promise.resolve(
            (() => {
              const expiresAtStr = webAPI.appStorage.get(
                "yoto-token-expires-at"
              );
              return expiresAtStr ? parseInt(expiresAtStr, 10) : undefined;
            })()
          ),
          Promise.resolve(
            webAPI.appStorage.get("yoto-user-info") as UserInfo | undefined
          ),
        ]);

      if (accessToken) {
        const isExpired = expiresAt ? Date.now() >= expiresAt : false;

        setAuthState({
          isAuthenticated: !isExpired,
          accessToken: isExpired ? undefined : accessToken,
          refreshToken,
          expiresAt,
          userInfo,
        });

        logger.info("Auth state loaded from storage", {
          hasAccessToken: !!accessToken,
          isExpired,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        });
      }
    } catch (error) {
      logger.error("Failed to load auth state", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAuthState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number
  ) => {
    const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : undefined;

    const newAuthState: AuthState = {
      isAuthenticated: true,
      accessToken,
      refreshToken,
      expiresAt,
    };

    // Save to storage
    webAPI.appStorage.set("yoto-access-token", accessToken);
    webAPI.appStorage.set("yoto-refresh-token", refreshToken || "");
    webAPI.appStorage.set("yoto-token-expires-at", String(expiresAt || 0));

    setAuthState(newAuthState);
    logger.info("User logged in successfully", {
      hasRefreshToken: !!refreshToken,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    });
  }, [webAPI.appStorage]);

  const logout = useCallback(async () => {
    // Clear all auth data from storage
    webAPI.appStorage.delete("yoto-access-token");
    webAPI.appStorage.delete("yoto-refresh-token");
    webAPI.appStorage.delete("yoto-token-expires-at");
    webAPI.appStorage.delete("yoto-user-info");
    webAPI.appStorage.delete("yoto-auth-token"); // Clear legacy token

    setAuthState({
      isAuthenticated: false,
    });

    logger.info("User logged out");
  }, [webAPI.appStorage]);

  const refreshAuth = useCallback(async () => {
    if (!authState.refreshToken) {
      logger.warn("No refresh token available");
      return;
    }

    // TODO: Implement token refresh when YotoAuthService is available in web version
    logger.warn("Token refresh not implemented in web version yet");
    // For now, just force logout when tokens expire
    await logout();
  }, [authState.refreshToken, logout]);

  const isTokenExpired = useCallback((): boolean => {
    if (!authState.expiresAt) {
      return false; // No expiration time, assume valid
    }
    return Date.now() >= authState.expiresAt;
  }, [authState.expiresAt]);

  const handleAuthFailure = useCallback(() => {
    logger.warn(
      "Auth failure detected, clearing tokens and redirecting to login"
    );

    // Clear all auth data from storage immediately
    webAPI.appStorage.delete("yoto-access-token");
    webAPI.appStorage.delete("yoto-refresh-token");
    webAPI.appStorage.delete("yoto-token-expires-at");
    webAPI.appStorage.delete("yoto-user-info");
    webAPI.appStorage.delete("yoto-auth-token"); // Clear legacy token

    // Update auth state
    setAuthState({
      isAuthenticated: false,
    });

    // Redirect to login page
    navigate("/login", { replace: true });
  }, [webAPI.appStorage, navigate]);

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.expiresAt) {
      return;
    }

    const timeUntilExpiry = authState.expiresAt - Date.now();
    const refreshThreshold = 5 * 60 * 1000; // 5 minutes

    if (timeUntilExpiry <= refreshThreshold && timeUntilExpiry > 0) {
      void refreshAuth();
    }

    // Set up auto-refresh timer
    const refreshTimer = setTimeout(() => {
      if (authState.isAuthenticated && !isTokenExpired()) {
        void refreshAuth();
      }
    }, Math.max(timeUntilExpiry - refreshThreshold, 0));

    return () => clearTimeout(refreshTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.isAuthenticated, authState.expiresAt]);

  const authContextState = useMemo(
    () => ({
      authState,
      isLoading,
      login,
      logout,
      refreshAuth,
      isTokenExpired,
      handleAuthFailure,
    }),
    [
      authState,
      isLoading,
      login,
      logout,
      refreshAuth,
      isTokenExpired,
      handleAuthFailure,
    ]
  );

  return (
    <AuthContext.Provider value={authContextState}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
