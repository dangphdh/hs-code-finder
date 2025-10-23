import { useEffect, useState } from 'react';
import { ElectronAPI } from '../types/electron';

/**
 * Hook to access Electron API safely
 * Returns null if running in web browser
 */
export function useElectronAPI() {
  const [electronAPI, setElectronAPI] = useState<ElectronAPI | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const api = (window as any).electronAPI || null;
    setElectronAPI(api);
    setIsLoading(false);
  }, []);

  return { electronAPI, isLoading, isElectron: electronAPI !== null };
}

/**
 * Hook for file operations in Electron
 */
export function useElectronFiles() {
  const { electronAPI } = useElectronAPI();
  const [error, setError] = useState<string | null>(null);

  const readFile = async (filePath: string): Promise<string | null> => {
    if (!electronAPI) {
      setError('Electron API not available');
      return null;
    }

    try {
      return await electronAPI.readFile(filePath);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    }
  };

  const writeFile = async (filePath: string, content: string): Promise<boolean> => {
    if (!electronAPI) {
      setError('Electron API not available');
      return false;
    }

    try {
      return await electronAPI.writeFile(filePath, content);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return false;
    }
  };

  const deleteFile = async (filePath: string): Promise<boolean> => {
    if (!electronAPI) {
      setError('Electron API not available');
      return false;
    }

    try {
      return await electronAPI.deleteFile(filePath);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return false;
    }
  };

  const listFiles = async (dirPath: string): Promise<string[]> => {
    if (!electronAPI) {
      setError('Electron API not available');
      return [];
    }

    try {
      return await electronAPI.listFiles(dirPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return [];
    }
  };

  const fileExists = async (filePath: string): Promise<boolean> => {
    if (!electronAPI) {
      return false;
    }

    try {
      return await electronAPI.fileExists(filePath);
    } catch (err) {
      return false;
    }
  };

  const clearError = () => setError(null);

  return {
    readFile,
    writeFile,
    deleteFile,
    listFiles,
    fileExists,
    error,
    clearError
  };
}

/**
 * Hook for file dialogs
 */
export function useElectronDialogs() {
  const { electronAPI } = useElectronAPI();
  const [error, setError] = useState<string | null>(null);

  const showOpenDialog = async (options?: any) => {
    if (!electronAPI) {
      setError('Electron API not available');
      return { canceled: true, filePaths: [] };
    }

    try {
      return await electronAPI.showOpenDialog(options || {});
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return { canceled: true, filePaths: [] };
    }
  };

  const showSaveDialog = async (options?: any) => {
    if (!electronAPI) {
      setError('Electron API not available');
      return { canceled: true };
    }

    try {
      return await electronAPI.showSaveDialog(options || {});
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return { canceled: true };
    }
  };

  const clearError = () => setError(null);

  return {
    showOpenDialog,
    showSaveDialog,
    error,
    clearError
  };
}

/**
 * Hook for app info
 */
export function useAppInfo() {
  const { electronAPI } = useElectronAPI();
  const [appInfo, setAppInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!electronAPI) {
      setLoading(false);
      return;
    }

    electronAPI.getAppInfo().then(info => {
      setAppInfo(info);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to get app info:', err);
      setLoading(false);
    });
  }, [electronAPI]);

  return { appInfo, loading };
}