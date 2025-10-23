import { EmbeddingProvider } from '../../types/embedding';

/**
 * Cohere Embedding Provider
 * Uses embed-english-v3.0 model
 */
export class CohereProvider implements EmbeddingProvider {
  name = 'Cohere';
  model = 'embed-english-v3.0';
  dimensions = 1024;
  maxTokens = 512;
  private endpoint = 'https://api.cohere.ai/v1/embed';

  async generateEmbedding(text: string, apiKey: string): Promise<number[]> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: [text],
          model: this.model,
          input_type: 'search_query'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Cohere API Error: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      return data.embeddings[0];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to generate embedding with Cohere');
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      await this.generateEmbedding('test', apiKey);
      return true;
    } catch {
      return false;
    }
  }
}