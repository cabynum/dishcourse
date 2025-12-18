/**
 * SettingsPage - Where users can export and import their data.
 *
 * Fulfills Constitution principle IV: Data Ownership.
 * Provides a single-action export (SC-006) and easy import.
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { useExport, useDishes, usePlans } from '@/hooks';

/**
 * Back arrow icon for navigation
 */
function BackIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

/**
 * Download icon for export button
 */
function DownloadIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

/**
 * Upload icon for import button
 */
function UploadIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

/**
 * Check icon for success state
 */
function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { exportToFile, importFromFile, isImporting, error, clearError } =
    useExport();
  const { dishes } = useDishes();
  const { plans } = usePlans();

  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    navigate('/');
  };

  /**
   * Handle export button click
   */
  const handleExport = () => {
    clearError();
    setSuccessMessage(null);
    exportToFile();
    setSuccessMessage('Data exported! Check your downloads folder.');

    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  /**
   * Handle file input change
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    clearError();
    setSuccessMessage(null);

    // Show confirmation if there's existing data
    if (dishes.length > 0 || plans.length > 0) {
      setPendingFile(file);
      setShowImportConfirm(true);
    } else {
      performImport(file);
    }

    // Reset file input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Perform the actual import
   */
  const performImport = async (file: File) => {
    const result = await importFromFile(file);
    if (result.success) {
      setSuccessMessage(result.message);
      // Navigate home after successful import to see the new data
      setTimeout(() => navigate('/'), 1500);
    }
  };

  /**
   * Confirm the import and proceed
   */
  const handleImportConfirm = () => {
    if (pendingFile) {
      performImport(pendingFile);
    }
    setShowImportConfirm(false);
    setPendingFile(null);
  };

  /**
   * Cancel the import
   */
  const handleImportCancel = () => {
    setShowImportConfirm(false);
    setPendingFile(null);
  };

  /**
   * Trigger file input click
   */
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Count of items to display
  const itemCount = dishes.length + plans.length;
  const itemSummary =
    itemCount === 0
      ? 'No data to export yet'
      : `${dishes.length} dish${dishes.length !== 1 ? 'es' : ''}, ${plans.length} plan${plans.length !== 1 ? 's' : ''}`;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className={[
                'p-2 -ml-2',
                'text-stone-600 hover:text-stone-900',
                'hover:bg-stone-100',
                'rounded-lg',
                'transition-colors duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
              ].join(' ')}
              aria-label="Go back"
            >
              <BackIcon />
            </button>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Settings</h1>
              <p className="text-sm text-stone-500">Manage your data</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Success message */}
        {successMessage && (
          <div
            className={[
              'mb-6 p-4',
              'bg-emerald-50 border border-emerald-200',
              'rounded-xl',
              'flex items-center gap-3',
              'animate-fade-in',
            ].join(' ')}
            role="status"
          >
            <span className="text-emerald-600">
              <CheckIcon />
            </span>
            <p className="text-emerald-800 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            className={[
              'mb-6 p-4',
              'bg-red-50 border border-red-200',
              'rounded-xl',
            ].join(' ')}
            role="alert"
          >
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Data Export Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-2">
            Export Your Data
          </h2>
          <p className="text-stone-600 text-sm mb-4">
            Download all your dishes and meal plans as a JSON file. You can use
            this to back up your data or transfer it to another device.
          </p>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-700 font-medium">Your data</p>
                <p className="text-stone-500 text-sm">{itemSummary}</p>
              </div>
              <Button
                variant="primary"
                onClick={handleExport}
                disabled={itemCount === 0}
                aria-label="Export data"
              >
                <span className="flex items-center gap-2">
                  <DownloadIcon />
                  <span>Export</span>
                </span>
              </Button>
            </div>
          </Card>
        </section>

        {/* Data Import Section */}
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-2">
            Import Data
          </h2>
          <p className="text-stone-600 text-sm mb-4">
            Restore from a backup or transfer data from another device. This
            will replace your current data.
          </p>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-700 font-medium">
                  Select a backup file
                </p>
                <p className="text-stone-500 text-sm">JSON format only</p>
              </div>
              <Button
                variant="secondary"
                onClick={handleImportClick}
                disabled={isImporting}
                aria-label="Import data"
              >
                <span className="flex items-center gap-2">
                  <UploadIcon />
                  <span>{isImporting ? 'Importing...' : 'Import'}</span>
                </span>
              </Button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Select file to import"
            />
          </Card>
        </section>

        {/* Import Confirmation Modal */}
        {showImportConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-confirm-title"
          >
            <Card padding="lg" className="max-w-sm w-full animate-fade-in">
              <div className="space-y-4">
                <h3
                  id="import-confirm-title"
                  className="text-lg font-semibold text-stone-900 text-center"
                >
                  Replace existing data?
                </h3>
                <p className="text-stone-600 text-center">
                  You have {dishes.length} dish{dishes.length !== 1 ? 'es' : ''}{' '}
                  and {plans.length} plan{plans.length !== 1 ? 's' : ''}.
                  Importing will replace all of this.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={handleImportCancel}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleImportConfirm}
                    className="flex-1"
                  >
                    Replace
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

