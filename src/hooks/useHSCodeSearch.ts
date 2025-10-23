import { useState, useCallback, useEffect } from 'react';
import { ClientVectorSearch } from '../services/vectorSearch';
import { FallbackSearch } from '../services/fallbackSearch';
import { ApiKeyManager } from '../services/apiKeyManager';
import { EmbeddingProviderFactory } from '../services/embedding/EmbeddingProviderFactory';
import { SearchResult } from '../types/hsCode';

/**
 * Hook for managing HS Code search with fallback
 */
export const useHSCodeSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'vector' | 'fallback'>('vector');

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

      const apiKey = ApiKeyManager.getApiKey(provider.name.toLowerCase());
      
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

      // Fallback to keyword search
      await fallbackSearch.loadBasicData();
      const results = fallbackSearch.search(query, topK);
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
        const results = fallbackSearch.search(query, topK);
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
  }, []);

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
    const loadProviders = () => {
      const providerMap = EmbeddingProviderFactory.getAllProviders();
      const providerList = Array.from(providerMap.entries()).map(([key, provider]) => ({
        key,
        name: provider.name,
        model: provider.model,
        dimensions: provider.dimensions,
        hasApiKey: ApiKeyManager.hasApiKey(provider.name.toLowerCase())
      }));
      setProviders(providerList);
    };

    loadProviders();
  }, []);

  const saveApiKey = (providerName: string, apiKey: string) => {
    ApiKeyManager.saveApiKey(providerName.toLowerCase(), apiKey);
    setProviders(prev => prev.map(p => ({
      ...p,
      hasApiKey: ApiKeyManager.hasApiKey(p.name.toLowerCase())
    })));
  };

  const removeApiKey = (providerName: string) => {
    ApiKeyManager.removeApiKey(providerName.toLowerCase());
    setProviders(prev => prev.map(p => ({
      ...p,
      hasApiKey: ApiKeyManager.hasApiKey(p.name.toLowerCase())
    })));
  };

  return {
    providers,
    saveApiKey,
    removeApiKey
  };
};