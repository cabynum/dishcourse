# Part 8: Data Export

*Fulfilling the Constitution's promise of data ownership.*

---

## The Goal

Phase 7 implements data export and import — a core requirement from the Constitution:

> **Principle IV: Data Ownership**
> User data MUST be portable and never locked in.
>
> - Export functionality MUST be available from day one
> - Data format MUST be human-readable (JSON, CSV, or similar)
> - No vendor lock-in for storage or hosting

This phase delivers on that promise with a single-tap export.

## Architecture

```text
SettingsPage → useExport hook → StorageService.exportData()
                     ↓
              Blob download → dishcourse-export-YYYY-MM-DD.json
```

The existing `StorageService` already had `exportData()` and `importData()` functions
from Phase 1 (Task 1.4). This phase wraps them in a user-facing hook and UI.

## The useExport Hook

The hook provides three main functions:

```typescript
interface UseExportReturn {
  exportToFile: () => void;           // Download JSON file
  importFromFile: (file: File) => Promise<ImportResult>;
  isImporting: boolean;
  error: string | null;
  clearError: () => void;
}
```

### Export Implementation

Export creates a Blob and triggers a download:

```typescript
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
```

The filename includes the current date for easy identification:
`dishcourse-export-2024-12-18.json`

### Import Implementation

Import reads a file and validates the format:

```typescript
const importFromFile = async (file: File): Promise<ImportResult> => {
  // Validate file type
  if (!file.name.endsWith('.json') && file.type !== 'application/json') {
    throw new Error('Please select a JSON file');
  }

  // Read and import
  const content = await readFileAsText(file);
  importData(content);  // From StorageService

  return { success: true, message: 'Data imported successfully!' };
};
```

## The Settings Page

A dedicated settings page keeps the UI clean:

### Layout

- **Header** with back navigation
- **Export section** with data count and download button
- **Import section** with file picker and warning about replacement

### Smart UX Decisions

1. **Disabled when empty** — Export button is disabled until there's data to export
2. **Confirmation dialog** — Import shows a warning when replacing existing data
3. **Success feedback** — Clear messages after export/import
4. **Auto-navigation** — Returns home after successful import

### Accessibility

- All buttons have proper `aria-label` attributes
- Success messages use `role="status"`
- Error messages use `role="alert"`
- Modal has `aria-modal="true"`

## Connecting to HomePage

Added a settings gear icon to the header:

```tsx
<button onClick={handleSettingsClick} aria-label="Settings">
  <SettingsIcon />
</button>
```

The icon is subtle but discoverable — consistent with mobile app patterns.

## Testing Challenges

Testing file downloads in jsdom required some creativity:

```typescript
// Mock URL methods for file download
vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
});
```

Testing file imports worked more naturally using the File API:

```typescript
const validData = JSON.stringify({
  exportedAt: '2024-01-01',
  version: 1,
  dishes: [...],
  plans: [],
});

const file = new File([validData], 'export.json', {
  type: 'application/json'
});

fireEvent.change(fileInput, { target: { files: [file] } });
```

## The Export Format

The exported JSON is human-readable and complete:

```json
{
  "exportedAt": "2024-12-18T12:00:00.000Z",
  "version": 1,
  "dishes": [
    {
      "id": "abc-123",
      "name": "Grilled Chicken",
      "type": "entree",
      "createdAt": "2024-12-15T10:30:00Z",
      "updatedAt": "2024-12-15T10:30:00Z"
    }
  ],
  "plans": [...]
}
```

The `version` field enables future migrations if the schema changes.

## What We Built

| Component | Purpose |
| --------- | ------- |
| `useExport` hook | File download/upload logic |
| `SettingsPage` | Export/import UI |
| Settings icon | Entry point from HomePage |
| 37 new tests | Hook (14) + Page (23) |

## Success Criteria

- ✅ **SC-006**: All user data can be exported with a single action

The export button downloads everything in one tap.

## Next Up

**Phase 8: Final Polish** — The last phase before the app is production-ready:

- Loading skeletons
- Error boundaries
- Accessibility audit
- Performance check
- Mobile testing on real devices

---

Total tests: 491 | All core features complete

December 2025
