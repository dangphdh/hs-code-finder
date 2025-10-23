import { ElectronAPI } from '../types/electron';

/**
 * ElectronStorage service for persisting data in desktop app
 * Provides similar interface to localStorage but backed by filesystem
 */
export class ElectronStorage {
  private dataDir = 'storage';
  private electronAPI: ElectronAPI | null = null;

  constructor() {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      this.electronAPI = (window as any).electronAPI;
    }
  }

  private isElectron(): boolean {
    return this.electronAPI !== null;
  }

  /**
   * Store a key-value pair
   */
  async setItem(key: string, value: string): Promise<void> {
    if (!this.isElectron()) {
      localStorage.setItem(key, value);
      return;
    }

    try {
      const filePath = `${this.dataDir}/${this.sanitizeKey(key)}.json`;
      await this.electronAPI!.writeFile(filePath, JSON.stringify({ value }));
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve a value by key
   */
  async getItem(key: string): Promise<string | null> {
    if (!this.isElectron()) {
      return localStorage.getItem(key);
    }

    try {
      const filePath = `${this.dataDir}/${this.sanitizeKey(key)}.json`;
      const exists = await this.electronAPI!.fileExists(filePath);
      
      if (!exists) {
        return null;
      }

      const content = await this.electronAPI!.readFile(filePath);
      const { value } = JSON.parse(content);
      return value;
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove a key-value pair
   */
  async removeItem(key: string): Promise<void> {
    if (!this.isElectron()) {
      localStorage.removeItem(key);
      return;
    }

    try {
      const filePath = `${this.dataDir}/${this.sanitizeKey(key)}.json`;
      await this.electronAPI!.deleteFile(filePath);
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
    }
  }

  /**
   * Clear all stored data
   */
  async clear(): Promise<void> {
    if (!this.isElectron()) {
      localStorage.clear();
      return;
    }

    try {
      const files = await this.electronAPI!.listFiles(this.dataDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          await this.electronAPI!.deleteFile(`${this.dataDir}/${file}`);
        }
      }
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  /**
   * List all stored keys
   */
  async keys(): Promise<string[]> {
    if (!this.isElectron()) {
      return Object.keys(localStorage);
    }

    try {
      const files = await this.electronAPI!.listFiles(this.dataDir);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace(/\.json$/, ''));
    } catch (error) {
      console.error('Failed to list keys:', error);
      return [];
    }
  }

  /**
   * Get size of stored data
   */
  async getSize(): Promise<number> {
    if (!this.isElectron()) {
      let size = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          size += localStorage[key].length + key.length;
        }
      }
      return size;
    }

    try {
      const files = await this.electronAPI!.listFiles(this.dataDir);
      let totalSize = 0;

      for (const file of files) {
        if (file.endsWith('.json')) {
          const stats = await this.electronAPI!.getFileStats(`${this.dataDir}/${file}`);
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to get storage size:', error);
      return 0;
    }
  }

  /**
   * Bulk operations
   */
  async setMultiple(items: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(items)) {
      await this.setItem(key, value);
    }
  }

  async getMultiple(keys: string[]): Promise<Record<string, string | null>> {
    const result: Record<string, string | null> = {};
    for (const key of keys) {
      result[key] = await this.getItem(key);
    }
    return result;
  }

  /**
   * Store large data (e.g., embeddings)
   */
  async setLargeData(key: string, data: any): Promise<void> {
    const compressed = JSON.stringify(data);
    await this.setItem(key, compressed);
  }

  async getLargeData(key: string): Promise<any | null> {
    const data = await this.getItem(key);
    if (!data) return null;
    return JSON.parse(data);
  }

  private sanitizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9-_]/g, '_');
  }
}

export const electronStorage = new ElectronStorage();