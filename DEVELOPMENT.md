# Development Guide

Complete guide for setting up and developing HS Code Finder with web and Electron desktop support.

## Quick Start

```powershell
# Install dependencies
npm install

# Start development (web + Electron)
npm run dev

# Start web only
npm run dev:web

# Build for production
npm run build

# Build Electron app
npm run build:electron
```

## Prerequisites

- Node.js 16+ ([download](https://nodejs.org/))
- Windows 10 or later (for Electron)
- ~500MB disk space

## Project Structure

```
hs-code-finder/
├── src/                    # React web app
│   ├── components/         # UI components
│   ├── hooks/              # React hooks (useHSCodeSearch, useElectron)
│   ├── services/           # Business logic + embedding providers
│   ├── types/              # TypeScript interfaces
│   ├── utils/              # Helpers
│   ├── App.tsx
│   └── main.tsx
├── electron/               # Electron desktop app
│   ├── main.ts             # Main process, IPC handlers
│   ├── preload.ts          # Security bridge
│   └── tsconfig.json
├── public/                 # Static assets
│   └── data/               # Sample HS codes + embeddings
├── docs/                   # Documentation
├── package.json            # Dependencies
├── vite.config.ts          # Web build config
└── tsconfig.json
```

## Phase 1: Setup & Test

### Step 1: Install Dependencies

```powershell
npm install
```

Installs all dependencies including Electron, Vite, React, TypeScript, etc.

### Step 2: Verify Installation

```powershell
npm run build
```

Tests that TypeScript compiles and bundle is created. Output should show ~79KB gzipped.

### Step 3: Start Development

```powershell
npm run dev
```

This starts:
1. Vite dev server on `http://localhost:5173`
2. Electron app (after ~5 seconds, when server is ready)
3. Hot reload on code changes

**Expected behavior:**
- Browser window opens with HS Code Finder
- Can type queries and see results
- Changes to React code reload instantly
- Changes to Electron code require restart

## Phase 2: Integration

Services are currently synchronous. To enable full Electron features (file operations, persistent storage), update services to use `electronStorage`:

### Update ApiKeyManager.ts

Change from localStorage to electronStorage:

```typescript
import { electronStorage } from './electronStorage';

export class ApiKeyManager {
  async saveApiKey(provider: string, encryptedKey: string) {
    await electronStorage.setItem(`api-key-${provider}`, encryptedKey);
  }

  async getApiKey(provider: string): Promise<string | null> {
    return await electronStorage.getItem(`api-key-${provider}`);
  }

  async deleteApiKey(provider: string) {
    await electronStorage.removeItem(`api-key-${provider}`);
  }
}
```

### Update useHSCodeSearch.ts

Add async/await for storage operations:

```typescript
export function useHSCodeSearch() {
  const [results, setResults] = useState<HSCode[]>([]);
  const [loading, setLoading] = useState(false);

  const searchBySimilarity = async (query: string, provider: string, apiKey: string) => {
    setLoading(true);
    try {
      const apiKeyManager = new ApiKeyManager();
      // Now these are async
      await apiKeyManager.saveApiKey(provider, apiKey);
      // ... rest of search logic
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, searchBySimilarity };
}
```

### Update Other Services

Apply same pattern to:
- `vectorSearch.ts` - Add async/await wrappers
- `fallbackSearch.ts` - Add async/await wrappers
- Embedding providers - Keep synchronous (they're external API calls)

## Phase 3: New Desktop Features

### Feature 1: CSV Import

In `DesktopFeatures.tsx`:

```typescript
const handleImportCSV = async () => {
  const { electronAPI } = useElectronAPI();
  if (!electronAPI) return;

  const files = await electronAPI.selectFiles();
  if (files.length === 0) return;

  const csvData = await electronAPI.readFile(files[0]);
  const codes = parseCSV(csvData);
  await electronStorage.setItem('hs-codes-custom', JSON.stringify(codes));
};
```

### Feature 2: Search History

```typescript
const saveSearchHistory = async (query: string, results: HSCode[]) => {
  const history = await electronStorage.getItem('search-history') || '[]';
  const entries = JSON.parse(history);
  entries.push({ query, results, timestamp: Date.now() });
  await electronStorage.setItem('search-history', JSON.stringify(entries));
};
```

### Feature 3: Export Results

```typescript
const exportResults = async (results: HSCode[]) => {
  const path = await electronAPI.selectSaveFile('results.csv');
  if (!path) return;

  const csv = convertToCSV(results);
  await electronAPI.writeFile(path, csv);
};
```

### Feature 4: Offline Embeddings

Pre-load embeddings in `public/data/`:

```typescript
const loadOfflineEmbeddings = async () => {
  const response = await fetch('/data/huggingface-embeddings/embeddings.json');
  const embeddings = await response.json();
  await electronStorage.setItem('offline-embeddings', JSON.stringify(embeddings));
};
```

## Phase 4: Build & Package

### Create App Icon

Create `public/icon.png` (512×512) and place in `electron/` folder.

### Build for Production

```powershell
npm run build:electron
```

This:
1. Compiles React to `dist/`
2. Compiles Electron to `dist/electron/`
3. Packages with electron-builder
4. Creates `dist/HS Code Finder Setup 1.0.0.exe` (installer)
5. Creates `dist/HS Code Finder 1.0.0.exe` (portable)

### Output Files

```
dist/
├── HS Code Finder Setup 1.0.0.exe   # NSIS installer
├── HS Code Finder 1.0.0.exe         # Portable executable
└── builder-effective-config.yaml    # Build configuration used
```

### Distribute

- **Setup**: For first-time users, installs to Program Files
- **Portable**: For USB or quick testing, no installation needed

## Electron Integration Reference

### Accessing Electron API in React

```typescript
import { useElectronAPI } from '../hooks/useElectron';

export function MyComponent() {
  const { electronAPI, isElectron } = useElectronAPI();

  if (!isElectron) return <div>Web version</div>;

  return (
    <button onClick={() => electronAPI.app.getVersion()}>
      Get Version
    </button>
  );
}
```

### File Operations

```typescript
const { electronAPI } = useElectronAPI();

// Select and read file
const files = await electronAPI.selectFiles();
const content = await electronAPI.readFile(files[0]);

// Write file
await electronAPI.writeFile('/path/to/file.txt', 'content');

// Delete file
await electronAPI.deleteFile('/path/to/file.txt');

// List files
const files = await electronAPI.listFiles('/path');
```

### Native Dialogs

```typescript
// Open file dialog
const files = await electronAPI.selectFiles();

// Save file dialog
const path = await electronAPI.selectSaveFile('filename.txt');

// Message box
await electronAPI.showMessage('Title', 'Message', 'info');
```

### Persistent Storage

```typescript
import { electronStorage } from '../services/electronStorage';

// Set value (works in both web and Electron)
await electronStorage.setItem('key', 'value');

// Get value
const value = await electronStorage.getItem('key');

// Remove
await electronStorage.removeItem('key');

// Clear all
await electronStorage.clear();
```

## Troubleshooting

### "Electron is not defined"
- Make sure you're inside `<useElectronAPI>` component
- Check that `electronAPI` is not null before using
- Verify preload.ts is being loaded in main.ts

### "Cannot find module 'electron'"
```powershell
npm install electron --save-dev
```

### Hot reload not working
- Changes to `electron/main.ts` require manual restart
- Changes to React code should reload automatically
- If not, clear `.vite` cache: `rm -r node_modules/.vite`

### Build fails
```powershell
npm run build -- --verbose
```

Shows detailed build output.

## Next Steps

1. ✅ Phase 1: `npm install && npm run dev` (verify it works)
2. 🔜 Phase 2: Update services to use `electronStorage`
3. 🔜 Phase 3: Add CSV import, history, export
4. 🔜 Phase 4: Build and package as .exe

See [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) for technical details.
