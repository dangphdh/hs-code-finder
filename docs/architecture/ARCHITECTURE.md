# Architecture Overview

Technical documentation for HS Code Finder web and desktop architecture.

## System Architecture

```
┌─────────────────────────────────────────┐
│         React UI Layer (src/)           │
│  - ApiKeyManager                        │
│  - SearchForm                           │
│  - ResultsList                          │
│  - DesktopFeatures (Electron only)      │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│    Business Logic Layer (services/)     │
│  - vectorSearch.ts                      │
│  - fallbackSearch.ts                    │
│  - apiKeyManager.ts                     │
│  - electronStorage.ts                   │
│  - embedding/ (providers)               │
└─────────────────────────────────────────┘
           ↓ (dual path)
    ┌──────┴──────┐
    ↓             ↓
┌─────────────┐  ┌──────────────────────┐
│   Web       │  │    Electron          │
│             │  │  ┌────────────────┐  │
│ localStorage│  │  │ Main Process   │  │
│             │  │  │ (IPC handlers) │  │
│             │  │  └────────────────┘  │
│             │  │         ↓            │
│             │  │  Filesystem + APIs   │
└─────────────┘  └──────────────────────┘
```

## Core Components

### 1. Vector Search Service

**File**: `src/services/vectorSearch.ts`

```typescript
interface VectorSearchOptions {
  query: string;
  embeddings: number[][];
  threshold?: number;
  topK?: number;
}

function performVectorSearch(options: VectorSearchOptions): HSCode[]
```

**Algorithm**: Cosine similarity
- Computes dot product of query embedding vs. dataset embeddings
- Sorts by similarity score
- Returns top K results

**Complexity**: O(n × d) where n = dataset size, d = embedding dimensions

**Example dimensions**:
- OpenAI: 1536 or 3072
- Cohere: 1024
- HuggingFace: 384

### 2. Embedding Providers

**Location**: `src/services/embedding/`

```typescript
interface EmbeddingProvider {
  generateEmbedding(text: string, apiKey: string): Promise<number[]>;
  embeddingDimension: number;
}
```

**Implementations**:

| Provider | Model | Dimension | Quality | Speed | Cost |
|----------|-------|-----------|---------|-------|------|
| OpenAI | text-embedding-3-small | 1536 | ⭐⭐⭐⭐⭐ | Fast | $0.02/1M |
| OpenAI | text-embedding-3-large | 3072 | ⭐⭐⭐⭐⭐⭐ | Medium | $0.13/1M |
| Cohere | embed-english-v3.0 | 1024 | ⭐⭐⭐⭐ | Fast | $0.10/1M |
| HuggingFace | sentence-transformers | 384 | ⭐⭐⭐ | Fast | Free |

**Factory Pattern**:
```typescript
const provider = EmbeddingProviderFactory.create('openai');
const embedding = await provider.generateEmbedding('text', apiKey);
```

### 3. Fallback Search

**File**: `src/services/fallbackSearch.ts`

When API unavailable or embedding fails, fallback to keyword search:

```typescript
interface FallbackSearchOptions {
  query: string;
  hsCodeDatabase: HSCode[];
}

function performFallbackSearch(options: FallbackSearchOptions): HSCode[]
```

**Algorithm**: TF-IDF keyword matching
- Tokenizes query into keywords
- Searches against HS code descriptions
- Ranks by term frequency
- Simple but effective

