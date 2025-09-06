import { createContext, useContext } from "react";
import type { Settings } from "../types/settings";

interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  saveSettings: (newSettings: Partial<Settings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
