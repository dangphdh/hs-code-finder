import CryptoJS from 'crypto-js';
import { electronStorage } from './electronStorage';

/**
 * Manages API keys for embedding providers
 * Stores encrypted API keys in localStorage (web) or filesystem (Electron)
 * All methods are async to support both environments
 */
export class ApiKeyManager {
  private static readonly STORAGE_KEY = 'hs_code_api_keys';
  private static readonly ENCRYPTION_KEY = 'hs-code-finder-secure-key';

  /**
   * Save API key for a provider (encrypted)
   */
  static async saveApiKey(provider: string, apiKey: string): Promise<void> {
    try {
      const encrypted = CryptoJS.AES.encrypt(apiKey, this.ENCRYPTION_KEY).toString();
      const keys = await this.getAllKeys();
      keys[provider] = encrypted;
      await electronStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
    } catch (error) {
      console.error('Failed to save API key:', error);
      throw new Error('Failed to save API key securely');
    }
  }

  /**
   * Get API key for a provider (decrypted)
   */
  static async getApiKey(provider: string): Promise<string | null> {
    try {
      const keys = await this.getAllKeys();
      const encrypted = keys[provider];
      
      if (!encrypted) return null;
      
      const decrypted = CryptoJS.AES.decrypt(encrypted, this.ENCRYPTION_KEY);
      const apiKey = decrypted.toString(CryptoJS.enc.Utf8);
      
      return apiKey || null;
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      return null;
    }
  }

  /**
   * Remove API key for a provider
   */
  static async removeApiKey(provider: string): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      delete keys[provider];
      await electronStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
    } catch (error) {
      console.error('Failed to remove API key:', error);
      throw new Error('Failed to remove API key');
    }
  }

  /**
   * Get all providers that have saved API keys
   */
  static async getAllProviders(): Promise<string[]> {
    const keys = await this.getAllKeys();
    return Object.keys(keys);
  }

  /**
   * Check if API key exists for a provider
   */
  static async hasApiKey(provider: string): Promise<boolean> {
    const apiKey = await this.getApiKey(provider);
    return apiKey !== null;
  }

  /**
   * Clear all saved API keys
   */
  static async clearAll(): Promise<void> {
    try {
      await electronStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear API keys:', error);
      throw new Error('Failed to clear API keys');
    }
  }

  /**
   * Get all stored API keys (encrypted)
   * Note: In Electron environment, reads from storage, in web from merged localStorage
   */
  private static async getAllKeys(): Promise<Record<string, string>> {
    try {
      const stored = await electronStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load API keys:', error);
      return {};
    }
  }
}