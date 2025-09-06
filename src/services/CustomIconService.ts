import { YotoHttpClient } from "./YotoHttpClient";
import { logger } from "./Logger";
import { IconFetcher } from "./IconFetcher";
import { YotoUserIcon } from "../types/yoto-api";
import type { CustomIconMetadata } from "../types/icon-metadata";

// Interface for the custom icon object used within the application
export interface CustomIcon {
  id: string; // displayIconId
  mediaId: string;
  title: string; // No title from API, so we'll use the filename or a default
  imageUrl: string;
  uploadedAt: string;
  tags?: string[];
}

export class CustomIconService {
  private readonly iconFetcher: IconFetcher;
  private readonly getIconsRoute = "/media/displayIcons/user/me";
  private readonly METADATA_STORAGE_KEY = "yoto-custom-icon-metadata";

  constructor(private yotoClient: YotoHttpClient) {
    this.iconFetcher = new IconFetcher(yotoClient);
  }

  private getMetadataStorageKey(): string {
    return this.METADATA_STORAGE_KEY;
  }

  private loadMetadata(): Map<string, CustomIconMetadata> {
    try {
      const metadataStr = localStorage.getItem(this.getMetadataStorageKey());
      if (metadataStr) {
        const metadataArray: CustomIconMetadata[] = JSON.parse(metadataStr);
        return new Map(metadataArray.map(item => [item.id, item]));
      }
    } catch (error) {
      logger.warn("Error loading custom icon metadata:", error);
    }
    return new Map();
  }

  private saveMetadata(metadataMap: Map<string, CustomIconMetadata>): void {
    try {
      const metadataArray = Array.from(metadataMap.values());
      localStorage.setItem(this.getMetadataStorageKey(), JSON.stringify(metadataArray));
    } catch (error) {
      logger.error("Error saving custom icon metadata:", error);
    }
  }

  async getCustomIcons(): Promise<CustomIcon[]> {
    try {
      const rawIcons = await this.iconFetcher.fetchIcons<YotoUserIcon>(
        this.getIconsRoute
      );

      // Load metadata
      const metadataMap = this.loadMetadata();

      const icons = rawIcons.map((icon) => {
        const metadata = metadataMap.get(icon.displayIconId);
        return {
          id: icon.displayIconId,
          mediaId: icon.mediaId,
          title: metadata?.title || `Icon ${icon.displayIconId}`,
          imageUrl: icon.url,
          uploadedAt: icon.createdAt,
          tags: metadata?.tags || [],
        };
      });

      return icons.sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
    } catch (error) {
      logger.error("Failed to fetch custom icons:", error);
      return [];
    }
  }

  async uploadCustomIcon(file: File, title?: string): Promise<CustomIcon> {
    const filename = title || file.name.replace(/\.[^/.]+$/, "");
    const url = `/media/displayIcons/user/me/upload?filename=${encodeURIComponent(
      filename
    )}&autoConvert=true`;

    try {
      const response = (await this.yotoClient.post(url, file, {
        bodyType: "binary",
        headers: {
          "Content-Type": file.type,
        },
      })) as { displayIcon: YotoUserIcon & { new?: boolean } };

      const newIcon = response.displayIcon;

      // Create and save initial metadata
      const metadata: CustomIconMetadata = {
        id: newIcon.displayIconId,
        title: filename,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const metadataMap = this.loadMetadata();
      metadataMap.set(newIcon.displayIconId, metadata);
      this.saveMetadata(metadataMap);

      return {
        id: newIcon.displayIconId,
        mediaId: newIcon.mediaId,
        title: filename,
        imageUrl: newIcon.url,
        uploadedAt: newIcon.createdAt || new Date().toISOString(),
        tags: [],
      };
    } catch (error) {
      logger.error("Failed to upload custom icon:", error);
      throw new Error("Failed to upload custom icon.");
    }
  }

  async updateCustomIcon(icon: CustomIcon, updates: Partial<Pick<CustomIcon, 'title' | 'tags'>>): Promise<CustomIcon | null> {
    try {
      // Load existing metadata
      const metadataMap = this.loadMetadata();
      let metadata = metadataMap.get(icon.id);

      // Create metadata if it doesn't exist
      if (!metadata) {
        metadata = {
          id: icon.id,
          title: icon.title,
          tags: icon.tags || [],
          createdAt: icon.uploadedAt,
          updatedAt: new Date().toISOString(),
        };
      }

      // Apply updates
      if (updates.title !== undefined) {
        metadata.title = updates.title;
      }
      
      if (updates.tags !== undefined) {
        metadata.tags = updates.tags;
      }
      
      metadata.updatedAt = new Date().toISOString();

      // Save updated metadata
      metadataMap.set(icon.id, metadata);
      this.saveMetadata(metadataMap);

      logger.info(`Updating custom icon ${icon.id} with title: ${metadata.title} and tags: ${metadata.tags.join(', ')}`);
      
      // Return the updated icon with new metadata
      const updatedIcon = {
        ...icon,
        ...updates,
      };

      logger.info(`Successfully updated custom icon ${icon.id} locally`);
      return updatedIcon;
    } catch (error) {
      logger.error(`Failed to update custom icon ${icon.id}:`, error);
      return null;
    }
  }

  async deleteCustomIcon(iconId: string): Promise<boolean> {
    logger.error(`Delete operation not supported: The Yoto API doesn't provide a delete endpoint for custom icons (${iconId})`);
    return false;
  }

  // Convert custom icons to the format expected by YotoIconService
  async getCustomIconsAsYotoIcons(): Promise<
    Array<{
      mediaId: string;
      title: string;
      imageUrl?: string;
      tags?: string[];
    }>
  > {
    const icons = await this.getCustomIcons();
    return icons.map((icon) => ({
      mediaId: icon.mediaId,
      title: icon.title,
      imageUrl: icon.imageUrl,
      tags: icon.tags,
    }));
  }
}
