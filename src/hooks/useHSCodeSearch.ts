import { useState, useCallback, useEffect } from 'react';
import { ClientVectorSearch } from '../services/vectorSearch';
import { FallbackSearch } from '../services/fallbackSearch';
import { ApiKeyManager } from '../services/apiKeyManager';
import { EmbeddingProviderFactory } from '../services/embedding/EmbeddingProviderFactory';
import { useLanguage } from '../context/LanguageContext';
import { SearchResult } from '../types/hsCode';

/**
 * Hook for managing HS Code search with fallback
 */
export const useHSCodeSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'vector' | 'fallback'>('vector');
  const { language } = useLanguage();

  const vectorSearch = new ClientVectorSearch();
  const fallbackSearch = new FallbackSearch();

  const search = useCallback(async (
    query: string,
    providerKey: string,
    topK: number = 10
  ): Promise<SearchResult[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Try vector search first
      const provider = EmbeddingProviderFactory.getProvider(providerKey);
      if (!provider) {
        throw new Error(`Provider ${providerKey} not found`);
      }

      const apiKey = await ApiKeyManager.getApiKey(provider.name.toLowerCase());
      
      if (apiKey) {
        try {
          const results = await vectorSearch.search(query, provider, apiKey, topK);
          setSearchMode('vector');
          return results;
        } catch (vectorError) {
          console.warn('Vector search failed, falling back to keyword search:', vectorError);
          // Fall through to keyword search
        }
      }

      // Fallback to keyword search with language support
      await fallbackSearch.loadBasicData();
      const results = fallbackSearch.search(query, topK, language);
      setSearchMode('fallback');

      if (results.length === 0) {
        setError('No results found. Try different keywords.');
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      
      // Try fallback if vector search completely fails
      try {
        await fallbackSearch.loadBasicData();
        const results = fallbackSearch.search(query, topK, language);
        setSearchMode('fallback');
        return results;
      } catch (fallbackErr) {
        const fallbackMessage = fallbackErr instanceof Error ? fallbackErr.message : 'Fallback search failed';
        setError(`${errorMessage}. Fallback also failed: ${fallbackMessage}`);
        return [];
      }
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  return {
    search,
    isLoading,
    error,
    searchMode,
    setError
  };
};

/**
 * Hook for managing embedding providers
 */
export const useEmbeddingProviders = () => {
  const [providers, setProviders] = useState<Array<{
    key: string;
    name: string;
    model: string;
    dimensions: number;
    hasApiKey: boolean;
  }>>([]);

  useEffect(() => {
    const loadProviders = async () => {
      const providerMap = EmbeddingProviderFactory.getAllProviders();
      const providerList = [];

      for (const [key, provider] of providerMap.entries()) {
        const hasApiKey = await ApiKeyManager.hasApiKey(provider.name.toLowerCase());
        providerList.push({
          key,
          name: provider.name,
          model: provider.model,
          dimensions: provider.dimensions,
          hasApiKey
        });
      }

      setProviders(providerList);
    };

    loadProviders();
  }, []);

  const saveApiKey = async (providerName: string, apiKey: string) => {
    await ApiKeyManager.saveApiKey(providerName.toLowerCase(), apiKey);
    setProviders(prev => prev.map(p => ({
      ...p,
      hasApiKey: p.name.toLowerCase() === providerName.toLowerCase()
    })));
  };

  const removeApiKey = async (providerName: string) => {
    await ApiKeyManager.removeApiKey(providerName.toLowerCase());
    setProviders(prev => prev.map(p => ({
      ...p,
      hasApiKey: p.name.toLowerCase() === providerName.toLowerCase() ? false : p.hasApiKey
    })));
  };

  return {
    providers,
    saveApiKey,
    removeApiKey
  };
};