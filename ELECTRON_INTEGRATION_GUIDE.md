# Electron Integration Guide

This guide explains how to integrate Electron features into your existing React components.

## Overview

The Electron integration provides:

1. **File Operations**: Read/write/delete files from `/userData/hs-code-finder/`
2. **File Dialogs**: Native open/save file dialogs
3. **Persistent Storage**: Replace localStorage with filesystem
4. **App Information**: Get version, platform, and more
5. **Backward Compatibility**: Web version still works with localStorage

## Architecture

```
React Component
      ↓
useElectronAPI/useElectronFiles hooks
      ↓
↙─────────────────────────────────────→
Web (localStorage)           Desktop (Electron IPC)
                                   ↓
                          preload.ts (contextBridge)
                                   ↓
                           main.ts (IPC handlers)
                                   ↓
                          Filesystem/Native APIs
```

## Integration Steps

### Step 1: Update App.tsx

```typescript
import { useElectronAPI } from '../hooks/useElectron';

export function App() {
  const { electronAPI } = useElectronAPI();
  const isElectron = electronAPI !== null;

  return (
    <div>
      {isElectron && <DesktopFeatures />}
      {/* Rest of app */}
    </div>
  );
}
```

### Step 2: Use Electron Storage in Services

**Before (using localStorage):**
```typescript
// apiKeyManager.ts
class ApiKeyManager {
  saveApiKey(provider: string, key: string) {
    localStorage.setItem(`api-key-${provider}`, encryptedKey);
  }
}
```

**After (works in both environments):**
```typescript
import { electronStorage } from './electronStorage';

class ApiKeyManager {
  async saveApiKey(provider: string, key: string) {
    await electronStorage.setItem(`api-key-${provider}`, encryptedKey);
  }
}
```

The `electronStorage` service automatically:
- Uses Electron IPC if available
- Falls back to localStorage in web
- Handles all serialization

### Step 3: Add File Import in Components

```typescript
import { useElectronDialogs, useElectronFiles } from '../hooks/useElectron';

export function ImportCSV() {
  const { showOpenDialog } = useElectronDialogs();
  const { readFile } = useElectronFiles();

  const handleImport = async () => {
    const result = await showOpenDialog({
      title: 'Import HS Codes',
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    });

    if (!result.canceled) {
      const content = await readFile(result.filePaths[0]);
      // Process CSV content
    }
  };

  return (
    <button onClick={handleImport}>
      Import CSV
    </button>
  );
}
```

## File Structure Reference

### Electron Main Process Files

| File | Purpose | Runtime |
|------|---------|---------|
| `electron/main.ts` | Entry point, window creation, IPC handlers | Node.js (main) |
| `electron/preload.ts` | Security bridge, exposes safe API to renderer | Node.js (preload) |
| `electron/tsconfig.json` | Compiler config for Electron code | - |

### React/Type Files

| File | Purpose | Runtime |
|------|---------|---------|
| `src/types/electron.ts` | TypeScript interfaces for Electron API | Browser |
| `src/hooks/useElectron.ts` | React hooks wrapping Electron IPC | Browser |
| `src/services/electronStorage.ts` | Storage abstraction layer | Browser |
| `src/components/DesktopFeatures.tsx` | Desktop-specific UI | Browser |

## API Reference

### useElectronAPI()

```typescript
const { electronAPI, isLoading, isElectron } = useElectronAPI();

// Returns null in web environment
if (!electronAPI) return <WebOnlyComponent />;
```

### useElectronFiles()

```typescript
const { readFile, writeFile, deleteFile, listFiles, fileExists, error } = useElectronFiles();

// Read file from user data directory
const content = await readFile('storage/data.json');

// Write file
await writeFile('storage/data.json', JSON.stringify(data));

// List directory
const files = await listFiles('storage');

// Check if file exists
const exists = await fileExists('storage/data.json');

// Delete file
await deleteFile('storage/data.json');
```

### useElectronDialogs()

```typescript
const { showOpenDialog, showSaveDialog, error } = useElectronDialogs();

// Open file dialog
const result = await showOpenDialog({
  title: 'Open File',
  defaultPath: '/home/user/Documents',
  filters: [{ name: 'JSON', extensions: ['json'] }],
  properties: ['openFile', 'multiSelections']
});

// result.canceled: boolean
// result.filePaths: string[]

// Save file dialog
const saveResult = await showSaveDialog({
  title: 'Save File',
  defaultPath: 'data.json',
  filters: [{ name: 'JSON', extensions: ['json'] }]
});

// saveResult.canceled: boolean
// saveResult.filePath: string | undefined
```

### useAppInfo()

```typescript
const { appInfo, loading } = useAppInfo();

if (loading) return <Spinner />;

console.log(appInfo.version);     // "1.0.0"
console.log(appInfo.platform);    // "win32", "darwin", "linux"
console.log(appInfo.arch);        // "x64", "x32", etc.
console.log(appInfo.isPackaged);  // true if built, false if dev
```

### electronStorage

