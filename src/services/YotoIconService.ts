import { logger } from "./Logger";
import { YotoCacheService } from "./YotoCacheService";
import { YotoHttpClient } from "./YotoHttpClient";
import { IconFetcher } from "./IconFetcher";
import { YotoPublicIcon } from "../types/yoto-api";

export class YotoIconService {
  private readonly getIconsRoute = "media/displayIcons/user/yoto";
  private readonly cacheService: YotoCacheService;
  private readonly iconFetcher: IconFetcher;

  constructor(httpClient: YotoHttpClient) {
    this.iconFetcher = new IconFetcher(httpClient);
    this.cacheService = new YotoCacheService();
  }

  async getIcons(forceRefresh = false): Promise<YotoPublicIcon[]> {
    // Check cache first unless forced refresh
    if (!forceRefresh) {
      const cached = this.cacheService.getCachedIcons();
      if (cached) {
        logger.info(`Using cached icons (${cached.icons.length} icons)`);
        return cached.icons;
      }
    }

    const icons = await this.iconFetcher.fetchIcons<YotoPublicIcon>(
      this.getIconsRoute
    );

    logger.info(`Successfully fetched ${icons.length} icons from API`);

    // Note: Icons are cached with embeddings in the HybridIconMapper
    // This method only returns the icons for caching the raw icon data
    return icons;
  }

  getCacheStats() {
    return this.cacheService.getCacheStats();
  }

  clearCache(): void {
    this.cacheService.clearCache();
  }
}
