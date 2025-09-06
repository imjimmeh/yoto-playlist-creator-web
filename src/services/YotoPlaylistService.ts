import { logger } from "./Logger";
import { YotoHttpClient } from "./YotoHttpClient";

export class YotoPlaylistService {
  private readonly httpClient: YotoHttpClient;

  constructor(httpClient: YotoHttpClient) {
    this.httpClient = httpClient;
  }

  get yotoClient(): YotoHttpClient {
    return this.httpClient;
  }

  async getPlaylistById(playlistId: string): Promise<unknown> {
    if (!playlistId) {
      throw new Error("Playlist ID is required");
    }

    logger.info(`Fetching playlist from Yoto API: ${playlistId}`);

    try {
      const playlist = await this.httpClient.get(`content/${playlistId}`, {
        headers: { "Content-Type": "application/json" },
      });
      logger.info("Successfully fetched playlist from Yoto API");
      logger.info(`Fetched playlist data:`, JSON.stringify(playlist, null, 2));

      return playlist;
    } catch (error) {
      logger.error(
        `Error fetching playlist ${playlistId} from Yoto API:`,
        error
      );
      if (error instanceof Error) {
        throw new Error(`Failed to fetch playlist: ${error.message}`);
      }
      throw new Error("Failed to fetch playlist due to an unknown error.");
    }
  }

  validatePlaylistId(playlistId: string): string {
    if (
      !playlistId ||
      typeof playlistId !== "string" ||
      playlistId.trim().length === 0
    ) {
      throw new Error("Invalid playlist ID");
    }
    return playlistId.trim();
  }

  async getPlaylists(): Promise<unknown> {
    logger.info("Fetching playlists from Yoto API");

    try {
      const playlists = await this.httpClient.get("content/mine");
      logger.info("Successfully fetched playlists from Yoto API");

      return (playlists as any).cards;
    } catch (error) {
      logger.error("Error fetching playlists from Yoto API:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch playlists: ${error.message}`);
      }
      throw new Error("Failed to fetch playlists due to an unknown error.");
    }
  }

  async savePlaylist(playlistData: { card: any }) {
    const card = playlistData.card;
    const isUpdate = !!card.cardId;

    logger.info(
      `${isUpdate ? "Updating" : "Creating"} playlist${
        isUpdate ? ": " + card.cardId : ""
      }`
    );

    // Create a deep copy to avoid mutating the original object
    const cardToSend = JSON.parse(JSON.stringify(card));

    // Sanitize display properties
    if (cardToSend.content && cardToSend.content.chapters) {
      for (const chapter of cardToSend.content.chapters) {
        if (chapter.display === null) {
          chapter.display = {};
        }
        if (chapter.tracks) {
          for (const track of chapter.tracks) {
            if (track.display === null) {
              track.display = {};
            }
          }
        }
      }
    }

    try {
      logger.info(`Sending playlist data to API:`, JSON.stringify(cardToSend, null, 2));
      const result = await this.httpClient.post("content", cardToSend);
      logger.info(`Successfully ${isUpdate ? "updated" : "created"} playlist`);
      logger.info(`API response:`, JSON.stringify(result, null, 2));

      return {
        success: true,
        data: result,
        isUpdate,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(
        `Error ${isUpdate ? "updating" : "creating"} playlist:`,
        error
      );
      if (error instanceof Error) {
        throw new Error(
          `Failed to ${isUpdate ? "update" : "create"} playlist: ${
            error.message
          }`
        );
      }
      throw new Error(
        `Failed to ${
          isUpdate ? "update" : "create"
        } playlist due to an unknown error.`
      );
    }
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    if (!playlistId) {
      throw new Error("Playlist ID is required");
    }

    logger.info(`Deleting playlist: ${playlistId}`);

    try {
      await this.httpClient.delete(`content/${playlistId}`);
      logger.info("Successfully deleted playlist");
    } catch (error) {
      logger.error(`Error deleting playlist ${playlistId}:`, error);
      if (error instanceof Error) {
        throw new Error(`Failed to delete playlist: ${error.message}`);
      }
      throw new Error("Failed to delete playlist due to an unknown error.");
    }
  }
}
