import React, { useState } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { useElectronDialogs, useElectronFiles, useAppInfo } from '../hooks/useElectron';

/**
 * Component demonstrating Electron desktop features
 * Available only in desktop app, gracefully degrades in web
 */
export function DesktopFeatures() {
  const { showOpenDialog, showSaveDialog, error: dialogError } = useElectronDialogs();
  const { readFile, writeFile, listFiles, error: fileError } = useElectronFiles();
  const { appInfo, loading: appInfoLoading } = useAppInfo();

  const [importedData, setImportedData] = useState<any>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  if (appInfoLoading) {
    return <div className="p-4">Loading app info...</div>;
  }

  if (!appInfo) {
    // Not in Electron environment
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-blue-800">
          💻 Desktop features require running as Electron app
        </p>
      </div>
    );
  }

  const handleImportCSV = async () => {
    try {
      const result = await showOpenDialog({
        title: 'Import HS Codes CSV',
        filters: [
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths[0]) {
        const filePath = result.filePaths[0];
        const content = await readFile(filePath);
        
        if (content) {
          setImportedData({
            fileName: filePath.split('/').pop(),
            lines: content.split('\n').length,
            preview: content.split('\n').slice(0, 3).join('\n')
          });
        }
      }
    } catch (err) {
      console.error('Import failed:', err);
    }
  };

  const handleExportResults = async () => {
    try {
      const result = await showSaveDialog({
        title: 'Export Search Results',
        defaultPath: `hs-codes-${new Date().toISOString().split('T')[0]}.json`,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'CSV Files', extensions: ['csv'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        const sampleData = {
          exportDate: new Date().toISOString(),
          version: appInfo.version,
          results: [
            { code: '1234.56.00', description: 'Sample HS Code', similarity: 0.95 }
          ]
        };

        await writeFile(
          result.filePath,
          JSON.stringify(sampleData, null, 2)
        );

        setExportStatus(`✓ Exported to ${result.filePath.split('/').pop()}`);
        setTimeout(() => setExportStatus(null), 3000);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Desktop Features</h3>

        {/* App Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
          <p className="text-gray-600">
            App Version: <span className="font-mono">{appInfo.version}</span>
          </p>
          <p className="text-gray-600">
            Platform: <span className="font-mono">{appInfo.platform}</span>
          </p>
        </div>

        {/* Import Section */}
        <div className="mb-4">
          <button
            onClick={handleImportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            <Upload size={18} />
            Import CSV
          </button>

          {importedData && (
            <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="font-semibold text-blue-900">{importedData.fileName}</p>
              <p className="text-sm text-blue-700">{importedData.lines} lines</p>
              <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-24">
                {importedData.preview}
              </pre>
            </div>
          )}
        </div>

        {/* Export Section */}
        <div className="mb-4">
          <button
            onClick={handleExportResults}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
          >
            <Download size={18} />
            Export Results
          </button>

          {exportStatus && (
            <div className="mt-2 p-3 bg-green-50 rounded border border-green-200">
              <p className="text-green-700">{exportStatus}</p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {(dialogError || fileError) && (
          <div className="p-3 bg-red-50 rounded border border-red-200">
            <p className="text-red-700 text-sm">{dialogError || fileError}</p>
          </div>
        )}
      </div>
    </div>
  );
}