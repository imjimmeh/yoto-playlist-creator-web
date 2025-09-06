import { logger } from "./Logger";
import { YotoHttpClient } from "./YotoHttpClient";

export class YotoCoverImageService {
  private readonly httpClient: YotoHttpClient;

  constructor(httpClient: YotoHttpClient) {
    this.httpClient = httpClient;
  }

  async uploadCoverImage(
    imageFile: File
  ): Promise<{ mediaId: string; mediaUrl: string }> {
    if (!imageFile) {
      throw new Error("Image file is required");
    }

    // Determine content type from file
    let contentType = imageFile.type || "image/jpeg"; // Use file.type or default

    // Validate supported image types
    if (!contentType.startsWith("image/")) {
      // Fallback: determine from filename extension
      const ext = imageFile.name.toLowerCase().split(".").pop();
      switch (ext) {
        case "png":
          contentType = "image/png";
          break;
        case "gif":
          contentType = "image/gif";
          break;
        case "jpg":
        case "jpeg":
          contentType = "image/jpeg";
          break;
        default:
          contentType = "image/jpeg";
      }
    }

    logger.info(`Uploading cover image: ${imageFile.name}`);

    try {
      // Convert File to Uint8Array
      const buffer = await imageFile.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      const result = await this.httpClient.post(
        "media/coverImage/user/me/upload?coverType=default",
        uint8Array,
        {
          bodyType: "binary",
          headers: { "Content-Type": contentType },
        }
      );
      logger.info("Successfully uploaded cover image");

      return {
        mediaId: (result as any).coverImage.mediaId,
        mediaUrl: (result as any).coverImage.mediaUrl,
      };
    } catch (error) {
      logger.error(`Error uploading cover image:`, error);
      if (error instanceof Error) {
        throw new Error(`Failed to upload cover image: ${error.message}`);
      }
      throw new Error("Failed to upload cover image due to an unknown error.");
    }
  }
}
