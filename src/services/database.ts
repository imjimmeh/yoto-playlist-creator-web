import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Card } from '@/types/yoto/playlist';

interface PlaylistIndex {
  cards: Array<{
    cardId: string;
    title: string;
    updatedAt: string;
    [key: string]: unknown;
  }>;
  lastSynced: string;
}

interface YotoAppDB extends DBSchema {
  'playlist-index': {
    key: string;
    value: PlaylistIndex;
  };
  'playlist-details': {
    key: string;
    value: Card;
  };
}

const DB_NAME = 'yoto-app-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<YotoAppDB> | null = null;

export async function getDatabase(): Promise<IDBPDatabase<YotoAppDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<YotoAppDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('playlist-index')) {
        db.createObjectStore('playlist-index');
      }

      if (!db.objectStoreNames.contains('playlist-details')) {
        db.createObjectStore('playlist-details', {
          keyPath: 'cardId',
        });
      }
    },
  });

  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export type { PlaylistIndex, YotoAppDB };