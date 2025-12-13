import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { PageSchema } from '../types/schema';

interface LowCodeDB extends DBSchema {
  projects: {
    key: string;
    value: PageSchema;
  };
}

const DB_NAME = 'lowcode-db';
const STORE_NAME = 'projects';
const PROJECT_ID = 'current-project'; // 目前只支持单工程，写死ID

class ProjectStorage {
  private dbPromise: Promise<IDBPDatabase<LowCodeDB>>;

  constructor() {
    this.dbPromise = openDB<LowCodeDB>(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }

  async saveProject(page: PageSchema): Promise<void> {
    const db = await this.dbPromise;
    await db.put(STORE_NAME, page, PROJECT_ID);
    console.log('[AutoSave] Project saved to IndexedDB', new Date().toLocaleTimeString());
  }

  async loadProject(): Promise<PageSchema | undefined> {
    const db = await this.dbPromise;
    return await db.get(STORE_NAME, PROJECT_ID);
  }

  async clearProject(): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(STORE_NAME, PROJECT_ID);
  }
}

export const projectStorage = new ProjectStorage();

