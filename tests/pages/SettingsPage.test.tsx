/**
 * SettingsPage Tests
 *
 * Tests for the export/import settings page.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SettingsPage } from '@/pages/SettingsPage';
import { STORAGE_KEYS } from '@/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock URL methods for file download
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();

vi.stubGlobal('URL', {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL,
});

// Track navigation
let navigatedTo: string | null = null;

/**
 * Helper to render SettingsPage with router
 */
function renderSettingsPage() {
  navigatedTo = null;

  function HomePage() {
    navigatedTo = '/';
    return <div>Home Page</div>;
  }

  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    navigatedTo = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders the settings page header', () => {
      renderSettingsPage();
      expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
    });

    it('renders export section', () => {
      renderSettingsPage();
      expect(screen.getByText(/export your data/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });

    it('renders import section', () => {
      renderSettingsPage();
      expect(screen.getByText(/import data/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
    });

    it('shows correct data count with no data', () => {
      renderSettingsPage();
      expect(screen.getByText(/no data to export yet/i)).toBeInTheDocument();
    });

    it('shows correct data count with dishes', () => {
      localStorageMock.setItem(
        STORAGE_KEYS.dishes,
        JSON.stringify([
          { id: '1', name: 'Chicken', type: 'entree', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          { id: '2', name: 'Rice', type: 'side', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ])
      );

      renderSettingsPage();
      expect(screen.getByText(/2 dishes, 0 plans/i)).toBeInTheDocument();
    });

    it('shows correct data count with plans', () => {
      localStorageMock.setItem(
        STORAGE_KEYS.dishes,
        JSON.stringify([
          { id: '1', name: 'Chicken', type: 'entree', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ])
      );
      localStorageMock.setItem(
        STORAGE_KEYS.plans,
        JSON.stringify([
          { id: 'p1', name: 'Week 1', startDate: '2024-01-01', days: [], createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ])
      );

      renderSettingsPage();
      expect(screen.getByText(/1 dish, 1 plan/i)).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('navigates back when back button is clicked', async () => {
      renderSettingsPage();
      
      const backButton = screen.getByRole('button', { name: /go back/i });
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(navigatedTo).toBe('/');
      });
    });
  });

  describe('export functionality', () => {
    it('disables export button when no data', () => {
      renderSettingsPage();
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      expect(exportButton).toBeDisabled();
    });

    it('enables export button when data exists', () => {
      localStorageMock.setItem(
        STORAGE_KEYS.dishes,
        JSON.stringify([
          { id: '1', name: 'Chicken', type: 'entree', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ])
      );

      renderSettingsPage();
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      expect(exportButton).not.toBeDisabled();
    });

    it('shows success message after export', async () => {
      localStorageMock.setItem(
        STORAGE_KEYS.dishes,
        JSON.stringify([
          { id: '1', name: 'Chicken', type: 'entree', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ])
      );

      renderSettingsPage();
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);

      expect(screen.getByText(/data exported/i)).toBeInTheDocument();
    });
  });

  describe('import functionality', () => {
    it('has a hidden file input', () => {
      renderSettingsPage();
      
      const fileInput = screen.getByLabelText(/select file to import/i);
      expect(fileInput).toHaveClass('hidden');
    });

    it('accepts JSON files', () => {
      renderSettingsPage();
      
      const fileInput = screen.getByLabelText(/select file to import/i) as HTMLInputElement;
      expect(fileInput.accept).toContain('.json');
    });

    it('shows confirmation when importing with existing data', async () => {
      localStorageMock.setItem(
        STORAGE_KEYS.dishes,
        JSON.stringify([
          { id: '1', name: 'Existing', type: 'entree', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ])
      );

      renderSettingsPage();

      const validData = JSON.stringify({
        exportedAt: '2024-01-01',
        version: 1,
        dishes: [],
        plans: [],
      });

      const file = new File([validData], 'export.json', { type: 'application/json' });
      const fileInput = screen.getByLabelText(/select file to import/i);

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/replace existing data/i)).toBeInTheDocument();
      });
    });

    it('cancels import when cancel is clicked', async () => {
      localStorageMock.setItem(
        STORAGE_KEYS.dishes,
        JSON.stringify([
          { id: '1', name: 'Existing', type: 'entree', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ])
      );

      renderSettingsPage();

      const validData = JSON.stringify({
        exportedAt: '2024-01-01',
        version: 1,
        dishes: [],
        plans: [],
      });

      const file = new File([validData], 'export.json', { type: 'application/json' });
      const fileInput = screen.getByLabelText(/select file to import/i);

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/replace existing data/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/replace existing data/i)).not.toBeInTheDocument();
      });
    });

    it('imports data directly when no existing data', async () => {
      renderSettingsPage();

      const validData = JSON.stringify({
        exportedAt: '2024-01-01',
        version: 1,
        dishes: [
          { id: 'new-1', name: 'Imported', type: 'side', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ],
        plans: [],
      });

      const file = new File([validData], 'export.json', { type: 'application/json' });
      const fileInput = screen.getByLabelText(/select file to import/i);

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/imported successfully/i)).toBeInTheDocument();
      });
    });

    it('shows error for invalid file', async () => {
      renderSettingsPage();

      const file = new File(['not json'], 'data.txt', { type: 'text/plain' });
      const fileInput = screen.getByLabelText(/select file to import/i);

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('shows success message before navigation', async () => {
      renderSettingsPage();

      const validData = JSON.stringify({
        exportedAt: '2024-01-01',
        version: 1,
        dishes: [],
        plans: [],
      });

      const file = new File([validData], 'export.json', { type: 'application/json' });
      const fileInput = screen.getByLabelText(/select file to import/i);

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/imported successfully/i)).toBeInTheDocument();
      });

      // Note: navigation happens after a timeout, tested implicitly
    });
  });

  describe('accessibility', () => {
    it('has accessible back button', () => {
      renderSettingsPage();
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });

    it('has accessible export button', () => {
      renderSettingsPage();
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });

    it('has accessible import button', () => {
      renderSettingsPage();
      expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
    });

    it('shows success message with status role', async () => {
      localStorageMock.setItem(
        STORAGE_KEYS.dishes,
        JSON.stringify([
          { id: '1', name: 'Chicken', type: 'entree', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ])
      );

      renderSettingsPage();
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('shows error message with alert role', async () => {
      renderSettingsPage();

      const file = new File(['not json'], 'data.txt', { type: 'text/plain' });
      const fileInput = screen.getByLabelText(/select file to import/i);

      fireEvent.change(fileInput, { target: { files: [file] } });

      // Wait for the error alert to appear
      const alert = await screen.findByRole('alert', {}, { timeout: 2000 });
      expect(alert).toBeInTheDocument();
    });

    it('confirmation dialog has proper aria attributes', async () => {
      localStorageMock.setItem(
        STORAGE_KEYS.dishes,
        JSON.stringify([
          { id: '1', name: 'Existing', type: 'entree', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ])
      );

      renderSettingsPage();

      const validData = JSON.stringify({
        exportedAt: '2024-01-01',
        version: 1,
        dishes: [],
        plans: [],
      });

      const file = new File([validData], 'export.json', { type: 'application/json' });
      const fileInput = screen.getByLabelText(/select file to import/i);

      fireEvent.change(fileInput, { target: { files: [file] } });

      // Wait for dialog to appear
      const dialog = await screen.findByRole('dialog', {}, { timeout: 2000 });
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });
});
