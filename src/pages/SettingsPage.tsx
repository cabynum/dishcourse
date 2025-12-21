/**
 * SettingsPage - Where users can export and import their data.
 *
 * Fulfills Constitution principle IV: Data Ownership.
 * Provides a single-action export (SC-006) and easy import.
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Upload, Check } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useExport, useDishes, usePlans } from '@/hooks';

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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b backdrop-blur-sm"
        style={{
          backgroundColor: 'rgba(255, 254, 247, 0.95)',
          borderColor: 'var(--color-bg-muted)',
        }}
      >
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-2 rounded-xl transition-colors hover:bg-black/5 focus:outline-none focus-visible:ring-2"
              style={{ color: 'var(--color-text)' }}
              aria-label="Go back"
            >
              <ArrowLeft size={20} strokeWidth={2} />
            </button>
            <div>
              <h1
                className="text-xl font-bold"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-text)',
                }}
              >
                Settings
              </h1>
              <p style={{ color: 'var(--color-text-muted)' }} className="text-sm">
                Manage your data
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Success message */}
        {successMessage && (
          <div
            className="mb-6 p-4 rounded-xl flex items-center gap-3 animate-fade-in"
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}
            role="status"
          >
            <span style={{ color: 'var(--color-success)' }}>
              <Check size={20} strokeWidth={2.5} />
            </span>
            <p className="text-sm" style={{ color: 'var(--color-success)' }}>
              {successMessage}
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            className="mb-6 p-4 rounded-xl"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
            role="alert"
          >
            <p className="text-sm" style={{ color: 'var(--color-error)' }}>
              {error}
            </p>
          </div>
        )}

        {/* Data Export Section */}
        <section className="mb-8">
          <h2
            className="text-lg font-semibold mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text)',
            }}
          >
            Export Your Data
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Download all your dishes and meal plans as a JSON file. You can use
            this to back up your data or transfer it to another device.
          </p>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                  Your data
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {itemSummary}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleExport}
                disabled={itemCount === 0}
                aria-label="Export data"
              >
                <span className="flex items-center gap-2">
                  <Download size={20} strokeWidth={2} />
                  <span>Export</span>
                </span>
              </Button>
            </div>
          </Card>
        </section>

        {/* Data Import Section */}
        <section>
          <h2
            className="text-lg font-semibold mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text)',
            }}
          >
            Import Data
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Restore from a backup or transfer data from another device. This
            will replace your current data.
          </p>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                  Select a backup file
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  JSON format only
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={handleImportClick}
                disabled={isImporting}
                aria-label="Import data"
              >
                <span className="flex items-center gap-2">
                  <Upload size={20} strokeWidth={2} />
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-confirm-title"
          >
            <Card padding="lg" className="max-w-sm w-full animate-fade-in">
              <div className="space-y-4">
                <h3
                  id="import-confirm-title"
                  className="text-lg font-semibold text-center"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--color-text)',
                  }}
                >
                  Replace existing data?
                </h3>
                <p className="text-center" style={{ color: 'var(--color-text-muted)' }}>
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