**Limitations**:
- Not semantic (e.g., won't find "banana" for "fruit")
- Slower for large datasets (full text scan)
- Language-dependent

### 4. Storage Abstraction

**File**: `src/services/electronStorage.ts`

Unified storage interface that works in both web and Electron:

```typescript
interface StorageService {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

**Web Implementation**:
- Uses browser `localStorage`
- ~5-10MB limit
- Synchronous in code but wrapped as async

**Electron Implementation**:
- Uses IPC to communicate with main process
- Filesystem storage in `%APPDATA%/HS Code Finder/`
- Unlimited storage
- Persistent across app restarts

### 5. API Key Management

**File**: `src/services/apiKeyManager.ts`

```typescript
class ApiKeyManager {
  saveApiKey(provider: string, apiKey: string): void
  getApiKey(provider: string): string | null
  deleteApiKey(provider: string): void
  hasApiKey(provider: string): boolean
}
```

**Security**:
- Encrypts with AES-256 (crypto-js)
- Key: `hs-code-finder-secret` (can be changed)
- Stored in localStorage (web) or filesystem (Electron)

**Encryption example**:
```typescript
import CryptoJS from 'crypto-js';

const encrypted = CryptoJS.AES.encrypt(apiKey, 'secret').toString();
const decrypted = CryptoJS.AES.decrypt(encrypted, 'secret').toString(CryptoJS.enc.Utf8);
```

## Search Flow

### Vector Search Flow

```
User Query
    ↓
Generate Query Embedding (via selected provider)
    ↓
Load Dataset Embeddings
    ↓
Compute Similarity Scores (cosine similarity)
    ↓
Sort by Score (highest first)
    ↓
Return Top K Results
    ↓
Display in UI
```

**Example**:
```typescript
const query = "electronic devices";
const queryEmbedding = await openaiProvider.generateEmbedding(query);
const results = performVectorSearch({
  query: queryEmbedding,
  embeddings: datasetEmbeddings,
  topK: 10
});
```

### Fallback Search Flow

```
Vector Search Fails
    ↓
Tokenize Query ("electronic devices" → ["electronic", "devices"])
    ↓
Search HS Code Descriptions
    ↓
Calculate TF-IDF Scores
    ↓
Sort by Score
    ↓
Return Top K Results
```

## Electron Architecture

### Process Model

```
┌──────────────────────────────────┐
│     Main Process (main.ts)       │
│  - Window management             │
│  - IPC handlers                  │
│  - File system access            │
│  - Native APIs                   │
└──────────────────────────────────┘
          ↑ ↓ IPC
┌──────────────────────────────────┐
│  Preload (preload.ts)            │
│  - Context isolation             │
│  - Safe API bridge               │
└──────────────────────────────────┘
          ↑ ↓ contextBridge
┌──────────────────────────────────┐
│  Renderer (React)                │
│  - UI components                 │
│  - React hooks                   │
│  - Business logic                │
└──────────────────────────────────┘
```

### IPC Communication

**Secure message passing**:

```typescript
// Renderer (React)
const version = await window.electron.app.getVersion();

// Preload (contextBridge)
contextBridge.exposeInMainWorld('electron', {
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion')
  }
});

// Main (IPC handler)
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});
```

### File Operations

**Storage location**: `C:\Users\<username>\AppData\Local\HS Code Finder\hs-code-finder\`

**Directory structure**:
```
%APPDATA%/HS Code Finder/hs-code-finder/
├── api-keys.json          # Encrypted API keys
├── search-history.json    # Search history
├── custom-codes.json      # User-imported HS codes
├── embeddings/            # Offline embeddings
│   ├── openai-small.json
│   ├── openai-large.json
│   ├── cohere.json
│   └── huggingface.json
└── exports/               # User exports
    ├── results-2024-10-23.csv
    └── results-2024-10-24.csv
```

## Performance Characteristics

### Memory Usage

| Component | Size |
|-----------|------|
| React App | ~2-3 MB |
| Dataset (1000 codes) | ~100 KB |
| OpenAI embeddings | ~5 MB (1000 codes) |
| Cohere embeddings | ~4 MB (1000 codes) |
| HuggingFace embeddings | ~2 MB (1000 codes) |
| Total App | ~10-15 MB (typical) |

### Search Performance

| Dataset Size | Time | Provider |
|--------------|------|----------|
| 100 codes | <10ms | All |
| 1000 codes | 50-100ms | All |
| 10000 codes | 500-1000ms | All |
| 100000 codes | 5-10s | All (too slow) |

**Optimization**: For large datasets, consider server-side search.

### Network

| Operation | Time | Bandwidth |
|-----------|------|-----------|
| Generate embedding | 500ms-2s | ~1 KB |
| Fetch embeddings | 100-500ms | Dataset size |
| App startup | 1-3s | ~500 KB |

## Data Structures

### HS Code

```typescript
interface HSCode {
  code: string;           // "8471.30.00"
  description: string;    // "Other automatic data processing machines..."
  category: string;       // "Computers"
  embedding?: number[];   // [0.1, 0.2, ...]
}
```

### Search Result

```typescript
interface SearchResult extends HSCode {
  score: number;          // Similarity score (0-1)
  matchType: 'vector' | 'keyword';  // How it was found
}
```

### Config

```typescript
interface AppConfig {
  apiKeyProvider: 'openai' | 'cohere' | 'huggingface';
  apiKey: string;
  encryptionKey: string;
  topK: number;           // Return top K results
  similarityThreshold: number;  // Minimum score (0-1)
}
```

## Security

### Client-Side Encryption

```typescript
// Encrypt API key before storing
const encryptedKey = CryptoJS.AES.encrypt(apiKey, SECRET_KEY).toString();
localStorage.setItem(`api-key-${provider}`, encryptedKey);

