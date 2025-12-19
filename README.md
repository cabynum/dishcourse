```
     _    _ _  ____            _        
    / \  | (_)/ ___|___   ___ | | _____ 
   / _ \ | | | |   / _ \ / _ \| |/ / __|
  / ___ \| | | |__| (_) | (_) |   <\__ \
 /_/   \_\_|_|\____\___/ \___/|_|\_\___/
                                        
        Your Meal Planning Companion
```

# AliCooks

A mobile-first meal planning app that helps you decide what to cook. Add your favorite dishes, get random meal suggestions, and plan your weekly menu—all from your phone.

## Features

### Dish Collection
- Add dishes with type classification (Entree, Side, Other)
- Edit and delete dishes anytime
- Filter by dish type when your collection grows
- Automatic title case formatting

### Meal Suggestions
- Random entree + side pairing with one tap
- "Try Another" for instant re-rolls
- Works with any collection size

### Meal Planning
- Create plans for 3, 5, 7, or 14 days
- Assign dishes to each day
- See progress at a glance
- Access saved plans from the homepage

### Data Ownership
- Export your data as JSON anytime
- Import data to restore or migrate
- No accounts, no cloud lock-in
- Everything stored locally in your browser

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/cabynum/alicooks.git
cd alicooks

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open http://localhost:5173 in your browser (or scan the QR code for mobile).

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready to deploy to any static hosting service.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 with TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| Storage | localStorage (browser) |
| Testing | Vitest + React Testing Library |

## Project Structure

```
src/
  components/
    meals/      # Domain components (DishCard, PlanCard, etc.)
    ui/         # Generic UI components (Button, Input, Card)
  hooks/        # Custom React hooks (useDishes, usePlans, etc.)
  pages/        # Route components
  services/     # Storage and suggestion logic
  types/        # TypeScript type definitions
tests/          # Mirror of src/ structure
specs/          # Feature specifications
blog/           # Development blog posts
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

Current test count: **554 tests** across 26 test files.

## Design Principles

AliCooks follows a strict constitution that prioritizes:

1. **User-First Simplicity** - No feature should need a manual
2. **Delight Over Features** - Polish over quantity
3. **Smart Defaults** - Works without configuration
4. **Data Ownership** - Export everything, no lock-in
5. **Mobile-Ready** - Phone is the primary target

See `.specify/memory/constitution.md` for the full constitution.

## Development Blog

The `blog/` directory contains a series of posts documenting the development process:

- Part 1: Project Setup
- Part 2: Specification
- Part 3: Foundation
- Part 4: First Feature
- Part 5: View Dishes
- Part 6: Meal Suggestions
- Part 7: Complete Flow
- Part 8: Data Export

## License

MIT

---

Built with care for Ali, who just wants to know what's for dinner.

