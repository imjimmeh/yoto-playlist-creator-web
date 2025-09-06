// Import Yoto types for the TrackWithUploadStatus interface
import type { YotoPlaylistChapter } from "./yoto-api";

export interface FileInfo {
  fileName: string;
  filePath: string;
  fileSize: number;
  file?: File; // For web compatibility
}

export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  embeddingModel?: string;
  chatModel?: string;
}

export type PlaylistSourceType = "directory" | "files";

export interface PlaylistSource {
  id: string;
  type: PlaylistSourceType;
  path: string; // For directories, or display name for file collections
  files?: string[]; // For individual file selections
  fileCount: number;
}

// Common auth token type
export type AuthToken = string;

// Base payload interface
export interface BaseJobPayload {
  authToken: AuthToken;
  playlistTitle: string;
}

// Log levels
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

// Authentication Types
export interface AuthState {
  isAuthenticated: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  userInfo?: UserInfo;
}

export interface UserInfo {
  id?: string;
  email?: string;
  name?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

export interface OAuth2Config {
  clientId: string;
  redirectUri: string;
  scope: string;
  audience: string;
}

export interface PKCECodeChallenge {
  codeChallenge: string;
  codeVerifier: string;
  codeChallengeMethod: string;
}

// Track with upload status
export interface TrackWithUploadStatus extends YotoPlaylistChapter {
  uploadStatus?: 'uploading' | 'transcoding' | 'completed' | 'failed';
  uploadProgress?: number;
  originalFile?: File;
  uploadError?: string;
  artist?: string;
}

// Settings interface
export interface Settings {
  yotoAuthToken: string;
  aiConfig: AiConfig;
}