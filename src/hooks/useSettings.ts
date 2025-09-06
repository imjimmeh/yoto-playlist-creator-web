import { useContext } from "react";
import { SettingsContext } from "../contexts/SettingsContext";

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }

  const { settings, isLoading, saveSettings, refreshSettings } = context;

  return {
    settings,
    isLoading,
    saveSettings,
    refreshSettings,
  };
};
