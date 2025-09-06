export type Category =
  | "none"
  | "stories"
  | "music"
  | "radio"
  | "podcast"
  | "sfx"
  | "activities"
  | "alarms";

export type Language =
  | "en"
  | "en-gb"
  | "en-us"
  | "fr"
  | "fr-fr"
  | "es"
  | "es-es"
  | "es-419"
  | "de"
  | "it";

export type StatusName =
  | "new"
  | "inprogress"
  | "complete"
  | "live"
  | "archived";

export type PlaybackDirection = "DESC" | "ASC";

export type TrackType = "audio" | "stream";

export type TrackFormat = "mp3" | "aac" | "opus" | "ogg";

export type PlaybackType = "linear" | "interactive";

export interface Cover {
  imageL: string;
}

export interface Media {
  duration: number;
  fileSize: number;
  hasStreams: boolean;
}

export interface Status {
  name: StatusName;
  updatedAt: string; // ISO 8601 date string
}

export interface Metadata {
  accent: string;
  addToFamilyLibrary: boolean;
  author: string;
  category: Category;
  copyright: string;
  cover: Cover;
  description: string;
  genre: string[];
  languages: Language[];
  maxAge: number;
  media: Media;
  minAge: number;
  musicType: string[];
  note: string;
  order: string;
  audioPreviewUrl: string;
  readBy: string;
  share: boolean;
  status: Status;
  tags: string[];
  feedUrl: string;
  numEpisodes: number;
  playbackDirection: PlaybackDirection;
}

export interface Track {
  key: string;
  trackUrl: string;
  type: TrackType;
  format: TrackFormat;
  duration: number;
}

export interface Chapter {
  key: string;
  title: string;
  duration: number;
  tracks: Track[];
}

export interface Config {
  autoadvance: "true" | "false";
  resumeTimeout: number;
  systemActivity: boolean;
  trackNumberOverlayTimeout: number;
}

export interface Content {
  activity: string;
  chapters: Chapter[];
  config: Config;
  playbackType: PlaybackType;
  version: string;
}

export interface Card {
  cardId: string;
  title: string;
  metadata: Metadata;
  content: Content;
  tags: string[];
  slug: string;
}
