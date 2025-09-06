import type { YotoPublicIcon } from "../types/yoto-api";
import { YotoCacheService } from "./YotoCacheService";
import { CustomIconService } from "./CustomIconService";
import { YotoHttpClient } from "./YotoHttpClient";
import { logger } from "./Logger";

export interface AiConfig {
  apiKey?: string;
  baseUrl?: string;
  embeddingModel?: string;
  chatModel?: string;
  batchSize?: number;
}

export class HybridIconMapper {
  private readonly embeddingModel: string =
    "mixedbread-ai/mxbai-embed-xsmall-v1";
  private readonly chatModel: string = "openai/gpt-oss-20b";
  private readonly batchSize: number = 50;
  private readonly config: AiConfig;
  private readonly cacheService: YotoCacheService;
  private readonly yotoClient: YotoHttpClient;

  constructor(yotoClient: YotoHttpClient, config?: AiConfig) {
    this.yotoClient = yotoClient;
    this.config = config || {};
    this.embeddingModel = config?.embeddingModel || this.embeddingModel;
    this.chatModel = config?.chatModel || this.chatModel;
    this.batchSize = config?.batchSize || this.batchSize;
    this.cacheService = new YotoCacheService();
  }

  private async combineIconsWithCustom(yotoIcons: YotoPublicIcon[]): Promise<YotoPublicIcon[]> {
    const customIconService = new CustomIconService(this.yotoClient);
    const customIcons = await customIconService.getCustomIconsAsYotoIcons();

    // Convert custom icons to YotoPublicIcon format and add them at the beginning
    // so they have priority in icon selection
    const customAsYotoIcons: YotoPublicIcon[] = customIcons.map((customIcon) => ({
      mediaId: customIcon.mediaId,
      title: customIcon.title,
      publicTags: customIcon.tags || [],
    }));

    return [...customAsYotoIcons, ...yotoIcons];
  }

  validateForMapping(): void {
    if (!this.config.baseUrl) {
      throw new Error(
        "AI configuration (baseUrl) is required for icon mapping. Please configure it in Settings."
      );
    }
    if (!this.config.apiKey) {
      throw new Error(
        "AI API key is required for icon mapping. Please configure it in Settings."
      );
    }
  }