// Decrypt when needed
const encrypted = localStorage.getItem(`api-key-${provider}`);
const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY).toString(CryptoJS.enc.Utf8);
```

**Limitation**: Secret key is hardcoded. For production, consider:
- Platform keychain integration (macOS)
- Windows Credential Manager (Windows)
- Secret Manager (Linux)

### Electron Context Isolation

```typescript
// main.ts
const window = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,
    preload: join(__dirname, 'preload.ts')
  }
});

// preload.ts - Only expose safe methods
contextBridge.exposeInMainWorld('electron', {
  selectFiles: () => ipcRenderer.invoke('dialog:open')
});

// React - Cannot access dangerous APIs
// window.electron.require('fs') // ❌ Not available
// window.electron.selectFiles()  // ✅ Only this is available
```

## Deployment

### Web Deployment

Deploy `dist/` to:
- Vercel (recommended)
- Netlify
- GitHub Pages
- Any static hosting

```bash
npm run build
# Upload dist/ contents
```

### Desktop Deployment

Build and distribute:
```bash
npm run build:electron
# Creates dist/HS Code Finder Setup 1.0.0.exe (installer)
# Creates dist/HS Code Finder 1.0.0.exe (portable)
```

**Code Signing** (optional but recommended):
- Prevents SmartScreen warnings
- Requires code signing certificate
- Configured in `electron-builder` config

## Testing Strategy

### Unit Tests (Recommended)

```typescript
// test/services/vectorSearch.test.ts
describe('vectorSearch', () => {
  test('should find similar embeddings', () => {
    const query = [1, 0, 0];
    const dataset = [[1, 0, 0], [0, 1, 0]];
    const results = performVectorSearch({ query, dataset });
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });
});
```

### Integration Tests (Recommended)

```typescript
// test/hooks/useHSCodeSearch.test.tsx
describe('useHSCodeSearch', () => {
  test('should search and return results', async () => {
    const { result } = renderHook(() => useHSCodeSearch());
    await act(async () => {
      await result.current.searchBySimilarity('query', 'openai', 'key');
    });
    expect(result.current.results.length).toBeGreaterThan(0);
  });
});
```

### E2E Tests (Recommended)

```typescript
// test/e2e/search.e2e.ts
describe('Search E2E', () => {
  test('user can search and see results', async () => {
    await page.goto('http://localhost:5173');
    await page.type('input[placeholder="HS Code..."]', 'electronic');
    await page.click('button:has-text("Search")');
    await expect(page).toHaveSelector('.result-item');
  });
});
```

## Future Optimizations

### 1. Vector Quantization

Reduce embedding dimensions while maintaining accuracy:
- 1536 → 512 dimensions (66% reduction)
- Minimal accuracy loss
- 3x faster search

### 2. Approximate Nearest Neighbor (ANN)

```typescript
// Current: O(n × d) exact search
const exact = performVectorSearch(queryEmbedding);

// Future: O(log n) approximate search
const ann = annIndex.search(queryEmbedding);
```

Libraries: Annoy, FAISS, Hnswlib

### 3. Server-Side Search

Move vector search to server for large datasets:
```typescript
// Client sends query
const results = await fetch('/api/search', {
  method: 'POST',
  body: JSON.stringify({ query, provider })
});

// Server returns results
```

### 4. Indexing

Pre-compute embeddings at build time:
```typescript
// Current: Fetch embeddings on load
const embeddings = await fetch('/data/embeddings.json');

// Future: Pre-indexed in database
const embeddings = await db.query('SELECT * FROM embeddings');
```

## Troubleshooting

### Search returns no results

1. Check API key is valid
2. Verify embedding provider is responding
3. Ensure dataset has embeddings loaded
4. Lower similarity threshold
5. Try fallback keyword search

### Electron IPC fails

1. Verify preload.ts is loaded
2. Check context isolation is enabled
3. Ensure handler is registered in main.ts
4. Check console for errors (F12)

### High memory usage

1. Reduce dataset size
2. Use smaller embedding dimension
3. Implement pagination for results
4. Profile with DevTools

See [DEVELOPMENT.md](DEVELOPMENT.md) for more details.
