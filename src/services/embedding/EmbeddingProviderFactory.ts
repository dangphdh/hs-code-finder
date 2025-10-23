import { OpenAIProvider } from './OpenAIProvider';
import { CohereProvider } from './CohereProvider';
import { HuggingFaceProvider } from './HuggingFaceProvider';
import { EmbeddingProvider } from '../../types/embedding';

/**
 * Factory to get embedding provider instances
 */
export class EmbeddingProviderFactory {
  private static providers: Map<string, EmbeddingProvider> = new Map();

  static {
    this.providers.set('openai-small', new OpenAIProvider('text-embedding-3-small'));
    this.providers.set('openai-large', new OpenAIProvider('text-embedding-3-large'));
    this.providers.set('cohere', new CohereProvider());
    this.providers.set('huggingface', new HuggingFaceProvider());
  }

  static getProvider(providerKey: string): EmbeddingProvider | null {
    return this.providers.get(providerKey) || null;
  }

  static getAllProviders(): Map<string, EmbeddingProvider> {
    return this.providers;
  }

  static getProviderInfo(providerKey: string) {
    const provider = this.getProvider(providerKey);
    if (!provider) return null;

    return {
      key: providerKey,
      name: provider.name,
      model: provider.model,
      dimensions: provider.dimensions,
      maxTokens: provider.maxTokens
    };
  }
}