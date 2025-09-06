import { YotoHttpClient } from "./YotoHttpClient";
import { logger } from "./Logger";

export class IconFetcher {
  constructor(private httpClient: YotoHttpClient) {}

  async fetchIcons<T>(route: string): Promise<T[]> {
    logger.info(`Fetching icons from ${route}...`);
    try {
      const data = await this.httpClient.get(route, {
        headers: { "Content-Type": "application/json" },
      });
      const rawIcons = (data as any)?.displayIcons || [];
      logger.info(`Successfully fetched ${rawIcons.length} icons from ${route}`);
      return rawIcons as T[];
    } catch (error) {
      logger.error(`Error fetching icons from ${route}:`, error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch icons: ${error.message}`);
      }
      throw new Error("Failed to fetch icons due to an unknown error.");
    }
  }
}
