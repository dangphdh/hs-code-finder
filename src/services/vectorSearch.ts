import { HSCodeEmbedding, SearchResult } from '../types/hsCode';
import { EmbeddingProvider } from '../types/embedding';

/**
 * Client-side Vector Search Service
 * Performs similarity search on precomputed embeddings
 */
export class ClientVectorSearch {
  private hsCodesData: HSCodeEmbedding[] = [];
  private currentProvider = '';
  private currentModel = '';

  /**
   * Load precomputed embeddings for a specific provider and model
   */
  async loadPrecomputedEmbeddings(provider: string, model: string): Promise<void> {
    const modelKey = model.replace(/\./g, '-');
    const dataPath = `/data/${provider.toLowerCase()}-embeddings/${modelKey}.json`;
    
    try {
      const response = await fetch(dataPath);
      if (!response.ok) {
        throw new Error(`Failed to load embeddings: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.hsCodesData = data.hs_codes || [];
      this.currentProvider = provider;
      this.currentModel = model;
    } catch (error) {
      console.error('Failed to load precomputed embeddings:', error);
      throw new Error(`Could not load embeddings for ${provider}/${model}`);
    }
  }

  /**
   * Search for HS codes similar to query
   */
  async search(
    query: string,
    provider: EmbeddingProvider,
    apiKey: string,
    topK: number = 10
  ): Promise<SearchResult[]> {
    try {
      // Generate embedding for query
      const queryEmbedding = await provider.generateEmbedding(query, apiKey);
      
      // Ensure compatible embeddings are loaded
      if (provider.model !== this.currentModel || provider.name !== this.currentProvider) {
        await this.loadPrecomputedEmbeddings(provider.name, provider.model);
      }
      
      if (this.hsCodesData.length === 0) {
        throw new Error('No precomputed embeddings available');
      }

      // Verify embedding dimensions match
      if (queryEmbedding.length !== provider.dimensions) {
        throw new Error(
          `Embedding dimension mismatch: query (${queryEmbedding.length}) vs expected (${provider.dimensions})`
        );
      }

      // Calculate similarities
      const results: SearchResult[] = this.hsCodesData
        .map((hsCode) => ({
          ...hsCode,
          similarity: this.cosineSimilarity(queryEmbedding, hsCode.embedding),
          source: 'vector' as const
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      return results;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same dimension');
    }

    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Check if embeddings are loaded
   */
  isLoaded(): boolean {
    return this.hsCodesData.length > 0;
  }

  /**
   * Get current loaded provider info
   */
  getLoadedProviderInfo() {
    return {
      provider: this.currentProvider,
      model: this.currentModel,
      codesCount: this.hsCodesData.length
    };
  }
}