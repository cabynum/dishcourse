# Part 9: The Sunflower & Charcoal Design System

Building a cohesive visual identity for DishCourse.

## The Problem with "Good Enough"

After completing all the core features in Parts 1-8, the app worked great
functionally. But visually? It looked like... well, every other React app with
default Tailwind colors. Stone grays, amber accents, nothing memorable.

Our Constitution's Principle II states: *"A small set of polished features beats
many half-finished ones. Ship less, but make it feel great."* The UI was
functional, but it didn't *feel* great.

## Finding Our Visual Voice

We started by creating `design-mockup.html` — an interactive playground to
experiment with color schemes without touching the React codebase. This let us
iterate quickly on:

- **Color palettes**: Forest & Cream, Sage & Terracotta, Deep Teal & Gold
- **Typography pairings**: Serif vs sans-serif headers
- **Header treatments**: Solid color vs food photography

After testing several options, we landed on **Sunflower & Charcoal**:

```css
--color-primary: #2C2C2C;      /* Charcoal */
--color-secondary: #DAA520;    /* Goldenrod */
--color-accent: #FFB800;       /* Sunflower */
--color-bg: #FFFEF7;           /* Warm white */
```

The combination feels warm, inviting, and distinctly *food-related* without
being cliché.

## CSS Variables Over Tailwind Classes

Instead of scattering `bg-amber-500` throughout the codebase, we centralized
our design tokens in `index.css`:

```css
:root {
  --color-primary: #2C2C2C;
  --color-accent: #FFB800;
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'DM Sans', sans-serif;
  /* ... */
}
```

Components then reference these variables:

```tsx
<button
  style={{ backgroundColor: 'var(--color-accent)' }}
  className="rounded-xl font-semibold"
>
  Suggest a Meal
</button>
```

This approach gives us:

1. **Easy theming** — Change one variable, update everywhere
2. **Semantic meaning** — `--color-accent` is clearer than `#FFB800`
3. **Future flexibility** — Dark mode becomes a simple variable swap

## Typography That Sets the Mood

We paired two Google Fonts:

- **Fraunces** (serif): For headings — warm, slightly quirky, memorable
- **DM Sans** (sans-serif): For body text — clean, readable, modern

The contrast creates visual hierarchy while the Fraunces gives the app
personality that generic sans-serif fonts can't match.

## The Food Photo Header

The HomePage now features rotating Unsplash food photos with a dark gradient
overlay. Each app launch shows a different image, adding visual variety without
any API calls or storage overhead.

```tsx
const HEADER_PHOTOS = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80',
  // ...
];
```

## Applying the System to Every Page

The real work was applying the design system consistently across all pages:

| Page | Key Changes |
| ---- | ----------- |
| SuggestionPage | Lucide icons, CSS variables, Fraunces headings |
| PlanPage | Accent-colored day selector, unified header |
| AddDishPage | Clean form with design system Card |
| EditDishPage | Delete button with semantic error color |
| SettingsPage | Export/import sections with consistent styling |
| DayAssignmentPage | Suggestion section with gradient background |

Each page now follows the same pattern:

- Sticky header with back navigation
- Fraunces font for page titles
- Consistent spacing and border radius
- CSS variables for all colors

## Updating the Tests

With styling now using inline CSS variables instead of Tailwind classes, we
updated our tests to verify the new approach:

```tsx
// Before
expect(button).toHaveClass('bg-amber-500');

// After
expect(button).toHaveClass('btn-primary');
expect(button.style.backgroundColor).toBe('var(--color-accent)');
```

All 627 tests pass with the new design system.

## What's Next

The app now has a cohesive visual identity. Remaining polish items:

1. **Logo design** — A distinctive mark, not generic icons
2. **User testing** — Get Aliya's feedback on the new look
3. **PWA enhancements** — Splash screen, better offline experience

---

**Commit**: `style: apply Sunflower & Charcoal design system to all pages`

[← Part 8: Data Export](./part-8-data-export.md) | [README](./README.md)

December 2025
