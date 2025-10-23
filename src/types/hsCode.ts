// Base HS Code interface
export interface HSCode {
  code: string;
  description: string;
  chapter: string;
  section: string;
  keywords?: string[];
}

// HS Code with embedding data
export interface HSCodeEmbedding extends HSCode {
  embedding: number[];
  provider: string;
  model: string;
}

// Search result with similarity score
export interface SearchResult extends HSCodeEmbedding {
  similarity: number;
  source?: 'vector' | 'keyword-fallback';
}

// Metadata for embedding datasets
export interface EmbeddingMetadata {
  provider: string;
  model: string;
  total_codes: number;
  embedding_dim: number;
  created_at?: string;
  version?: string;
}