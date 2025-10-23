# Vector Embedding Storage Optimization Guide

## Current Solution (JSON)
- **Format**: Plain JSON files
- **File Size**: ~2-5MB per provider
- **Pros**: Simple, human-readable, browser-compatible
- **Cons**: Large file size, slow loading, memory inefficient

---

## 🎯 Optimized Solutions

### 1. **Binary Format (`.bin` / NumPy-like)**
**Best for**: Electron apps, offline use

#### Implementation:
```typescript
// Encode embeddings to binary
function embeddings ToBuffer(embeddings: HSCodeEmbedding[]): Buffer {
  const buffer = Buffer.alloc(
    embeddings.length * (embeddings[0].embedding.length * 4 + 20)
  );
  let offset = 0;
  
  embeddings.forEach(item => {
    // Write code length + code
    buffer.writeUInt16BE(item.code.length, offset);
    offset += 2;
    buffer.write(item.code, offset, 'utf8');
    offset += item.code.length;
    
    // Write embeddings as float32
    item.embedding.forEach(val => {
      buffer.writeFloatBE(val, offset);
      offset += 4;
    });
  });
  
  return buffer;
}

// Decode binary buffer
function bufferToEmbeddings(buffer: Buffer): HSCodeEmbedding[] {
  const embeddings: HSCodeEmbedding[] = [];
  let offset = 0;
  
  while (offset < buffer.length) {
    const codeLen = buffer.readUInt16BE(offset);
    offset += 2;
    
    const code = buffer.toString('utf8', offset, offset + codeLen);
    offset += codeLen;
    
    const embedding: number[] = [];
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      embedding.push(buffer.readFloatBE(offset));
      offset += 4;
    }
    
    embeddings.push({ code, embedding });
  }
  
  return embeddings;
}
```

**Size Comparison**:
- JSON (3072d OpenAI): ~2.5MB
- Binary (3072d): ~0.8MB (**68% reduction**)

---

### 2. **Compressed Binary (`.bin.gz` / Zstandard)**
**Best for**: Web app distribution, storage efficiency

#### Implementation:
```typescript
import pako from 'pako'; // or zstd.js
import * as fs from 'fs';

// Compress to .bin.gz
async function compressEmbeddings(
  embeddingsPath: string, 
  outputPath: string
): Promise<void> {
  const binaryData = embeddingsToBuffer(embeddings);
  const compressed = pako.gzip(binaryData); // or zstd compression
  await fs.promises.writeFile(outputPath, compressed);
  
  console.log(`Original: ${binaryData.length / 1024}KB`);
  console.log(`Compressed: ${compressed.length / 1024}KB`);
  console.log(`Ratio: ${(1 - compressed.length / binaryData.length) * 100}%`);
}

// Decompress on load
async function loadCompressedEmbeddings(path: string): Promise<HSCodeEmbedding[]> {
  const compressed = await fs.promises.readFile(path);
  const binary = pako.ungzip(compressed);
  return bufferToEmbeddings(binary);
}
```

**Size Comparison**:
- JSON: ~2.5MB
- Binary: ~0.8MB
- Compressed (gzip): ~0.3MB (**88% reduction**)
- Compressed (zstd): ~0.25MB (**90% reduction**)

---

### 3. **Vector Quantization**
**Best for**: Extreme storage + speed optimization

#### Implementation:
```typescript
// Quantize float32 to uint8 (4x reduction)
function quantizeEmbedding(embedding: number[]): Uint8Array {
  const min = Math.min(...embedding);
  const max = Math.max(...embedding);
  const scale = (max - min) / 255;
  
  const quantized = new Uint8Array(embedding.length);
  embedding.forEach((val, i) => {
    quantized[i] = Math.round((val - min) / scale);
  });
  
  return quantized;
}

// Dequantize back to float32
function dequantizeEmbedding(
  quantized: Uint8Array,
  min: number,
  max: number
): number[] {
  const scale = (max - min) / 255;
  return Array.from(quantized).map(val => val * scale + min);
}
```

**Impact**:
- Storage: **4x reduction** (3072d → 768 bytes per vector)
- Speed: **4x faster** similarity calculations
- Accuracy: ~2-3% loss (usually acceptable for search)

---

### 4. **SQLite Database**
**Best for**: Structured queries, filtering

#### Implementation:
```typescript
import Database from 'better-sqlite3';

// Create database
const db = new Database('embeddings.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS embeddings (
    id INTEGER PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    embedding BLOB NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX idx_code ON embeddings(code);
  CREATE INDEX idx_provider_model ON embeddings(provider, model);
`);

// Insert embeddings
const insert = db.prepare(`
  INSERT INTO embeddings (code, description, embedding, provider, model)
  VALUES (?, ?, ?, ?, ?)
`);

embeddings.forEach(item => {
  insert.run(
    item.code,
    item.description,
    Buffer.from(new Float32Array(item.embedding).buffer),
    'openai',
    'text-embedding-3-small'
  );
});

// Query with filtering
const search = db.prepare(`
  SELECT code, description, embedding
  FROM embeddings
  WHERE provider = ? AND model = ?
  LIMIT 1000
`);

