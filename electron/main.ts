import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import isDev from 'electron-is-dev';

let mainWindow: BrowserWindow | null = null;
const USER_DATA_PATH = path.join(app.getPath('userData'), 'hs-code-finder');

// Ensure user data directory exists
fs.ensureDirSync(USER_DATA_PATH);
fs.ensureDirSync(path.join(USER_DATA_PATH, 'embeddings'));

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true
    },
    icon: path.join(__dirname, '../assets/icon.png')
  });

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers

ipcMain.handle('get-user-data-path', () => USER_DATA_PATH);

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('read-file', async (event, filePath: string) => {
  try {
    const fullPath = path.join(USER_DATA_PATH, filePath);
    return await fs.readFile(fullPath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file: ${(error as Error).message}`);
  }
});

ipcMain.handle('write-file', async (event, filePath: string, content: string) => {
  try {
    const fullPath = path.join(USER_DATA_PATH, filePath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, 'utf-8');
    return true;
  } catch (error) {
    throw new Error(`Failed to write file: ${(error as Error).message}`);
  }
});

ipcMain.handle('list-files', async (event, dirPath: string) => {
  try {
    const fullPath = path.join(USER_DATA_PATH, dirPath);
    return await fs.readdir(fullPath);
  } catch (error) {
    throw new Error(`Failed to list files: ${(error as Error).message}`);
  }
});

ipcMain.handle('file-exists', async (event, filePath: string) => {
  const fullPath = path.join(USER_DATA_PATH, filePath);
  return await fs.pathExists(fullPath);
});

ipcMain.handle('get-file-stats', async (event, filePath: string) => {
  try {
    const fullPath = path.join(USER_DATA_PATH, filePath);
    const stats = await fs.stat(fullPath);
    return {
      size: stats.size,
      modified: stats.mtime,
      isFile: stats.isFile()
    };
  } catch (error) {
    throw new Error(`Failed to get file stats: ${(error as Error).message}`);
  }
});

ipcMain.handle('delete-file', async (event, filePath: string) => {
  try {
    const fullPath = path.join(USER_DATA_PATH, filePath);
    await fs.remove(fullPath);
    return true;
  } catch (error) {
    throw new Error(`Failed to delete file: ${(error as Error).message}`);
  }
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const { dialog } = await import('electron');
  return dialog.showOpenDialog(mainWindow!, options);
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const { dialog } = await import('electron');
  return dialog.showSaveDialog(mainWindow!, options);
});

// App info for frontend
ipcMain.handle('get-app-info', () => ({
  version: app.getVersion(),
  platform: process.platform,
  arch: process.arch,
  isPackaged: app.isPackaged
}));