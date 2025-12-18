/**
 * useExport Hook
 *
 * Provides file-based export and import functionality for user data.
 * Fulfills Constitution principle IV: Data Ownership.
 *
 * Export creates a downloadable JSON file with all dishes and plans.
 * Import reads a JSON file and replaces existing data.
 *
 * @example
 * ```tsx
 * function SettingsPage() {
 *   const { exportToFile, importFromFile, isImporting, error } = useExport();
 *
 *   return (
 *     <div>
 *       <button onClick={exportToFile}>Export Data</button>
 *       <input type="file" onChange={(e) => {
 *         const file = e.target.files?.[0];
 *         if (file) importFromFile(file);
 *       }} />
 *       {error && <p>{error}</p>}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useCallback } from 'react';
import { exportData, importData } from '@/services';

/**
 * Result of an import operation
 */
export interface ImportResult {
  success: boolean;
  message: string;
}

/**
 * Return type for the useExport hook
 */
export interface UseExportReturn {
  /** Download all data as a JSON file */
  exportToFile: () => void;

  /** Import data from a JSON file, replacing existing data */
  importFromFile: (file: File) => Promise<ImportResult>;

  /** True while an import operation is in progress */
  isImporting: boolean;

  /** Error message from the last failed operation, if any */
  error: string | null;

  /** Clear the current error */
  clearError: () => void;
}

/**
 * Generate a filename for the export with current date
 */
function generateExportFilename(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `alicooks-export-${year}-${month}-${day}.json`;
}

/**
 * Trigger a file download in the browser
 */
function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Read a file as text
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Hook for exporting and importing user data.
 *
 * Provides a clean interface for file-based data portability.
 */
export function useExport(): UseExportReturn {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Export all data as a downloadable JSON file.
   * Uses the current date in the filename for easy identification.
   */
  const exportToFile = useCallback(() => {
    setError(null);
    try {
      const jsonData = exportData();
      const filename = generateExportFilename();
      downloadFile(jsonData, filename);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to export data';
      setError(message);
    }
  }, []);

  /**
   * Import data from a JSON file, replacing all existing data.
   *
   * Validates the file is JSON and has the expected format.
   * Returns a result object indicating success or failure.
   */
  const importFromFile = useCallback(
    async (file: File): Promise<ImportResult> => {
      setError(null);
      setIsImporting(true);

      try {
        // Validate file type
        if (!file.name.endsWith('.json') && file.type !== 'application/json') {
          throw new Error('Please select a JSON file');
        }

        // Read file content
        const content = await readFileAsText(file);

        // Import the data (this validates and saves)
        importData(content);

        setIsImporting(false);
        return {
          success: true,
          message: 'Data imported successfully! Refresh to see your dishes.',
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to import data';
        setError(message);
        setIsImporting(false);
        return {
          success: false,
          message,
        };
      }
    },
    []
  );

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    exportToFile,
    importFromFile,
    isImporting,
    error,
    clearError,
  };
}

