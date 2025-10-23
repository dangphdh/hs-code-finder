# HS Code Finder - Client-Side Vector Search Web App

A modern web application for finding Harmonized System (HS) commodity codes using AI-powered vector search. The app runs entirely on the client-side with support for multiple embedding providers.

## Features

✅ **Client-Side Vector Search** - All search operations run in the browser  
✅ **Multiple Embedding Providers** - OpenAI, Cohere, HuggingFace  
✅ **User-Managed API Keys** - Secure encryption with crypto-js  
✅ **Offline Fallback** - Keyword-based search when API unavailable  
✅ **No Server Dependency** - Deploy as static website  
✅ **Zero Cold Starts** - Instant responses after initial load  

## Project Structure

```
hs-code-finder/
├── src/
│   ├── components/          # React components
│   │   ├── ApiKeyManager.tsx
│   │   ├── SearchForm.tsx
│   │   └── ResultsList.tsx
│   ├── services/            # Business logic
│   │   ├── embedding/
│   │   │   ├── OpenAIProvider.ts
│   │   │   ├── CohereProvider.ts
│   │   │   ├── HuggingFaceProvider.ts
│   │   │   └── EmbeddingProviderFactory.ts
│   │   ├── apiKeyManager.ts
│   │   ├── vectorSearch.ts
│   │   └── fallbackSearch.ts
│   ├── hooks/              # Custom React hooks
│   │   └── useHSCodeSearch.ts
│   ├── types/              # TypeScript types
│   │   ├── hsCode.ts
│   │   └── embedding.ts
│   ├── utils/              # Utility functions
│   │   └── helpers.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   ├── data/
│   │   ├── hs-codes-basic.json
│   │   ├── openai-embeddings/
│   │   ├── cohere-embeddings/
│   │   └── huggingface-embeddings/
│   └── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- API keys for at least one embedding provider

### Installation

1. Clone the repository
```bash
cd hs-code-finder
npm install
```

2. Start development server
```bash
npm run dev
```

3. Open browser to `http://localhost:5173`

## Configuration

### Adding API Keys

1. Click on the "API Key Management" section
2. Enter your API key for chosen provider
3. Click "Save & Validate"
4. API key is encrypted and stored locally in browser

### Supported Providers

| Provider | Model | Dimensions | Max Tokens | Cost |
|----------|-------|-----------|-----------|------|
| OpenAI | text-embedding-3-small | 1536 | 8000 | $0.02/1M |
| OpenAI | text-embedding-3-large | 3072 | 8000 | $0.13/1M |
| Cohere | embed-english-v3.0 | 1024 | 512 | $0.10/1M |
| HuggingFace | sentence-transformers | 384 | 512 | Free tier |

### Generating Pre-computed Embeddings

Pre-computed embeddings are required for vector search. Generate them for your chosen provider:

```bash
# For OpenAI
python scripts/generate-embeddings-openai.py

# For Cohere
python scripts/generate-embeddings-cohere.py

# For HuggingFace
python scripts/generate-embeddings-hf.py
```

Embeddings will be saved to `/public/data/{provider}-embeddings/{model}.json`

## Architecture

### Data Flow

```
User Input Query
    ↓
Generate Embedding (via API)
    ↓
Load Pre-computed Embeddings
    ↓
Calculate Cosine Similarity (Client-side)
    ↓
Sort & Return Top K Results
```

### Fallback Mechanism

When vector search fails:
1. Check if API key is valid and provider available
2. Fall back to keyword-based search
3. Uses basic HS codes data from `/data/hs-codes-basic.json`

### Security

- API keys encrypted with AES encryption before storing in localStorage
- No API keys transmitted to external servers except embedding providers
- No user data collected or tracked

## Performance

- **Initial Load**: ~2-5MB (includes app + sample data)
- **Search Latency**: <100ms (client-side) + API call time
- **Memory Usage**: ~50-100MB depending on preloaded embeddings
- **Concurrent Users**: Unlimited (no server load)

## Building for Production

```bash
npm run build
```

Output files in `/dist` directory. Deploy to:
- Vercel
- Netlify  
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting

### Environment Variables

For build optimization, create `.env.production`:

```
VITE_API_PROVIDERS=openai,cohere,huggingface
VITE_DEFAULT_PROVIDER=openai-small
VITE_MAX_RESULTS=20
```

## API Documentation

### useHSCodeSearch Hook

```typescript
const { search, isLoading, error, searchMode } = useHSCodeSearch();

// Perform search
const results = await search(query, providerKey, topK);

// results: SearchResult[]
// SearchResult {
//   code: string;
//   description: string;
//   similarity: number;    // 0-1
//   source: 'vector' | 'keyword-fallback';
// }
```

### ClientVectorSearch Service

```typescript
const vectorSearch = new ClientVectorSearch();

// Load embeddings
await vectorSearch.loadPrecomputedEmbeddings(provider, model);

// Search
const results = await vectorSearch.search(query, provider, apiKey, topK);
```

### FallbackSearch Service

```typescript
const fallback = new FallbackSearch();

// Load basic data
await fallback.loadBasicData();

// Search
const results = fallback.search(query, topK);
```

## Data Sources

HS codes data sourced from:
- World Trade Organization (WTO) HS Nomenclature
- Customs authorities (UK, US, EU)
- Official commodity codes databases

Data structure:
```typescript
interface HSCode {
  code: string;              // e.g., "010121"
  description: string;       // Product description
  chapter: string;           // HS chapter (01-99)
  section: string;           // HS section (I-XXI)
  keywords?: string[];       // Search keywords
}
```

## Troubleshooting

### "Invalid API Key" Error
- Verify API key is correct
- Check provider's rate limits haven't been exceeded
- Ensure key has proper permissions/scopes

### "No embeddings loaded" Error
- Pre-computed embeddings file missing
- Run embedding generation script for provider
- Check file is in correct directory: `/public/data/{provider}-embeddings/`

### Slow Search Results
- First search may be slow (loading embeddings)
- Check browser console for network requests
- Verify embedding file size isn't too large
- Consider using smaller embedding model

## Contributing

1. Fork repository
2. Create feature branch
3. Submit pull request

## License

MIT

## Future Enhancements

- [ ] Batch search (upload CSV/Excel)
- [ ] Custom embedding models
- [ ] Integration with customs databases
- [ ] Multi-language support
- [ ] Search history & favorites
- [ ] Export results functionality
- [ ] Advanced filtering options
- [ ] Integration with trade compliance APIs

## Support

For issues and questions:
- GitHub Issues: [Create an issue]
- Email: support@hscodefinder.dev

## References

- [HS Nomenclature - WTO](https://www.wto.org/english/res_e/publications_e/tariff_nomenclature_e.htm)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [Cohere Embeddings API](https://docs.cohere.com/reference/embed)
- [HuggingFace Inference API](https://huggingface.co/docs/api-inference)