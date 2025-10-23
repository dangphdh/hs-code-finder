import { EmbeddingProvider } from '../../types/embedding';

/**
 * OpenAI Embedding Provider
 * Supports text-embedding-3-small and text-embedding-3-large models
 */
export class OpenAIProvider implements EmbeddingProvider {
  name = 'OpenAI';
  model: string;
  dimensions: number;
  maxTokens = 8000;
  private endpoint = 'https://api.openai.com/v1/embeddings';

  constructor(model: 'text-embedding-3-small' | 'text-embedding-3-large' = 'text-embedding-3-small') {
    this.model = model;
    this.dimensions = model === 'text-embedding-3-small' ? 1536 : 3072;
  }

  async generateEmbedding(text: string, apiKey: string): Promise<number[]> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: this.model,
          encoding_format: 'float'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to generate embedding with OpenAI');
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}