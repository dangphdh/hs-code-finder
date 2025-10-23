# Conversion Plan: Web App → Desktop App (Electron)

## 1. Overview - Electron Architecture

Electron cho phép bạn build cross-platform desktop apps bằng HTML/CSS/JavaScript.

**Structure:**
```
┌─────────────────────────────────┐
│   Electron Main Process         │  (Node.js)
│  - Window management            │
│  - File system access           │
│  - Native OS integration        │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│   Web App (React)               │  (Chromium)
│  - UI rendering                 │
│  - Vector search                │
│  - Embedding providers          │
└─────────────────────────────────┘
```

## 2. Benefits of Electron App

### ✅ Advantages
- **Persistent storage** - Can store embeddings locally in SQLite/LevelDB
- **File access** - Import HS codes from CSV/Excel
- **Native OS features** - Notifications, taskbar, etc.
- **Offline first** - Works without internet
- **No browser** - Standalone executable
- **Better performance** - Direct file system access
- **Custom protocol** - Can handle custom URL schemes
- **Auto-update** - Built-in update mechanism
- **Packaged** - Single .exe file

### ❌ Disadvantages
- **Larger size** - 150-300 MB (Chromium embedded)
- **More complex** - Electron + main/renderer processes
- **Build complexity** - Need to handle packaging
- **Testing** - Desktop app testing different from web

## 3. Step-by-Step Migration Plan

### Phase 1: Setup Electron Project
```bash
# 1. Install Electron
npm install --save-dev electron

# 2. Create main process file
# electron/main.ts

# 3. Update package.json with Electron config
{
  "main": "dist/main.js",
  "homepage": "file://%PUBLIC_URL%/index.html",
  "electron-builder": {
    "productName": "HS Code Finder",
    "files": ["dist/**/*", "node_modules/**/*"],
    "win": {
      "target": ["nsis", "portable"]
    }
  }
}
```

### Phase 2: Create Main Process
```typescript
// electron/main.ts
import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  const startUrl = isDev
    ? 'http://localhost:5173'  // Dev server
    : `file://${path.join(__dirname, '../dist/index.html')}`; // Production build

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for file operations
ipcMain.handle('read-file', async (event, filePath) => {
  const fs = await import('fs').then(m => m.promises);
  return fs.readFile(filePath, 'utf-8');
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  const fs = await import('fs').then(m => m.promises);
  return fs.writeFile(filePath, content, 'utf-8');
});

ipcMain.handle('list-files', async (event, dirPath) => {
  const fs = await import('fs').then(m => m.promises);
  return fs.readdir(dirPath);
});
```

### Phase 3: Create Preload Bridge
```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
  listFiles: (dirPath: string) => ipcRenderer.invoke('list-files', dirPath),
  
  // File system access
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Notifications
  showNotification: (title: string, message: string) => ipcRenderer.invoke('show-notification', title, message)
});
```

### Phase 4: Update React App for Electron
```typescript
// src/services/storage.ts - Electron version
import { HSCode } from '../types/hsCode';

export class ElectronStorage {
  private userDataPath: string = '';

  async initialize() {
    this.userDataPath = await (window as any).electronAPI.getUserDataPath();
  }

  async saveEmbeddings(provider: string, data: HSCode[]) {
    const filePath = `${this.userDataPath}/embeddings/${provider}.json`;
    await (window as any).electronAPI.writeFile(
      filePath,
      JSON.stringify(data, null, 2)
    );
  }

  async loadEmbeddings(provider: string): Promise<HSCode[]> {
    const filePath = `${this.userDataPath}/embeddings/${provider}.json`;
    const content = await (window as any).electronAPI.readFile(filePath);
    return JSON.parse(content);
  }

  async getStorageInfo() {
    return {
      path: this.userDataPath,
      availableSpace: await this.getAvailableSpace()
    };
  }

  private async getAvailableSpace(): Promise<number> {
    // Platform-specific implementation
    return 0;
  }
}
```

### Phase 5: Database Integration
```typescript
// For large embeddings storage, use SQLite
npm install better-sqlite3

// electron/database.ts
import Database from 'better-sqlite3';
import path from 'path';

export class EmbeddingsDB {
  private db: Database.Database;

  constructor(dataPath: string) {
    this.db = new Database(
      path.join(dataPath, 'embeddings.db')
    );
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS embeddings (
        id INTEGER PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        embedding BLOB NOT NULL,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_provider_model 
      ON embeddings(provider, model);
    `);
  }

  insertEmbedding(
    code: string,
    description: string,
    embedding: Float32Array,
    provider: string,
    model: string
  ) {
    const stmt = this.db.prepare(`
      INSERT INTO embeddings (code, description, embedding, provider, model)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(code, description, Buffer.from(embedding), provider, model);
  }

  searchEmbeddings(provider: string, model: string, limit: number = 10) {
    const stmt = this.db.prepare(`
      SELECT code, description, provider, model FROM embeddings
      WHERE provider = ? AND model = ?
      LIMIT ?
    `);

    return stmt.all(provider, model, limit);
  }

  close() {
    this.db.close();
  }
}
```

## 4. New Capabilities with Electron

### A. Batch Import from CSV/Excel
```typescript
// src/services/csvImport.ts
export class CSVImporter {
  async importEmbeddings(filePath: string) {
    const content = await (window as any).electronAPI.readFile(filePath);
    const lines = content.split('\n');
    
    const embeddings = lines.map((line: string) => {
      const [code, description, ...embeddingStr] = line.split(',');
      return {
        code,
        description,
        embedding: embeddingStr.map(Number)
      };
    });

    // Save to local database
    return embeddings;
  }

