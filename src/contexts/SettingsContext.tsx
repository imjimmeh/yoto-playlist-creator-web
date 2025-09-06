import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import type { Settings } from "@/types/settings";
import { useWebAPI } from "../hooks/useWebAPI";
import { useAuth } from "./AuthContext";
import { SettingsContext } from "./SettingsContext";

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<Settings>({
    yotoAuthToken: "",
    aiConfig: {
      apiKey: "",
      baseUrl: "",
      embeddingModel: "",
      chatModel: "",
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const webAPI = useWebAPI();
  const { authState } = useAuth();

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        yotoAuthToken,
        aiApiKey,
        aiBaseUrl,
        aiEmbeddingModel,
        aiChatModel,
      ] = await Promise.all([
        Promise.resolve(
          (webAPI.appStorage.get("yoto-access-token") as string) ||
          (webAPI.appStorage.get("yoto-auth-token") as string)
        ),
        Promise.resolve(webAPI.appStorage.get("ai-api-key") as string),
        Promise.resolve(webAPI.appStorage.get("ai-base-url") as string),
        Promise.resolve(
          webAPI.appStorage.get("ai-embedding-model") as string
        ),
        Promise.resolve(webAPI.appStorage.get("ai-chat-model") as string),
      ]);

      setSettings({
        yotoAuthToken: yotoAuthToken || "",
        aiConfig: {
          apiKey: aiApiKey || "",
          baseUrl: aiBaseUrl || "",
          embeddingModel: aiEmbeddingModel || "",
          chatModel: aiChatModel || "",
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [webAPI.appStorage, authState]);

  useEffect(() => {
    void loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload settings when authentication state changes
  useEffect(() => {
    void loadSettings();
  }, [authState.isAuthenticated, loadSettings]);

  const saveSettings = useCallback(
    async (newSettings: Partial<Settings>) => {
      const updatedSettings = {
        ...settings,
        ...newSettings,
        aiConfig: { ...settings.aiConfig, ...newSettings.aiConfig },
      };

      webAPI.appStorage.set(
        "yoto-access-token",
        updatedSettings.yotoAuthToken
      );
      webAPI.appStorage.set(
        "yoto-auth-token",
        updatedSettings.yotoAuthToken
      );
      webAPI.appStorage.set("ai-api-key", updatedSettings.aiConfig.apiKey);
      webAPI.appStorage.set("ai-base-url", updatedSettings.aiConfig.baseUrl);
      webAPI.appStorage.set(
        "ai-embedding-model",
        updatedSettings.aiConfig.embeddingModel || ""
      );
      webAPI.appStorage.set(
        "ai-chat-model",
        updatedSettings.aiConfig.chatModel || ""
      );

      setSettings(updatedSettings);
    },
    [settings, webAPI.appStorage]
  );

  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  const contextValue = useMemo(
    () => ({
      settings,
      isLoading,
      saveSettings,
      refreshSettings,
    }),
    [settings, isLoading, saveSettings, refreshSettings]
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};
