// Base HS Code interface with dual language support
export interface HSCode {
  code: string;
  menu: string;
  menu_vi?: string;
  description: string;
  description_vi?: string;
  chapter: string;
  section: string;
  keywords?: string[];
  keywords_vi?: string[];
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