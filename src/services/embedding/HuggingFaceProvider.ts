import { EmbeddingProvider } from '../../types/embedding';

/**
 * HuggingFace Inference API Provider
 * Uses sentence-transformer models for embeddings
 */
export class HuggingFaceProvider implements EmbeddingProvider {
  name = 'HuggingFace';
  model = 'sentence-transformers/all-MiniLM-L6-v2';
  dimensions = 384;
  maxTokens = 512;

  async generateEmbedding(text: string, apiKey: string): Promise<number[]> {
    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/pipeline/feature-extraction/${this.model}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: text,
            options: { wait_for_model: true }
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`HuggingFace API Error: ${error.error || response.statusText}`);
      }

      const data = await response.json();
      // Handle both array and object responses
      return Array.isArray(data) ? (Array.isArray(data[0]) ? data[0] : data) : data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to generate embedding with HuggingFace');
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