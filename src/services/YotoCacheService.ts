import { logger } from "./Logger";
import type { YotoPublicIcon } from "../types/yoto-api";

interface CachedIconData {
  icons: YotoPublicIcon[];
  embeddings: number[][];
  lastFetched: number;
  iconHashes: string[]; // Hash of each icon's key properties to detect changes
}

interface CacheMetadata {
  lastCleared: number;
  version: string;
}

export class YotoCacheService {
  private readonly CACHE_KEY = "yoto-icons-cache";
  private readonly METADATA_KEY = "yoto-cache-metadata";
  private readonly CACHE_VERSION = "1.0.0";
  private readonly CACHE_EXPIRY_HOURS = 24; // Cache expires after 24 hours

  constructor() {
    this.initializeCache();
  }

  private initializeCache(): void {
    try {
      const metadataStr = localStorage.getItem(this.METADATA_KEY);
      const metadata = metadataStr
        ? (JSON.parse(metadataStr) as CacheMetadata)
        : null;

      if (!metadata || metadata.version !== this.CACHE_VERSION) {
        // Clear cache if version mismatch or first run
        this.clearCache();
        const newMetadata: CacheMetadata = {
          lastCleared: Date.now(),
          version: this.CACHE_VERSION,
        };
        localStorage.setItem(this.METADATA_KEY, JSON.stringify(newMetadata));
      }
    } catch (error) {
      logger.warn("Error initializing cache:", error);
      this.clearCache();
    }
  }

  private generateIconHash(icon: YotoPublicIcon): string {
    // Create a hash of key icon properties to detect changes
    const keyData = {
      mediaId: icon.mediaId,
      title: icon.title,
      publicTags: icon.publicTags,
    };
    return btoa(JSON.stringify(keyData));
  }

  private generateIconHashes(icons: YotoPublicIcon[]): string[] {
    return icons.map((icon) => this.generateIconHash(icon));
  }

  private isCacheValid(cachedData: CachedIconData): boolean {
    const now = Date.now();
    const cacheAge = now - cachedData.lastFetched;
    const maxAge = this.CACHE_EXPIRY_HOURS * 60 * 60 * 1000; // Convert hours to milliseconds

    return cacheAge < maxAge;
  }

  private hasIconsChanged(
    currentIcons: YotoPublicIcon[],
    cachedHashes: string[]
  ): boolean {
    const currentHashes = this.generateIconHashes(currentIcons);

    if (currentHashes.length !== cachedHashes.length) {
      return true;
    }

    return !currentHashes.every((hash, index) => hash === cachedHashes[index]);
  }

  getCachedIcons(): { icons: YotoPublicIcon[]; embeddings: number[][] } | null {
    try {
      const cachedDataStr = localStorage.getItem(this.CACHE_KEY);
      if (!cachedDataStr) {
        logger.info("No cached icon data found");
        return null;
      }

      const cachedData = JSON.parse(cachedDataStr) as CachedIconData;

      if (!this.isCacheValid(cachedData)) {
        logger.info("Cached icon data is expired");
        return null;
      }

      logger.info(`Loaded ${cachedData.icons.length} icons from cache`);
      return {
        icons: cachedData.icons,
        embeddings: cachedData.embeddings,
      };
    } catch (error) {
      logger.warn("Error getting cached icons:", error);
      return null;
    }
  }

  setCachedIcons(icons: YotoPublicIcon[], embeddings: number[][]): void {
    if (icons.length !== embeddings.length) {
      throw new Error("Icons and embeddings arrays must have the same length");
    }

    try {
      const iconHashes = this.generateIconHashes(icons);

      const cacheData: CachedIconData = {
        icons,
        embeddings,
        lastFetched: Date.now(),
        iconHashes,
      };

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      logger.info(`Cached ${icons.length} icons with embeddings`);
    } catch (error) {
      logger.error("Error caching icons:", error);
      // If localStorage is full, clear it and try again
      if (error instanceof Error && error.name === "QuotaExceededError") {
        this.clearCache();
        logger.warn("Cleared cache due to storage quota exceeded");
      }
      throw error;
    }
  }

  shouldRefreshCache(currentIcons?: YotoPublicIcon[]): boolean {
    try {
      const cachedDataStr = localStorage.getItem(this.CACHE_KEY);
      if (!cachedDataStr) {
        return true; // No cache exists
      }

      const cachedData = JSON.parse(cachedDataStr) as CachedIconData;

      if (!this.isCacheValid(cachedData)) {
        return true; // Cache is expired
      }

      if (
        currentIcons &&
        this.hasIconsChanged(currentIcons, cachedData.iconHashes)
      ) {
        logger.info("Icons have changed, cache refresh needed");
        return true; // Icons have changed
      }

      return false;
    } catch (error) {
      logger.warn("Error checking cache refresh:", error);
      return true; // Refresh on error
    }
  }

  clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
      logger.info("Icon cache cleared");
    } catch (error) {
      logger.warn("Error clearing cache:", error);
    }
  }

  getCacheStats(): {
    hasCache: boolean;
    lastFetched?: Date;
    iconCount?: number;
    isExpired?: boolean;
  } {
    try {
      const cachedDataStr = localStorage.getItem(this.CACHE_KEY);
      if (!cachedDataStr) {
        return { hasCache: false };
      }

      const cachedData = JSON.parse(cachedDataStr) as CachedIconData;

      return {
        hasCache: true,
        lastFetched: new Date(cachedData.lastFetched),
        iconCount: cachedData.icons.length,
        isExpired: !this.isCacheValid(cachedData),
      };
    } catch (error) {
      logger.warn("Error getting cache stats:", error);
      return { hasCache: false };
    }
  }

  // Method to get cached embeddings for specific icons (by mediaId)
  getCachedEmbeddingsForIcons(requestedIcons: YotoPublicIcon[]): {
    icons: YotoPublicIcon[];
    embeddings: number[][];
    missingIcons: YotoPublicIcon[];
  } | null {
    const cachedData = this.getCachedIcons();

    if (!cachedData) {
      return null;
    }

    const cachedIconMap = new Map<
      string,
      { icon: YotoPublicIcon; embedding: number[]; index: number }
    >();
    cachedData.icons.forEach((icon, index) => {
      cachedIconMap.set(icon.mediaId, {
        icon,
        embedding: cachedData.embeddings[index],
        index,
      });
    });

    const foundIcons: YotoPublicIcon[] = [];
    const foundEmbeddings: number[][] = [];
    const missingIcons: YotoPublicIcon[] = [];

    requestedIcons.forEach((requestedIcon) => {
      const cached = cachedIconMap.get(requestedIcon.mediaId);
      if (cached) {
        foundIcons.push(cached.icon);
        foundEmbeddings.push(cached.embedding);
      } else {
        missingIcons.push(requestedIcon);
      }
    });

    return {
      icons: foundIcons,
      embeddings: foundEmbeddings,
      missingIcons,
    };
  }
}