import { HSCodeEmbedding, SearchResult } from '../types/hsCode';
import { EmbeddingProvider } from '../types/embedding';
import { BinaryEmbeddingsService } from './binaryEmbeddings';

/**
 * Client-side Vector Search Service
 * Performs similarity search on precomputed embeddings
 * Supports both JSON and binary formats
 */
export class ClientVectorSearch {
  private hsCodesData: HSCodeEmbedding[] = [];
  private currentProvider = '';
  private currentModel = '';

  /**
   * Load precomputed embeddings for a specific provider and model
   * First tries to load binary format (.bin), falls back to JSON
   */
  async loadPrecomputedEmbeddings(provider: string, model: string): Promise<void> {
    const modelKey = model.replace(/\./g, '-');
    const binaryPath = `/data/${provider.toLowerCase()}-embeddings/${modelKey}.bin`;
    const jsonPath = `/data/${provider.toLowerCase()}-embeddings/${modelKey}.json`;
    
    try {
      // Try loading binary format first
      console.log(`📦 Loading embeddings: ${provider}/${model}`);
      console.log(`   Trying binary format: ${binaryPath}`);
      
      const binaryResponse = await fetch(binaryPath);
      if (binaryResponse.ok) {
        const arrayBuffer = await binaryResponse.arrayBuffer();
        const { embeddings } = BinaryEmbeddingsService.binaryToEmbeddings(arrayBuffer);
        this.hsCodesData = embeddings;
        this.currentProvider = provider;
        this.currentModel = model;
        console.log(`   ✓ Loaded ${embeddings.length} embeddings from binary format`);
        return;
      }
      
      // Fallback to JSON format
      console.log(`   Binary not found, trying JSON: ${jsonPath}`);
      const jsonResponse = await fetch(jsonPath);
      if (!jsonResponse.ok) {
        throw new Error(`Failed to load embeddings: ${jsonResponse.statusText}`);
      }
      
      const data = await jsonResponse.json();
      this.hsCodesData = data.hs_codes || [];
      this.currentProvider = provider;
      this.currentModel = model;
      console.log(`   ✓ Loaded ${this.hsCodesData.length} embeddings from JSON format`);
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