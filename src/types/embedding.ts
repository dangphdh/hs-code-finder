// Embedding provider interface
export interface EmbeddingProvider {
  name: string;
  model: string;
  dimensions: number;
  maxTokens: number;
  
  generateEmbedding(text: string, apiKey: string): Promise<number[]>;
  validateApiKey(apiKey: string): Promise<boolean>;
}

// Configuration for embedding providers
export interface EmbeddingConfig {
  provider: 'openai' | 'cohere' | 'huggingface';
  model: string;
  apiKey: string;
}

// API error types
export interface APIError {
  message: string;
  status?: number;
  provider?: string;
}

// Rate limiting interface
export interface RateLimit {
  requestsPerMinute: number;
  tokensPerMinute?: number;
  lastRequestTime: number;
  requestCount: number;
}