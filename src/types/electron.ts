// Type definitions for Electron API exposed via preload
export interface ElectronAPI {
  // File operations
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  listFiles: (dirPath: string) => Promise<string[]>;
  fileExists: (filePath: string) => Promise<boolean>;
  getFileStats: (filePath: string) => Promise<FileStats>;
  deleteFile: (filePath: string) => Promise<boolean>;

  // Dialog operations
  showOpenDialog: (options: OpenDialogOptions) => Promise<OpenDialogReturnValue>;
  showSaveDialog: (options: SaveDialogOptions) => Promise<SaveDialogReturnValue>;

  // App info
  getUserDataPath: () => Promise<string>;
  getAppVersion: () => Promise<string>;
  getAppInfo: () => Promise<AppInfo>;

  // IPC listeners
  onUpdateAvailable: (callback: (version: string) => void) => void;
  removeUpdateAvailableListener: () => void;
}

export interface FileStats {
  size: number;
  modified: Date;
  isFile: boolean;
}

export interface OpenDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: string[];
}

export interface OpenDialogReturnValue {
  canceled: boolean;
  filePaths: string[];
}

export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

export interface SaveDialogReturnValue {
  canceled: boolean;
  filePath?: string;
}

export interface AppInfo {
  version: string;
  platform: string;
  arch: string;
  isPackaged: boolean;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}