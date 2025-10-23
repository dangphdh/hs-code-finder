import CryptoJS from 'crypto-js';

/**
 * Manages API keys for embedding providers
 * Stores encrypted API keys in localStorage
 */
export class ApiKeyManager {
  private static readonly STORAGE_KEY = 'hs_code_api_keys';
  private static readonly ENCRYPTION_KEY = 'hs-code-finder-secure-key';

  /**
   * Save API key for a provider (encrypted)
   */
  static saveApiKey(provider: string, apiKey: string): void {
    try {
      const encrypted = CryptoJS.AES.encrypt(apiKey, this.ENCRYPTION_KEY).toString();
      const keys = this.getAllKeys();
      keys[provider] = encrypted;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
    } catch (error) {
      console.error('Failed to save API key:', error);
      throw new Error('Failed to save API key securely');
    }
  }

  /**
   * Get API key for a provider (decrypted)
   */
  static getApiKey(provider: string): string | null {
    try {
      const keys = this.getAllKeys();
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
  static removeApiKey(provider: string): void {
    try {
      const keys = this.getAllKeys();
      delete keys[provider];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
    } catch (error) {
      console.error('Failed to remove API key:', error);
      throw new Error('Failed to remove API key');
    }
  }

  /**
   * Get all providers that have saved API keys
   */
  static getAllProviders(): string[] {
    return Object.keys(this.getAllKeys());
  }

  /**
   * Check if API key exists for a provider
   */
  static hasApiKey(provider: string): boolean {
    return this.getApiKey(provider) !== null;
  }

  /**
   * Clear all saved API keys
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear API keys:', error);
      throw new Error('Failed to clear API keys');
    }
  }

  /**
   * Get all stored API keys (encrypted)
   */
  private static getAllKeys(): Record<string, string> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load API keys:', error);
      return {};
    }
  }
}