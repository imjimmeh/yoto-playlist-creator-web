import React from "react";
import { SettingsProvider } from "./SettingsContext.tsx";
import { AuthProvider } from "./AuthContext";
import { ServicesProvider } from "./ServicesProvider.tsx";
import { WebAPIProvider } from "./WebAPIContext.tsx";
import { ErrorProvider } from "./ErrorContext";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorProvider>
      <WebAPIProvider>
        <AuthProvider>
          <SettingsProvider>
            <ServicesProvider>
              {children}
            </ServicesProvider>
          </SettingsProvider>
        </AuthProvider>
      </WebAPIProvider>
    </ErrorProvider>
  );
};
