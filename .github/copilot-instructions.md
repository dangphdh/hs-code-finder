# HS Code Finder - AI Coding Agent Instructions

## Project Overview
Client-side vector search web app for finding Harmonized System (HS) commodity codes using AI embeddings. No backend required - everything runs in the browser with multiple embedding provider support.

## Architecture & Key Concepts

### Vector Search Pipeline
The core flow: `Query → Generate Embedding → Load Pre-computed Embeddings → Cosine Similarity → Results`

- **Vector Search Service** (`src/services/vectorSearch.ts`): Main search logic with binary/JSON format support
- **Embedding Providers** (`src/services/embedding/`): Factory pattern for OpenAI, Cohere, HuggingFace
- **Fallback Search** (`src/services/fallbackSearch.ts`): Keyword-based backup when vector search fails
- **Binary Embeddings** (`src/services/binaryEmbeddings.ts`): Custom binary format for 60-80% file size reduction

### Data Flow Patterns
1. **Primary**: Vector embeddings stored in `/public/data/{provider}-embeddings/` (JSON/binary)
2. **Fallback**: Basic HS codes in `/public/data/hs-codes-basic.json` for keyword search
3. **API Keys**: Encrypted with crypto-js, stored in localStorage via `apiKeyManager.ts`HD026264

### Multi-Provider Architecture
- Use `EmbeddingProviderFactory` to get provider instances by key (e.g., 'openai-small', 'cohere')
- Each provider implements `EmbeddingProvider` interface with `generateEmbedding()` method
- Support both web and Electron environments via conditional imports

## Development Workflows

### Running & Building
```bash
npm run dev              # Start development server (port 5173)
npm run build            # TypeScript compile + Vite build
npm run preview          # Preview production build
npm run prepare-data     # Generate OpenAI embeddings
npm run convert:embeddings # Convert JSON to binary format
```

### Adding New Embedding Providers
1. Create provider class in `src/services/embedding/` implementing `EmbeddingProvider`
2. Register in `EmbeddingProviderFactory.static` block
3. Add to type definitions in `src/types/embedding.ts`

### Embedding Data Generation
- Scripts in `/scripts/` folder generate embeddings from CSV data
- Python scripts require API keys via environment or input prompt
- Output format: `{hs_codes: [], metadata: {provider, model, dimensions}}`

## Code Patterns & Conventions

### Service Layer Architecture
- Services are classes with static methods or singletons
- Clear separation: embedding generation, vector search, API key management
- Error handling with fallback mechanisms throughout

### React Patterns
- Custom hooks for complex state: `useHSCodeSearch`, `useEmbeddingProviders`
- Context for global state: `LanguageContext`
- Component composition over inheritance
- Props interface naming: `ComponentNameProps`

### File Naming Conventions
- Services: camelCase (e.g., `vectorSearch.ts`)
- Components: PascalCase (e.g., `SearchForm.tsx`) 
- Types: camelCase with `.ts` extension
- Scripts: kebab-case with appropriate extension

### TypeScript Patterns
- Strict interfaces for data structures (`HSCode`, `SearchResult`, `EmbeddingProvider`)
- Union types for search modes: `'vector' | 'fallback'`
- Generic error handling with `Error` instances

## Critical Integration Points

### Binary Embeddings Format
Custom binary format in `binaryEmbeddings.ts`:
- Header: Magic number + version + dimensions + count
- Each embedding: string lengths + UTF-8 text + float32 vector
- 60-80% smaller than JSON, loads faster

### Cross-Platform Support
- Web version: Direct API calls, localStorage for keys
- Electron version: IPC handlers for file system access in `electron/main.ts`
- Conditional imports using `useElectron()` hook

### API Key Security
- Keys encrypted with crypto-js AES before localStorage storage
- Never transmitted except to embedding providers
- Validation on save with actual API test call

## Performance Considerations

### Bundle Optimization
- Manual chunks in `vite.config.ts` for embedding providers and crypto
- Lazy loading of embedding data (JSON/binary)
- Provider-specific code splitting

### Memory Management  
- Embeddings loaded on-demand per provider
- Binary format reduces memory footprint
- Cleanup in vector search service between provider switches

### Search Optimization
- Pre-computed embeddings avoid API calls during search
- Client-side cosine similarity for instant results
- Fallback search for offline/API failure scenarios

## Testing Considerations
- Test embedding generation scripts with small sample data
- Validate binary format conversion with known embeddings
- Mock API providers for unit tests
- Test fallback mechanisms when APIs are unavailable

## Common Pitfalls
- Embedding dimension mismatches between query and pre-computed data
- API rate limits during bulk embedding generation
- CORS issues when loading embeddings from different origins
- File path resolution differences between dev/production builds