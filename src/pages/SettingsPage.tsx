/**
 * SettingsPage - Where users can export and import their data.
 *
 * Fulfills Constitution principle IV: Data Ownership.
 * Provides a single-action export (SC-006) and easy import.
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Upload, Check, Users, ChevronRight, LogOut, User, RefreshCw, Pencil, X } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { useExport, useDishes, usePlans, useHousehold } from '@/hooks';
import { useAuthContext } from '@/components/auth';
import { devSignInWithPassword } from '@/services';
import { getUserFriendlyError } from '@/utils';

export function SettingsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { exportToFile, importFromFile, isImporting, error, clearError } =
    useExport();
  const { dishes } = useDishes();
  const { plans } = usePlans();
  const { isAuthenticated, profile, signOut, updateProfile } = useAuthContext();
  const { currentHousehold } = useHousehold();

  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSwitchingUser, setIsSwitchingUser] = useState(false);
  
  // Display name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);

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

  /**
   * Handle sign out
   */
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch {
      // Error is handled by the auth context
    }
  };

  /**
   * Start editing display name
   */
  const handleStartEditName = () => {
    setNewDisplayName(profile?.displayName || '');
    setNameError(null);
    setIsEditingName(true);
  };

  /**
   * Cancel editing display name
   */
  const handleCancelEditName = () => {
    setIsEditingName(false);
    setNewDisplayName('');
    setNameError(null);
  };

  /**
   * Save new display name
   */
  const handleSaveDisplayName = async () => {
    const trimmed = newDisplayName.trim();
    
    // Validation
    if (!trimmed) {
      setNameError('Please enter a name.');
      return;
    }
    if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters.');
      return;
    }
    if (trimmed.length > 50) {
      setNameError('Name must be 50 characters or less.');
      return;
    }
    // Check if name hasn't changed
    if (trimmed.toLowerCase() === profile?.displayName?.toLowerCase()) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    setNameError(null);

    try {
      await updateProfile({ displayName: trimmed });
      setIsEditingName(false);
      setSuccessMessage('Display name updated!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setNameError(getUserFriendlyError(err));
    } finally {
      setIsSavingName(false);
    }
  };

  /**
   * Handle dev user switch (development only)
   */
  const handleDevUserSwitch = async (email: string, password: string) => {
    if (!import.meta.env.DEV) return;
    
    setIsSwitchingUser(true);
    try {
      await devSignInWithPassword(email, password);
      setSuccessMessage(`Switched to ${email}`);
      // Reload to refresh all state
      window.location.reload();
    } catch (err) {
      console.error('Dev user switch failed:', getUserFriendlyError(err));
    } finally {
      setIsSwitchingUser(false);
    }
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

        {/* Account Section - only show when authenticated */}
        {isAuthenticated && profile && (
          <section className="mb-8">
            <h2
              className="text-lg font-semibold mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text)',
              }}
            >
              Account
            </h2>

            <Card padding="md">
              {isEditingName ? (
                /* Edit Name Mode */
                <div className="space-y-4">
                  <Input
                    label="Display name"
                    value={newDisplayName}
                    onChange={setNewDisplayName}
                    placeholder="Your name"
                    autoFocus
                    disabled={isSavingName}
                    error={nameError ?? undefined}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={handleCancelEditName}
                      disabled={isSavingName}
                      className="flex-1"
                    >
                      <span className="flex items-center gap-2">
                        <X size={18} strokeWidth={2} />
                        <span>Cancel</span>
                      </span>
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSaveDisplayName}
                      loading={isSavingName}
                      disabled={isSavingName}
                      className="flex-1"
                    >
                      <span className="flex items-center gap-2">
                        <Check size={18} strokeWidth={2} />
                        <span>Save</span>
                      </span>
                    </Button>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Choose a unique name. Names are case-insensitive.
                  </p>
                </div>
              ) : (
                /* View Mode */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-accent)' }}
                      >
                        <User size={20} style={{ color: 'var(--color-primary)' }} />
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                          {profile.displayName || 'User'}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          {profile.email}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartEditName}
                      className="p-2 rounded-lg transition-colors hover:bg-black/5"
                      style={{ color: 'var(--color-text-muted)' }}
                      aria-label="Edit display name"
                    >
                      <Pencil size={18} strokeWidth={2} />
                    </button>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleSignOut}
                    fullWidth
                    aria-label="Sign out"
                  >
                    <span className="flex items-center gap-2">
                      <LogOut size={18} strokeWidth={2} />
                      <span>Sign Out</span>
                    </span>
                  </Button>
                </div>
              )}
            </Card>
          </section>
        )}

        {/* Share with Family Section */}
        <section className="mb-8">
          <h2
            className="text-lg font-semibold mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text)',
            }}
          >
            Share with Family
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            {currentHousehold
              ? 'Manage your household and invite family members.'
              : 'Create a household to share dishes and meal plans with family members.'}
          </p>

          <Card padding="md">
            <button
              type="button"
              onClick={() => navigate('/household')}
              className="w-full flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  <Users size={20} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div className="text-left">
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                    {currentHousehold ? currentHousehold.name : 'Get Started'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {isAuthenticated
                      ? currentHousehold
                        ? 'Manage household'
                        : 'Create or join a household'
                      : 'Sign in to collaborate'}
                  </p>
                </div>
              </div>
              <ChevronRight
                size={20}
                style={{ color: 'var(--color-text-muted)' }}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          </Card>
        </section>

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

        {/* Dev User Switcher - Development Only */}
        {import.meta.env.DEV && (
          <section className="mt-8 pt-8 border-t border-dashed" style={{ borderColor: 'var(--color-text-light)' }}>
            <h2
              className="text-lg font-semibold mb-2 flex items-center gap-2"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text-muted)',
              }}
            >
              🧪 Dev: Switch Test User
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              Switch between test accounts for collaboration testing.
              {profile && (
                <span className="block mt-1">
                  Currently signed in as: <strong>{profile.email}</strong>
                </span>
              )}
            </p>

            <div className="flex flex-col gap-3">
              <Button
                variant="secondary"
                onClick={() => handleDevUserSwitch('test@dishcourse.local', 'testpass123')}
                disabled={isSwitchingUser || profile?.email === 'test@dishcourse.local'}
                fullWidth
              >
                <span className="flex items-center gap-2">
                  {isSwitchingUser ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <User size={18} />
                  )}
                  <span>Test User 1 (test@dishcourse.local)</span>
                </span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleDevUserSwitch('test2@dishcourse.local', 'testpass456')}
                disabled={isSwitchingUser || profile?.email === 'test2@dishcourse.local'}
                fullWidth
              >
                <span className="flex items-center gap-2">
                  {isSwitchingUser ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <User size={18} />
                  )}
                  <span>Test User 2 (test2@dishcourse.local)</span>
                </span>
              </Button>
            </div>
          </section>
        )}

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