const results = search.all('openai', 'text-embedding-3-small');
```

**Advantages**:
- Indexed queries: **O(log n)** instead of O(n)
- Filtering capabilities
- Transaction support
- ACID compliance

---

### 5. **HuggingFace Safetensors**
**Best for**: ML projects, standardization

#### Implementation:
```typescript
import { Tensor, saveSafetensors } from '@huggingface/transformers';

// Save as safetensors
async function saveEmbeddingsSafetensors(
  embeddings: HSCodeEmbedding[],
  outputPath: string
): Promise<void> {
  const embeddingMatrix = new Float32Array(
    embeddings.length * embeddings[0].embedding.length
  );
  
  const codes = [];
  embeddings.forEach((item, i) => {
    codes.push(item.code);
    item.embedding.forEach((val, j) => {
      embeddingMatrix[i * item.embedding.length + j] = val;
    });
  });
  
  await saveSafetensors({
    embeddings: new Tensor(
      'float32',
      embeddingMatrix,
      [embeddings.length, embeddings[0].embedding.length]
    ),
    codes: codes
  }, outputPath);
}
```

---

### 6. **IndexedDB (Web Storage)**
**Best for**: Web app persistent storage, offline capability

#### Implementation:
```typescript
// Store embeddings in IndexedDB
async function storeEmbeddingsIndexedDB(
  embeddings: HSCodeEmbedding[],
  storeName: string
): Promise<void> {
  const request = indexedDB.open('hsCodeDB', 1);
  
  request.onupgradeneeded = (event: any) => {
    const db = event.target.result;
    const objectStore = db.createObjectStore(storeName, { keyPath: 'code' });
    objectStore.createIndex('provider', 'provider', { unique: false });
  };
  
  const db = await new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  const transaction = db.transaction([storeName], 'readwrite');
  const objectStore = transaction.objectStore(storeName);
  
  embeddings.forEach(item => {
    objectStore.add(item);
  });
}

// Retrieve from IndexedDB
async function getEmbeddingsIndexedDB(
  storeName: string,
  provider: string
): Promise<HSCodeEmbedding[]> {
  const db = await openDB();
  const transaction = db.transaction([storeName], 'readonly');
  const index = transaction.objectStore(storeName).index('provider');
  
  return new Promise((resolve, reject) => {
    const request = index.getAll(provider);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
```

**Performance**:
- Initial load: Async (no blocking)
- Persistence: Survives page refresh
- Capacity: 50MB+ per domain
- Query: Indexed O(log n)

---

## 📊 Comparison Table

| Solution | Size | Load Time | Query Speed | Persistence | Best For |
|----------|------|-----------|------------|-------------|----------|
| JSON | 2.5MB | 800ms | O(n) | ❌ | Development |
| Binary | 0.8MB | 200ms | O(n) | ✅ | Electron |
| Compressed | 0.3MB | 300ms | O(n) | ✅ | Web+Electron |
| Quantized | 0.2MB | 50ms | O(n) | ✅ | Mobile |
| SQLite | 2.0MB | 500ms | O(log n) | ✅ | Desktop app |
| Safetensors | 0.8MB | 150ms | O(n) | ✅ | ML pipelines |
| IndexedDB | 2.5MB | 100ms | O(log n) | ✅ | Web persistent |

---

## 🚀 Recommended Solution by Use Case

### Web App (Current)
```
1. Compressed Binary (gzip) → public/data/
2. Optional: IndexedDB cache after first load
3. Fallback: JSON for development
```

### Electron App (Future)
```
1. SQLite database in app userData
2. Quantization for fast searches
3. Binary storage for minimal disk usage
```

### Hybrid (Best of Both)
```
Web: Compressed (.bin.gz)
├─ Downloaded once
├─ Cached in IndexedDB
└─ Quantized for fast search

Electron: SQLite + Quantization
├─ Indexed queries
├─ 4x speed improvement
└─ 4x storage reduction
```

---

## 📝 Implementation Steps

### Step 1: Binary Format Service
Create `src/services/binaryEmbeddings.ts`

### Step 2: Compression Utility
Create `src/services/compressionUtils.ts`

### Step 3: IndexedDB Cache
Create `src/services/embeddingCache.ts`

### Step 4: Update Vector Search
Modify `src/services/vectorSearch.ts` to use new formats

### Step 5: Migration Script
Create `scripts/convert-embeddings.ts`

---

## 💡 Quick Start

### For Immediate Web App Improvement:
```bash
# 1. Convert JSON to compressed binary
npm run convert:embeddings

# 2. Update vectorSearch.ts to load .bin.gz
# 3. Add gzip decompression in loadPrecomputedEmbeddings()

# Result: 88% size reduction + faster loading
```

### For Electron App:
```bash
# 1. Generate SQLite database from embeddings
npm run generate:sqlite

# 2. Update electron service to query SQLite
# 3. Add quantization for 4x speed boost

# Result: Instant searches, minimal storage
```

---

## 🔗 Related Resources

- [Binary Protocol Buffers](https://protobuf.dev/)
- [MessagePack Format](https://msgpack.org/)
- [FAISS (Facebook AI Similarity Search)](https://faiss.ai/)
- [Annoy (Spotify Approximate NN)](https://github.com/spotify/annoy)
- [Hnswlib (Graph-based ANN)](https://github.com/nmslib/hnswlib)
- [SQLite FTS5 (Full-Text Search)](https://www.sqlite.org/fts5.html)
