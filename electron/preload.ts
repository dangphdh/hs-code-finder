import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI',
  {
    // File operations
    readFile: (filePath: string) =>
      ipcRenderer.invoke('read-file', filePath),
    
    writeFile: (filePath: string, content: string) =>
      ipcRenderer.invoke('write-file', filePath, content),
    
    listFiles: (dirPath: string) =>
      ipcRenderer.invoke('list-files', dirPath),
    
    fileExists: (filePath: string) =>
      ipcRenderer.invoke('file-exists', filePath),
    
    getFileStats: (filePath: string) =>
      ipcRenderer.invoke('get-file-stats', filePath),
    
    deleteFile: (filePath: string) =>
      ipcRenderer.invoke('delete-file', filePath),

    // Dialog operations
    showOpenDialog: (options: any) =>
      ipcRenderer.invoke('show-open-dialog', options),
    
    showSaveDialog: (options: any) =>
      ipcRenderer.invoke('show-save-dialog', options),

    // App info
    getUserDataPath: () =>
      ipcRenderer.invoke('get-user-data-path'),
    
    getAppVersion: () =>
      ipcRenderer.invoke('get-app-version'),
    
    getAppInfo: () =>
      ipcRenderer.invoke('get-app-info'),

    // IPC listeners
    onUpdateAvailable: (callback: (version: string) => void) =>
      ipcRenderer.on('update-available', (event: IpcRendererEvent, version: string) =>
        callback(version)
      ),

    removeUpdateAvailableListener: () =>
      ipcRenderer.removeAllListeners('update-available')
  }
);