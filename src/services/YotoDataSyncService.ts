import { getDatabase, PlaylistIndex } from './database';
import { Card } from '@/types/yoto/playlist';
import { YotoHttpClient } from './YotoHttpClient';
import { logger } from './Logger';

interface DataSyncEvents {
  'sync-complete': (playlists: Card[]) => void;
  'sync-error': (error: Error) => void;
  'sync-started': () => void;
}

interface PlaylistIndexItem {
  cardId: string;
  title: string;
  updatedAt: string;
  [key: string]: unknown;
}

export class YotoDataSyncService {
  private readonly httpClient: YotoHttpClient;
  private readonly listeners = new Map<keyof DataSyncEvents, unknown[]>();
  private isSyncing = false;

  constructor(httpClient: YotoHttpClient) {
    this.httpClient = httpClient;
  }

  private emit<E extends keyof DataSyncEvents>(
    event: E,
    ...args: Parameters<DataSyncEvents[E]>
  ): void {
    const eventListeners = this.listeners.get(event) || [];
    logger.info(
      `YotoDataSyncService emitting '${event}' to ${eventListeners.length} listeners`
    );
    for (const listener of eventListeners) {
      (listener as (...args: unknown[]) => void)(...args);
    }
  }

  on<E extends keyof DataSyncEvents>(
    event: E,
    listener: DataSyncEvents[E]
  ): () => void {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.push(listener as unknown);
    this.listeners.set(event, eventListeners);
    logger.info(
      `YotoDataSyncService: Added listener for '${event}', total listeners: ${eventListeners.length}`
    );

    return () => {
      const currentListeners = this.listeners.get(event) || [];
      const index = currentListeners.indexOf(listener as unknown);
      if (index > -1) {
        currentListeners.splice(index, 1);
        this.listeners.set(event, currentListeners);
        logger.info(
          `YotoDataSyncService: Removed listener for '${event}', remaining listeners: ${currentListeners.length}`
        );
      }
    };
  }

  private async getPlaylistIndex(): Promise<PlaylistIndex | null> {
    try {
      const db = await getDatabase();
      const result = await db.get('playlist-index', 'main');
      return result || null;
    } catch (error) {
      logger.error('Error getting playlist index from database:', error);
      return null;
    }
  }

  private async setPlaylistIndex(playlists: PlaylistIndexItem[]): Promise<void> {
    try {
      const db = await getDatabase();
      const indexData: PlaylistIndex = {
        cards: playlists,
        lastSynced: new Date().toISOString(),
      };
      await db.put('playlist-index', indexData, 'main');
      logger.info('Playlist index saved to database');
    } catch (error) {
      logger.error('Error saving playlist index to database:', error);
      throw error;
    }
  }


  private async setPlaylistDetails(playlist: Card): Promise<void> {
    if (!playlist.cardId) {
      logger.error('Cannot save playlist details: cardId is missing', playlist);
      throw new Error('Playlist cardId is required for saving');
    }

    try {
      const db = await getDatabase();
      await db.put('playlist-details', playlist);
      logger.info(`Playlist details saved for ${playlist.cardId}`);
    } catch (error) {
      logger.error(`Error saving playlist details for ${playlist.cardId}:`, error);
      throw error;
    }
  }

  private async removePlaylistDetails(cardId: string): Promise<void> {
    try {
      const db = await getDatabase();
      await db.delete('playlist-details', cardId);
      logger.info(`Playlist details removed for ${cardId}`);
    } catch (error) {
      logger.error(`Error removing playlist details for ${cardId}:`, error);
      throw error;
    }
  }

  async getAllPlaylistDetails(): Promise<Card[]> {
    try {
      const db = await getDatabase();
      return await db.getAll('playlist-details');
    } catch (error) {
      logger.error('Error getting all playlist details:', error);
      return [];
    }
  }

