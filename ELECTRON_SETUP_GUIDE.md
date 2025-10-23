# Electron Desktop App Setup Guide

This guide walks you through setting up the Electron desktop application for HS Code Finder on Windows.

## Prerequisites

- Node.js 16+ (download from https://nodejs.org/)
- Windows 10 or later
- ~500MB disk space for development

## Project Structure

```
hs-code-finder/
├── electron/
│   ├── main.ts          # Electron main process
│   ├── preload.ts       # Security bridge to renderer
│   ├── tsconfig.json    # TypeScript config for Electron
│   └── package.json     # Electron-specific dependencies
├── src/
│   ├── components/      # React components (shared with web)
│   ├── hooks/
│   │   ├── useHSCodeSearch.ts   # Original hook
│   │   └── useElectron.ts       # NEW: Electron API hooks
│   ├── services/        # Business logic
│   ├── types/
│   │   ├── hsCode.ts    # HS code types
│   │   ├── embedding.ts # Embedding types
│   │   └── electron.ts  # NEW: Electron API types
│   ├── components/
│   │   ├── ApiKeyManager.tsx
│   │   ├── SearchForm.tsx
│   │   ├── ResultsList.tsx
│   │   └── DesktopFeatures.tsx  # NEW: Desktop-specific component
│   └── services/
│       ├── apiKeyManager.ts
│       ├── vectorSearch.ts
│       └── electronStorage.ts   # NEW: Electron storage backend
├── dist/                # Build output
│   ├── index.html       # Web app
│   └── electron/        # Electron compiled code
├── vite.config.ts       # Web build config
└── package.json         # Root dependencies
```

## Phase 1: Initial Setup

### Step 1: Install Dependencies

```powershell
cd d:\Projects\misc\hs-code-finder
npm install
```

This installs all dependencies from the main `package.json`.

### Step 2: Install Electron Dependencies

The Electron packages are already listed in `package.json`:
- `electron`: Electron framework
- `electron-builder`: Packaging and distribution
- `electron-is-dev`: Dev mode detection
- `fs-extra`: File system utilities

### Step 3: Verify Project Structure

Make sure these files exist:
- `electron/main.ts` - Electron main process
- `electron/preload.ts` - Security preload script
- `electron/tsconfig.json` - TypeScript config
- `src/types/electron.ts` - Electron API types
- `src/hooks/useElectron.ts` - React hooks for Electron
- `src/services/electronStorage.ts` - Storage service

## Phase 2: Development

### Start Development Server

```powershell
npm run dev
```

This command:
1. Starts Vite dev server on http://localhost:5173
2. Waits for server to be ready
3. Launches Electron app pointing to dev server
4. Enables hot module replacement (HMR)

The app will reload when you change React code. Electron code requires manual restart.

### Start Just the Web Dev Server

```powershell
npm run dev:web
```

Runs Vite on http://localhost:5173 for web development only.

### Start Just Electron (after web server is running)

```powershell
npm run dev:electron
```

Only launch Electron app without starting Vite.

## Phase 3: Building

### Build for Development (with DevTools)

```powershell
npm run build:web
npm run build:electron
npm run dev:electron
```

Produces unoptimized build for debugging.

### Build for Production

```powershell
npm run build
```

This:
1. Builds React app with Vite (minified, optimized)
2. Compiles Electron code to `dist/electron/`
3. Output ready for packaging

### Package as Executable

```powershell
npm run dist:win
```

Creates:
- `HS Code Finder Setup 1.0.0.exe` - Installer (NSIS)
- `HS Code Finder 1.0.0.exe` - Portable executable

The files are in `dist/` folder, ready to distribute.

## Key Electron Features

### 1. File Operations

```typescript
const { electronAPI } = useElectronAPI();

// Read file
const content = await electronAPI.readFile('storage/data.json');

// Write file
await electronAPI.writeFile('storage/data.json', JSON.stringify(data));

// List files
const files = await electronAPI.listFiles('storage/');

// Delete file
await electronAPI.deleteFile('storage/old-data.json');
```

### 2. File Dialogs

```typescript
const { showOpenDialog, showSaveDialog } = useElectronDialogs();

// Open file
const result = await showOpenDialog({
  title: 'Open File',
  filters: [{ name: 'JSON', extensions: ['json'] }]
});

// Save file
const saveResult = await showSaveDialog({
  title: 'Save File',
  defaultPath: 'data.json'
});
```

### 3. Electron Storage (Replaces localStorage)

```typescript
import { electronStorage } from '../services/electronStorage';

// Store data
await electronStorage.setItem('api-key', encryptedKey);

// Retrieve data
const key = await electronStorage.getItem('api-key');

// Clear all
await electronStorage.clear();

// Get size
const sizeInBytes = await electronStorage.getSize();
```

### 4. App Info

```typescript
const { appInfo } = useAppInfo();

console.log(appInfo.version);    // "1.0.0"
console.log(appInfo.platform);   // "win32"
console.log(appInfo.isPackaged); // true/false
```

## Comparison: Web vs Desktop

| Feature | Web | Desktop |
|---------|-----|---------|
| Offline | ❌ Limited | ✅ Full |
| File Access | ❌ Sandboxed | ✅ Full |
| Storage | 5-10 MB | ✅ Unlimited |
| Performance | Network-bound | ✅ Local |
| Distribution | URL link | 📦 .exe installer |
| Updates | Automatic | Manual |
| Size | ~100 KB | ~200 MB |

## Troubleshooting

### Electron doesn't launch

1. Check if Vite dev server is running: http://localhost:5173
2. Check console for errors in DevTools (Ctrl+Shift+I when app is open)
3. Verify `electron/main.ts` is compiled:
   ```powershell
   npm run build:electron
   ```

### Hot reload not working

1. Make sure dev server is running (`npm run dev:web`)
2. Close and restart the app
3. Check that `isDev` variable is true in main.ts

### File operations fail

1. Verify `src/types/electron.ts` is imported in components
2. Check that app is running in Electron (not browser)
3. Verify file paths use forward slashes: `storage/data.json`

### Build fails

1. Clear cache:
   ```powershell
   rm -r node_modules dist
   npm install
   npm run build
   ```

2. Check TypeScript errors:
   ```powershell
   npm run type-check
   ```

## Next Steps

1. **Test Desktop Features**: Run `npm run dev` and try import/export
2. **Customize Branding**: Update app name, icon in `electron/main.ts`
3. **Add Auto-Update**: Implement electron-updater
4. **Package for Distribution**: Use `npm run dist:win` to create installer

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder Guide](https://www.electron.build/)
- [IPC Communication](https://www.electronjs.org/docs/tutorial/ipc)
- [Security Best Practices](https://www.electronjs.org/docs/tutorial/security)