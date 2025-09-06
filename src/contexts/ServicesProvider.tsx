import React, { useMemo, useEffect } from "react";
import { YotoPlaylistService } from "@/services/YotoPlaylistService";
import { YotoIconService } from "@/services/YotoIconService";
import { YotoCoverImageService } from "@/services/YotoCoverImageService";
import { YotoAuthService } from "@/services/YotoAuthService";
import { yotoHttpClient } from "@/services/YotoHttpClient";
import { useSettings } from "@/hooks/useSettings";
import { ServicesContext } from "./ServicesContext";
import { YotoSongUploadService } from "@/services/YotoSongUploadService";
import { useAuth } from "./AuthContext";
import { jobQueueService } from "@/services/jobQueueStore";
import { CustomIconService } from "@/services/CustomIconService";
import { YotoDataSyncService } from "@/services/YotoDataSyncService";

export const ServicesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { settings, isLoading } = useSettings();
  const { handleAuthFailure } = useAuth();
  const [isReady, setIsReady] = React.useState(false);

  // This useMemo now just provides the service instances.
  const services = useMemo(() => {
    // Note: We provide the same singleton instances of jobQueueService and yotoHttpClient
    // that are used inside jobQueueStore.ts to ensure consistency.
    return {
      jobQueueService, // The singleton instance
      yotoHttpClient, // The singleton instance
      yotoPlaylistService: new YotoPlaylistService(yotoHttpClient),
      yotoIconService: new YotoIconService(yotoHttpClient),
      yotoCoverImageService: new YotoCoverImageService(yotoHttpClient),
      yotoAuthService: new YotoAuthService(),
      yotoSongUploadService: new YotoSongUploadService(yotoHttpClient),
      customIconService: new CustomIconService(yotoHttpClient),
      yotoDataSyncService: new YotoDataSyncService(yotoHttpClient),
    };
  }, []);

  // This useEffect's only job is to keep the singleton http client updated.
  // Wait for settings to finish loading before setting the provider.
  useEffect(() => {
    if (!isLoading) {
      yotoHttpClient.setSettingsProvider({ getSettings: () => settings });
      yotoHttpClient.setAuthFailureCallback(handleAuthFailure);
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [settings, handleAuthFailure, isLoading]);

  const contextValue = useMemo(() => ({
    ...services,
    isReady
  }), [services, isReady]);

  return (
    <ServicesContext.Provider value={contextValue}>
      {children}
    </ServicesContext.Provider>
  );
};