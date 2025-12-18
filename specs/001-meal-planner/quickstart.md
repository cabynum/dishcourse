# Quickstart: Meal Planner Development

**Branch**: `001-meal-planner` | **Date**: 2024-12-15

Get the development environment running in under 5 minutes.

## Prerequisites

- **Node.js** 18+ (check with `node --version`)
- **npm** 9+ or **pnpm** 8+ (check with `npm --version` or `pnpm --version`)
- A code editor (VS Code recommended)

## Setup

### 1. Clone and Install

```bash
# Clone the repository (if not already done)
git clone <repo-url> alicooks
cd alicooks

# Switch to feature branch
git checkout 001-meal-planner

# Install dependencies
npm install
# or: pnpm install
```

### 2. Start Development Server

```bash
npm run dev
# or: pnpm dev
```

The app will be available at `http://localhost:5173`

### 3. Run Tests

```bash
# Run all tests
npm test
# or: pnpm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```text
src/
├── components/          # Reusable UI components
│   ├── ui/              # Design system primitives (Button, Input, Card)
│   └── meals/           # Meal-specific components (MealCard, MealForm)
├── pages/               # Top-level page components
├── hooks/               # Custom React hooks (useMeals, usePlans)
├── services/            # Business logic (StorageService, SuggestionService)
├── types/               # TypeScript type definitions
└── utils/               # Helper functions

public/
├── manifest.json        # PWA manifest
└── icons/               # App icons

tests/                   # Test files mirror src/ structure
```

## Key Commands

| Command | Description |
| --------- | ------------- |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Development Workflow

### Adding a New Component

1. Create component file in appropriate directory
2. Create test file in `tests/` with matching structure
3. Export from index file if shared
4. Write tests first or alongside implementation

### Making Changes

1. Create a focused branch (if not on feature branch)
2. Make small, atomic commits
3. Run tests before pushing
4. Ensure linting passes

## Tech Stack Quick Reference

| Technology | Purpose | Docs |
| ------------ | --------- | ------ |
| React 18 | UI framework | [react.dev](https://react.dev) |
| TypeScript | Type safety | [typescriptlang.org](https://www.typescriptlang.org/docs/) |
| Vite | Build tool | [vitejs.dev](https://vitejs.dev) |
| Tailwind CSS | Styling | [tailwindcss.com](https://tailwindcss.com/docs) |
| Vitest | Testing | [vitest.dev](https://vitest.dev) |
| React Router | Routing | [reactrouter.com](https://reactrouter.com) |

## Debugging Tips

### Data Inspection

Open browser DevTools and check localStorage:

```javascript
// View all meals
JSON.parse(localStorage.getItem('alicooks_meals'))

// View all plans
JSON.parse(localStorage.getItem('alicooks_plans'))

// Clear all data (for testing fresh start)
localStorage.clear()
```

### Common Issues

**Port already in use**:

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**Dependencies out of date**:

```bash
rm -rf node_modules
npm install
```

**TypeScript errors after pulling**:

```bash
# Restart the TS server in VS Code
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

## Design Resources

- **Colors**: Defined in `tailwind.config.js`
- **Typography**: System font stack (fast loading)
- **Spacing**: Use Tailwind's spacing scale (4, 8, 12, 16, 24, 32, 48)
- **Touch targets**: Minimum 44px height for tappable elements

## Mobile Testing

1. Start dev server: `npm run dev`
2. Find your local IP: `ipconfig getifaddr en0` (Mac)
3. Access from phone: `http://YOUR_IP:5173`
4. Or use browser DevTools mobile emulation

## Next Steps

After setup, start with:

1. **Task 1**: Scaffold project structure
2. **Task 2**: Implement StorageService
3. **Task 3**: Build MealCard component
4. **Task 4**: Create AddMealPage

See `tasks.md` for the full implementation plan.
