import type { JobQueueService } from "@/services/JobQueueService";
import type { YotoAuthService } from "@/services/YotoAuthService";
import type { YotoCoverImageService } from "@/services/YotoCoverImageService";
import type { YotoIconService } from "@/services/YotoIconService";
import type { YotoPlaylistService } from "@/services/YotoPlaylistService";
import type { YotoSongUploadService } from "@/services/YotoSongUploadService";
import type { YotoDataSyncService } from "@/services/YotoDataSyncService";
import type { CustomIconService } from "@/services/CustomIconService";
import { createContext } from "react";

interface ServicesContextType {
  jobQueueService: JobQueueService;
  yotoPlaylistService: YotoPlaylistService;
  yotoIconService: YotoIconService;
  yotoCoverImageService: YotoCoverImageService;
  yotoAuthService: YotoAuthService;
  yotoSongUploadService: YotoSongUploadService;
  yotoDataSyncService: YotoDataSyncService;
  customIconService: CustomIconService;
  isReady: boolean;
}

export const ServicesContext = createContext<ServicesContextType | undefined>(
  undefined
);