  async exportResults(results: SearchResult[], filePath: string) {
    const csv = [
      ['Code', 'Description', 'Similarity', 'Chapter', 'Section'],
      ...results.map(r => [
        r.code,
        r.description,
        r.similarity.toFixed(4),
        r.chapter,
        r.section
      ])
    ]
      .map(row => row.join(','))
      .join('\n');

    await (window as any).electronAPI.writeFile(filePath, csv);
  }
}
```

### B. Local Database Storage
```typescript
// Can now store full embeddings locally
Benefits:
- No repeated downloads
- Faster subsequent opens
- Offline capability
- Selective syncing
```

### C. Native Notifications
```typescript
// IPC handler
ipcMain.handle('show-notification', (event, title: string, message: string) => {
  new Notification({
    title,
    body: message,
    icon: path.join(__dirname, '../assets/icon.png')
  });
});

// Use in React
const showSearchComplete = (count: number) => {
  (window as any).electronAPI.showNotification(
    'Search Complete',
    `Found ${count} results`
  );
};
```

### D. File Drag & Drop
```typescript
// React component
const SearchForm = () => {
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.currentTarget.style.background = '#f0f0f0';
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files) return;

    for (const file of files) {
      if (file.name.endsWith('.csv')) {
        const content = await file.text();
        await importCSV(content);
      }
    }
  };

  return (
    <div onDragOver={handleDragOver} onDrop={handleDrop}>
      Drop CSV files here
    </div>
  );
};
```

## 5. Build & Distribution

### A. Package with Electron Builder
```bash
npm install --save-dev electron-builder

# Add to package.json
{
  "build": {
    "appId": "com.hscodefinder.app",
    "productName": "HS Code Finder",
    "directories": {
      "buildResources": "assets"
    },
    "files": [
      "dist/**/*",
      "node_modules/**/*",
      "!node_modules/webpack/**"
    ],
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        },
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ],
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}

# Build
npm run build
npm run dist  # Creates .exe installer
```

### B. Build Output
```
HS Code Finder Setup 1.0.0.exe    (50 MB installer)
HS Code Finder 1.0.0.exe          (150 MB portable)
HSCodeFinder-1.0.0-x64.nsis.7z    (Compressed installer)
```

## 6. Comparison: Web vs Desktop

| Feature | Web App | Desktop (Electron) |
|---------|---------|------------------|
| **Storage** | 50 MB | Unlimited ✓ |
| **Offline** | Partial | Full ✓ |
| **Speed** | Depends on internet | Instant ✓ |
| **Distribution** | URL link | .exe file ✓ |
| **Installation** | None | Setup wizard ✓ |
| **Auto-update** | Browser cache | Built-in ✓ |
| **Native features** | Limited | Full OS access ✓ |
| **File access** | Limited | Full ✓ |
| **Size** | 100 KB | 200 MB ✓ |
| **Multi-device** | Yes ✓ | Per device |

## 7. Migration Timeline

```
Week 1: Setup Electron + basic window
Week 2: Integrate React app
Week 3: File operations + storage
Week 4: Testing & packaging
Week 5: Build .exe installer
```

## 8. New Directory Structure

```
hs-code-finder/
├── src/                    (React app)
│   └── ...
├── public/
│   └── data/
├── electron/
│   ├── main.ts            (Main process)
│   ├── preload.ts         (IPC bridge)
│   └── database.ts        (SQLite)
├── assets/
│   ├── icon.png           (App icon)
│   └── icon.ico           (Windows icon)
├── dist/                  (Build output)
├── package.json           (Updated)
├── electron-builder.json  (New)
└── tsconfig.electron.json (New)
```

## 9. Implementation Steps

### Step 1: Install Electron
```bash
npm install --save-dev electron electron-builder
npm install better-sqlite3 electron-is-dev
```

### Step 2: Create Electron files
```
electron/main.ts
electron/preload.ts
electron/database.ts
assets/icon.png
```

### Step 3: Update vite.config.ts
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-app',
  }
})
```

### Step 4: Add build scripts
```json
{
  "scripts": {
    "dev": "vite",
    "dev:electron": "electron .",
    "build": "tsc && vite build && tsc -p electron",
    "dist": "electron-builder",
    "dist:dir": "npm run build && electron-builder --dir"
  }
}
```

### Step 5: Test & Package
```bash
npm run dev:electron
npm run build
npm run dist
```

## 10. Advanced Features (Phase 2)

```
[ ] Auto-update checks
[ ] System tray integration
[ ] Keyboard shortcuts
[ ] Search indexing (Lunr.js)
[ ] Background sync
[ ] Backup/restore
[ ] Settings persistence
[ ] Analytics (local only)
[ ] Theming (dark/light)
[ ] Multi-window support
```

## Recommendation

**Start with Web App (Current):**
- ✓ Easy to share
- ✓ No installation
- ✓ Works on any device
- ✓ Collaborative

**Then add Electron App (Phase 2):**
- ✓ Local storage
- ✓ Better performance
- ✓ Offline support
- ✓ Professional packaging

**Hybrid approach:**
```
1. Keep web app live (vercel.com/hs-code-finder)
2. Build Electron for desktop users
3. Both share same React codebase
4. Native features in desktop version only
```

---

**Complexity**: Medium (2-4 weeks)  
**Benefit**: High (full offline + storage)  
**Recommended**: Yes (after MVP stabilizes)
