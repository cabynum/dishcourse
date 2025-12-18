# Research: Meal Planner

**Branch**: `001-meal-planner` | **Date**: 2024-12-15

This document captures technology decisions and their rationale for the Meal Planner feature.

## Decision 1: Progressive Web App (PWA)

**Decision**: Build as a PWA rather than native mobile app

**Rationale**:

- Works on all devices (iPhone, Android, desktop) from one codebase
- Can be "installed" to home screen, feels like a native app
- No app store approval process or fees
- Easier to update — deploy once, everyone gets the new version
- Aligns with Constitution principle IV (Data Ownership) — no platform lock-in

**Alternatives Considered**:

| Alternative | Why Rejected |
| ------------- | -------------- |
| Native iOS (Swift) | Platform lock-in, requires Mac for development, app store process |
| Native Android (Kotlin) | Platform lock-in, doesn't serve iOS users |
| React Native | More complexity for cross-platform, still needs app store |
| Flutter | Learning curve, Dart is less common than TypeScript |

## Decision 2: React 18 with TypeScript

**Decision**: Use React 18 with TypeScript for the frontend framework

**Rationale**:

- Component-based architecture matches the UI structure (meals, plans, suggestions)
- TypeScript catches errors at compile time, reducing runtime bugs
- Large ecosystem of libraries and community support
- Good tooling (VS Code, ESLint, Prettier)
- Familiar to many developers if project needs contributors later

**Alternatives Considered**:

| Alternative | Why Rejected |
| ------------- | -------------- |
| Svelte | Simpler syntax but smaller ecosystem, fewer resources |
| Vue 3 | Good option, but React has broader adoption |
| Vanilla JS | No compile-time type checking, harder to maintain as app grows |
| Angular | Too heavyweight for this scope, steep learning curve |

## Decision 3: Vite for Build Tooling

**Decision**: Use Vite 5 as the build tool and dev server

**Rationale**:

- Extremely fast hot module replacement (HMR)
- Native ES modules in development
- Simple configuration compared to Webpack
- Built-in support for TypeScript, React, and PWA plugins
- Produces optimized production builds

**Alternatives Considered**:

| Alternative | Why Rejected |
| ------------- | -------------- |
| Create React App | Deprecated, slower, less flexible |
| Webpack | More complex configuration, slower dev experience |
| Parcel | Less ecosystem support, fewer plugins |

## Decision 4: Tailwind CSS for Styling

**Decision**: Use Tailwind CSS 3 for styling

**Rationale**:

- Mobile-first utility classes align with Constitution principle V
- Rapid iteration — style directly in components
- Consistent spacing, colors, and typography out of the box
- Small production bundle (purges unused styles)
- Great for responsive design without writing custom media queries

**Alternatives Considered**:

| Alternative | Why Rejected |
| ------------- | -------------- |
| CSS Modules | More boilerplate, slower iteration |
| Styled Components | Runtime overhead, more complex setup |
| Plain CSS | Harder to maintain consistency, more verbose |
| Bootstrap | Heavier, less customizable, dated aesthetic |

## Decision 5: localStorage for Data Persistence

**Decision**: Use browser localStorage with JSON serialization

**Rationale**:

- Built into every browser, no dependencies
- Synchronous API is simple to use
- 5-10MB storage is plenty for meal data (text only)
- Easy to export — data is already JSON
- Aligns with Constitution principle IV (Data Ownership)

**Alternatives Considered**:

| Alternative | Why Rejected |
| ------------- | -------------- |
| IndexedDB | More complex API, overkill for this data size |
| SQLite (via WASM) | Adds significant bundle size, unnecessary complexity |
| Backend + API | Requires server, authentication, hosting — out of scope for v1 |

**Note**: If data grows beyond localStorage limits, we can migrate to IndexedDB later. The storage service will abstract this, so the rest of the app won't need to change.

## Decision 6: Vitest + React Testing Library

**Decision**: Use Vitest for test runner and React Testing Library for component tests

**Rationale**:

- Vitest is native to Vite — same config, fast execution
- React Testing Library encourages testing user behavior, not implementation
- Both have excellent TypeScript support
- Aligns with Constitution quality standard: "All code MUST be tested before merge"

**Alternatives Considered**:

| Alternative | Why Rejected |
| ------------- | -------------- |
| Jest | Slower, requires separate configuration from Vite |
| Cypress | Great for E2E but heavier for unit/component tests |
| Playwright | Better suited for E2E, not component testing |

## Decision 7: Simple Random Suggestions

**Decision**: Implement meal suggestions as randomized pairings (entree + sides)

**Rationale**:

- Meets the spec requirement without complexity
- No machine learning or preference tracking needed
- Users can tap "Try Another" to cycle through options
- Can be enhanced later if needed (favorites, frequency weighting)

**Alternatives Considered**:

| Alternative | Why Rejected |
| ------------- | -------------- |
| AI/ML recommendations | Way out of scope, requires data collection, backend |
| Rule-based pairing | Requires users to define rules, violates "Smart Defaults" |
| Weighted by recency | Adds complexity, can be added later if needed |

## Open Questions Resolved

All technical questions have been answered. No blockers for Phase 1 design.
