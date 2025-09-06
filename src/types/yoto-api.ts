// Yoto API Response Types
export interface YotoApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface YotoPlaylistCardResponse {
  card: YotoPlaylistCard;
}

export interface YotoPlaylistCard {
  cardId: string;
  title: string;
  metadata?: {
    cover?: {
      imageL?: string;
    };
    media?: {
      duration?: number;
      fileSize?: number;
      readableDuration?: string;
      readableFileSize?: number;
    };
    description?: string;
  };
  content?: {
    chapters?: YotoPlaylistChapter[];
    playbackType?: "linear";
    config?: {
      resumeTimeout?: number;
    };
  };
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface YotoPlaylistChapter {
  key: string;
  title: string;
  tracks?: YotoTrack[];
  display?: {
    icon16x16?: string;
  } | null;
  availableFrom?: string | null;
  ambient?: unknown | null;
  defaultTrackDisplay?: unknown | null;
  defaultTrackAmbient?: unknown | null;
  fileSize?: number;
  duration?: number;
}

export interface YotoTrack {
  key: string;
  title: string;
  trackUrl: string;
  type: "audio" | "stream";
  format: "mp3" | "aac" | "opus" | "ogg";
  duration: number;
  fileSize: number;
  display?: {
    icon16x16?: string;
  } | null;
  ambient?: unknown | null;
  events?: {
    onEnd?: {
      cmd: "stop" | "repeat";
    };
  };
}

export interface YotoUploadResult {
  success: boolean;
  mediaId?: string;
  error?: string;
}

export interface YotoIconMapping {
  chapterKey: string;
  iconUrl: string;
}

// Icon types
export interface YotoIcon {
  mediaId: string;
}

export interface YotoPublicIcon extends YotoIcon {
  title: string;
  publicTags: string[];
}

export interface YotoUserIcon extends YotoIcon {
  userId: string;
  createdAt: string;
  displayIconId: string;
  public: boolean;
  url: string;
}

// Track playback options
export type TrackPlaybackOption = "continue" | "stop" | "repeat";

export interface TrackPlaybackOptionConfig {
  value: TrackPlaybackOption;
  label: string;
  description: string;
  eventCmd?: "stop" | "repeat";
}

export const TRACK_PLAYBACK_OPTIONS: TrackPlaybackOptionConfig[] = [
  {
    value: "continue",
    label: "Continue to next track",
    description: "Play the next track automatically (default)",
  },
  {
    value: "stop",
    label: "Pause, wait for button press",
    description: "Pause playback when this track ends",
    eventCmd: "stop",
  },
  {
    value: "repeat",
    label: "Repeat this track",
    description: "Loop this track continuously",
    eventCmd: "repeat",
  },
];