  async syncPlaylists(): Promise<void> {
    if (this.isSyncing) {
      logger.info('Sync already in progress, skipping');
      return;
    }

    this.isSyncing = true;
    this.emit('sync-started');

    try {
      logger.info('Starting playlist sync');

      // Step 1: Fetch fresh playlist index from API
      const freshIndexResponse = await this.httpClient.get('content/mine');
      const freshIndex = (freshIndexResponse as any).cards as PlaylistIndexItem[];

      // Step 2: Load cached playlist index
      const cachedIndex = await this.getPlaylistIndex();
      const cachedCards = cachedIndex?.cards || [];

      // Step 3: Compare indexes to identify changes
      const { newPlaylists, updatedPlaylists, deletedPlaylists } = this.compareIndexes(
        freshIndex,
        cachedCards
      );

      logger.info(`Sync analysis: ${newPlaylists.length} new, ${updatedPlaylists.length} updated, ${deletedPlaylists.length} deleted`);

      // Step 4: Batch-fetch details for new and updated playlists
      const playlistsToFetch = [...newPlaylists, ...updatedPlaylists];
      const fetchPromises = playlistsToFetch.map(async (playlist) => {
        try {
          const response = await this.httpClient.get(`content/${playlist.cardId}`);
          logger.info(`Raw API response for ${playlist.cardId}:`, response);
          
          // The API might return the data in a wrapper object
          let details: Card;
          if (response && typeof response === 'object' && 'card' in response) {
            details = (response as any).card as Card;
          } else {
            details = response as Card;
          }
          
          // Ensure the cardId is present
          if (!details.cardId) {
            details.cardId = playlist.cardId;
          }
          
          logger.info(`Processed playlist details for ${playlist.cardId}, cardId: ${details.cardId}`);
          return { success: true, cardId: playlist.cardId, data: details };
        } catch (error) {
          logger.error(`Failed to fetch details for playlist ${playlist.cardId}:`, error);
          return { success: false, cardId: playlist.cardId, error };
        }
      });

      const fetchResults = await Promise.allSettled(fetchPromises);

      // Step 5: Update database with fetched details
      for (const result of fetchResults) {
        if (result.status === 'fulfilled' && result.value.success && result.value.data) {
          await this.setPlaylistDetails(result.value.data);
        }
      }

      // Step 6: Remove deleted playlists
      for (const deletedPlaylist of deletedPlaylists) {
        await this.removePlaylistDetails(deletedPlaylist.cardId);
      }

      // Step 7: Save fresh index
      await this.setPlaylistIndex(freshIndex);

      // Step 8: Get all current playlists and emit sync-complete event
      const allPlaylists = await this.getAllPlaylistDetails();
      this.emit('sync-complete', allPlaylists);

      logger.info(`Sync completed successfully. Total playlists: ${allPlaylists.length}`);
    } catch (error) {
      logger.error('Sync failed:', error);
      this.emit('sync-error', error instanceof Error ? error : new Error('Unknown sync error'));
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  private compareIndexes(
    freshIndex: PlaylistIndexItem[],
    cachedIndex: PlaylistIndexItem[]
  ): {
    newPlaylists: PlaylistIndexItem[];
    updatedPlaylists: PlaylistIndexItem[];
    deletedPlaylists: PlaylistIndexItem[];
  } {
    const cachedMap = new Map(cachedIndex.map(item => [item.cardId, item]));
    const freshMap = new Map(freshIndex.map(item => [item.cardId, item]));

    const newPlaylists: PlaylistIndexItem[] = [];
    const updatedPlaylists: PlaylistIndexItem[] = [];

    // Find new and updated playlists
    for (const freshPlaylist of freshIndex) {
      const cachedPlaylist = cachedMap.get(freshPlaylist.cardId);
      if (!cachedPlaylist) {
        newPlaylists.push(freshPlaylist);
      } else if (freshPlaylist.updatedAt !== cachedPlaylist.updatedAt) {
        updatedPlaylists.push(freshPlaylist);
      }
    }

    // Find deleted playlists
    const deletedPlaylists = cachedIndex.filter(
      cachedPlaylist => !freshMap.has(cachedPlaylist.cardId)
    );

    return { newPlaylists, updatedPlaylists, deletedPlaylists };
  }

  async clearCache(): Promise<void> {
    try {
      const db = await getDatabase();
      
      // Clear playlist index
      await db.delete('playlist-index', 'main');
      
      // Clear all playlist details
      const allKeys = await db.getAllKeys('playlist-details');
      for (const key of allKeys) {
        await db.delete('playlist-details', key);
      }
      
      logger.info('Cache cleared successfully');
    } catch (error) {
      logger.error('Error clearing cache:', error);
      throw error;
    }
  }

  get isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }
}