  private async testApiConnection(): Promise<void> {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const testResponse = await fetch(`${this.config.baseUrl}/models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!testResponse.ok) {
        throw new Error(
          `API endpoint test failed: ${testResponse.status} ${testResponse.statusText}`
        );
      }

      logger.info("AI API connection test successful");
    } catch (error) {
      logger.error("AI API connection test failed:", error);
      throw new Error(
        `AI API is not available. Please check your connection and try again. Error: ${
          (error as Error).message
        }`
      );
    }
  }

  private cleanTrackTitle(title: string): string {
    if (title.includes(" - ")) {
      return title.split(" - ")[1].trim();
    }
    return title;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return -1;

    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

    if (magnitudeA === 0 || magnitudeB === 0) return -1;

    return dotProduct / (magnitudeA * magnitudeB);
  }

  private createIconText(icon: YotoPublicIcon): string {
    const tags = icon.publicTags ? icon.publicTags.join(" ") : "";
    return `${icon.title} ${tags}`.trim();
  }

  private async createEmbeddingsInBatches(
    texts: string[],
    description: string
  ): Promise<number[][]> {
    logger.info(`Creating embeddings for ${texts.length} ${description}...`);
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      logger.info(
        `Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(
          texts.length / this.batchSize
        )}`,
        this.config.baseUrl
      );

      const response = await fetch(`${this.config.baseUrl}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ model: this.embeddingModel, input: batch }),
      });

      if (!response.ok) {
        logger.error(
          `API Error Response: ${response.status} ${response.statusText}. Base URL: ${this.config.baseUrl}`
        );
        throw new Error(
          `Embedding API error: ${response.status} ${response.statusText}`
        );
      }

      const rawResponse = await response.json();
      const embeddings = rawResponse.data.map((d: any) => d.embedding);
      allEmbeddings.push(...embeddings);
    }
    return allEmbeddings;
  }

  async mapIcons(
    card: any,
    icons: YotoPublicIcon[],
    topXIcons = 100,
    progressCallback?: (progress: any) => void,
    savePlaylistCallback?: (updatedCard: any, trackInfo?: { chapterKey: string; iconRef: string }) => Promise<void>
  ) {
    this.validateForMapping();

    // Test API connection before starting
    progressCallback?.({
      status: "Testing AI API connection...",
      current: undefined,
      total: undefined,
    });
    await this.testApiConnection();

    // Combine Yoto icons with custom icons (custom icons get priority)
    const allIcons = await this.combineIconsWithCustom(icons);

    const chapters = card.card.content.chapters.map((ch: any) => ({
      ...ch,
      title: this.cleanTrackTitle(ch.title),
    }));
    const iconTexts = allIcons.map((icon) => this.createIconText(icon));
    const trackTitles = chapters.map((ch: any) => ch.title);

    // Try to get cached icon embeddings
    let iconEmbeddings: number[][];
    const shouldRefresh = this.cacheService.shouldRefreshCache(allIcons);

    if (shouldRefresh) {
      logger.info("Creating new icon embeddings...");
      iconEmbeddings = await this.createEmbeddingsInBatches(iconTexts, "icons");
      // Cache the icons with their embeddings
      this.cacheService.setCachedIcons(allIcons, iconEmbeddings);
    } else {
      logger.info("Using cached icon embeddings...");
      const cached = this.cacheService.getCachedIcons();
      if (cached && cached.icons.length === allIcons.length) {
        iconEmbeddings = cached.embeddings;
      } else {
        // Fallback: create embeddings if cache mismatch
        logger.info("Cache mismatch, creating new embeddings...");
        iconEmbeddings = await this.createEmbeddingsInBatches(
          iconTexts,
          "icons"
        );
        this.cacheService.setCachedIcons(allIcons, iconEmbeddings);
      }
    }

    // Track titles always need fresh embeddings (they're unique per playlist)
    const trackEmbeddings = await this.createEmbeddingsInBatches(
      trackTitles,
      "track titles"
    );

    const mappedChapters = [];
    let failedMappings = 0;

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const trackEmbedding = trackEmbeddings[i];

      progressCallback?.({
        status: `Mapping icons: processing track ${i + 1} of ${
          chapters.length
        }`,
        current: i + 1,
        total: chapters.length,
        fileName: `"${chapter.title}"`,
      });

      const similarities = iconEmbeddings.map((iconEmbedding, j) => ({
        icon: allIcons[j],
        similarity: this.cosineSimilarity(trackEmbedding, iconEmbedding),
      }));

      const topIcons = [...similarities]
        .sort((a: any, b: any) => b.similarity - a.similarity)
        .slice(0, topXIcons);

      try {
        const selectedIcon = await this.selectBestIcon(
          chapter.title,
          topIcons.map((s: any) => s.icon)
        );
        mappedChapters.push({ ...chapter, mediaId: selectedIcon.mediaId });

        // Save playlist after each icon assignment if callback is provided
        if (savePlaylistCallback) {
          try {
            const updatedCard = await this.updateCardIcons(card, mappedChapters);
            const trackInfo = {
              chapterKey: chapter.key,
              iconRef: `yoto:#${selectedIcon.mediaId}`
            };
            await savePlaylistCallback(updatedCard, trackInfo);
            logger.info(`Playlist saved after mapping icon for track "${chapter.title}"`);
          } catch (saveError) {
            logger.error(`Failed to save playlist after mapping icon for "${chapter.title}":`, saveError);
            // Continue with the process even if save fails
          }
        }

        // Add small delay between AI API calls to avoid overwhelming the endpoint
        if (i < chapters.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
        }
      } catch (error) {
        logger.error(
          `Failed to map icon for chapter "${chapter.title}":`,
          error
        );
        failedMappings++;
        // Use fallback icon on error
        const fallbackChapter = { ...chapter, mediaId: topIcons[0].icon.mediaId };
        mappedChapters.push(fallbackChapter);

        // Save playlist with fallback icon if callback is provided
        if (savePlaylistCallback) {
          try {
            const updatedCard = await this.updateCardIcons(card, mappedChapters);
            const trackInfo = {
              chapterKey: chapter.key,
              iconRef: `yoto:#${topIcons[0].icon.mediaId}`
            };
            await savePlaylistCallback(updatedCard, trackInfo);
            logger.info(`Playlist saved after fallback icon assignment for track "${chapter.title}"`);
          } catch (saveError) {
            logger.error(`Failed to save playlist after fallback icon for "${chapter.title}":`, saveError);
          }
        }
      }
    }

    // Report any failures
    if (failedMappings > 0) {
      const failureMessage = `Warning: ${failedMappings} out of ${chapters.length} icon mappings failed and used fallback icons.`;
      logger.warn(failureMessage);
      progressCallback?.({
        status: failureMessage,
        current: chapters.length,
        total: chapters.length,
        warning: true,
      });
    }

    return await this.updateCardIcons(card, mappedChapters);
  }

  private async selectBestIcon(
    chapterTitle: string,
    topIcons: YotoPublicIcon[]
  ): Promise<YotoPublicIcon> {
    const systemPrompt = `**Task**: Icon Matching for Song Titles

You will be given:
1. A song title
2. A list of icon candidates showing the title and tags of each icon

**Your job**: Return the exact 'title' of the icon that best matches the song title.

**Instructions**:
- Analyze the song title for key themes, objects, emotions, or concepts
- Compare against both the 'title' and 'tags' of each icon
- Look for direct matches first (e.g., "bus" in song title → icon with "bus" tag)
- Consider metaphorical or thematic connections (e.g., love songs → heart icons)
- Prioritize icons that match multiple aspects of the song
- If multiple icons seem equally relevant, choose the most specific/direct match

**Response format**: Return only the exact icon 'title' string, nothing else.

**If no suitable match exists**: Return the 'title' of the most generic or closest thematically related icon from the available options.`;

    const iconCandidates = topIcons.map((icon) => ({
      title: icon.title,
      tags: icon.publicTags || [],
    }));
    const userPrompt = `Song title: "${chapterTitle}"
Icons: ${JSON.stringify(iconCandidates, null, 2)}
Response:`;

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.chatModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        logger.error(
          `API Error Response: ${response.status} ${response.statusText}. Base URL: ${this.config.baseUrl}`
        );
        throw new Error(
          `Chat API error: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      const selectedTitle = result.choices[0].message.content
        .trim()
        .replaceAll('"', "")
        .replaceAll("'", "")
        .trim();

      const selectedIcon = topIcons.find(
        (icon) => icon.title === selectedTitle
      );

      if (selectedIcon) {
        return selectedIcon;
      } else {
        logger.info(
          `⚠ AI returned invalid title: "${selectedTitle}", using highest similarity as fallback`
        );
        return topIcons[0]; // Fallback to highest similarity
      }
    } catch (error) {
      logger.error(`Error with AI selection for "${chapterTitle}":`, error);
      // Provide more detailed error information
      if (error instanceof Error) {
        if (error.message.includes("404")) {
          throw new Error(
            `AI API endpoint not found (404). Check your AI configuration in Settings.`
          );
        } else if (error.message.includes("401")) {
          throw new Error(
            `AI API authentication failed (401). Check your API key in Settings.`
          );
        } else if (error.message.includes("timeout")) {
          throw new Error(
            `AI API request timed out. The service may be overloaded.`
          );
        }
      }
      throw error; // Re-throw to be handled by the calling code
    }
  }

  private async updateCardIcons(originalCard: any, mappedChapters: any[]) {
    const iconMap = new Map(mappedChapters.map((c) => [c.key, c.mediaId]));
    originalCard.card.content.chapters.forEach((chapter: any) => {
      const newMediaId = iconMap.get(chapter.key);
      if (newMediaId) {
        // Use the mediaId format for all icons (custom and regular)
        const newIconId = `yoto:#${newMediaId}`;

        chapter.display = { ...chapter.display, icon16x16: newIconId };
        chapter.tracks.forEach((track: any) => {
          track.display = { ...track.display, icon16x16: newIconId };
        });
      }
    });
    return originalCard;
  }
}