```typescript
import { electronStorage } from '../services/electronStorage';

// Basic operations
await electronStorage.setItem('key', 'value');
const value = await electronStorage.getItem('key');
await electronStorage.removeItem('key');
await electronStorage.clear();

// Get all keys
const keys = await electronStorage.keys();

// Get storage size
const sizeInBytes = await electronStorage.getSize();

// Bulk operations
await electronStorage.setMultiple({
  'key1': 'value1',
  'key2': 'value2'
});

const items = await electronStorage.getMultiple(['key1', 'key2']);

// Large data
await electronStorage.setLargeData('embeddings', largeArray);
const data = await electronStorage.getLargeData('embeddings');
```

## Data Directory Structure

When running as desktop app, data is stored in:
```
C:\Users\YourUser\AppData\Roaming\hs-code-finder\
├── storage/
│   ├── api-key-openai.json
│   ├── api-key-cohere.json
│   ├── api-key-huggingface.json
│   ├── embeddings/
│   │   ├── openai-small.json
│   │   ├── cohere.json
│   │   └── huggingface.json
│   └── search-history.json
└── temp/
    └── imports/
```

On macOS: `~/Library/Application Support/hs-code-finder/`
On Linux: `~/.config/hs-code-finder/`

## Security Considerations

### ✅ Good Practices

1. **API Keys**: Always encrypt in storage
```typescript
const encrypted = CryptoJS.AES.encrypt(key, masterPassword).toString();
await electronStorage.setItem('api-key', encrypted);
```

2. **File Validation**: Validate imported files
```typescript
const content = await readFile(path);
const data = JSON.parse(content); // Might throw
validateHSCodeFormat(data);
```

3. **User Data**: Store only in userData directory
```typescript
// ✅ Good
await electronAPI.writeFile('storage/data.json', content);

// ❌ Bad
await electronAPI.writeFile('../../system/file.json', content);
```

### ⚠️ Security Notes

- **Preload script** uses `contextIsolation: true` to prevent exploits
- **No direct Node.js access** from React components
- **IPC validation** in main.ts checks paths
- **Encrypted** API keys with user-managed passwords

## Debugging

### Enable DevTools

In development mode, DevTools automatically open. Use:
- `Ctrl+Shift+I`: Open DevTools
- `Ctrl+Shift+D`: Toggle DevTools
- `F12`: Reload DevTools

### Check IPC Messages

In DevTools console:
```typescript
// Monitor IPC
console.log('IPC ready');

// Test Electron API
window.electronAPI.getAppVersion().then(v => console.log(v));
```

### View User Data Files

```powershell
# Windows
explorer "$env:APPDATA\hs-code-finder"

# macOS
open ~/Library/Application\ Support/hs-code-finder/

# Linux
nautilus ~/.config/hs-code-finder/
```

## Common Patterns

### Pattern 1: Conditional Rendering

```typescript
function MyComponent() {
  const { electronAPI } = useElectronAPI();

  if (electronAPI) {
    return <DesktopVersion />;
  }

  return <WebVersion />;
}
```

### Pattern 2: CSV Import with Validation

```typescript
async function importCSV() {
  const { showOpenDialog } = useElectronDialogs();
  const { readFile } = useElectronFiles();

  const result = await showOpenDialog({
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  });

  if (result.canceled) return;

  try {
    const content = await readFile(result.filePaths[0]);
    const rows = content.split('\n').map(row => row.split(','));
    const validated = validateHSCodes(rows);
    await saveToStorage(validated);
  } catch (error) {
    setError(`Import failed: ${error.message}`);
  }
}
```

### Pattern 3: Export with User Choice

```typescript
async function exportResults(results) {
  const { showSaveDialog } = useElectronDialogs();
  const { writeFile } = useElectronFiles();

  const formats = [
    { name: 'JSON', extensions: ['json'] },
    { name: 'CSV', extensions: ['csv'] }
  ];

  const result = await showSaveDialog({
    filters: formats,
    defaultPath: `hs-codes-${Date.now()}`
  });

  if (!result.canceled && result.filePath) {
    const data = formatResults(results, result.filePath);
    await writeFile(result.filePath, data);
  }
}
```

## Troubleshooting

### Electron API is undefined

**Problem**: `window.electronAPI` is undefined

**Solutions**:
1. Make sure app is running with `npm run dev` (not `npm run dev:web`)
2. Check that preload.ts is being loaded (see DevTools console)
3. Verify `contextIsolation: true` in main.ts BrowserWindow

### IPC handler timeouts

**Problem**: Request hangs without response

**Solutions**:
1. Check main.ts IPC handler returns a value
2. Verify path is within userData directory
3. Check filesystem permissions

### Files not persisting

**Problem**: Files written but not found on reload

**Solutions**:
1. Verify directory exists: `electronAPI.fileExists('storage')`
2. Check userData path: `electronAPI.getUserDataPath()`
3. Ensure `await` is used with async functions

## Next Steps

1. ✅ Implement CSV batch import with file dialog
2. ✅ Add search history persistence
3. ✅ Export results to CSV/JSON
4. ✅ Auto-backup embeddings locally
5. ✅ Implement SQLite database (Phase 4)

## Resources

- [Electron Security](https://www.electronjs.org/docs/tutorial/security)
- [IPC Communication](https://www.electronjs.org/docs/tutorial/ipc)
- [Context Isolation](https://www.electronjs.org/docs/tutorial/context-isolation)
- [electron-builder Configuration](https://www.electron.build/)