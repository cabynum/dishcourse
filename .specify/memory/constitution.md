<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0
Amendment: Added mandatory markdown linting to Documentation quality standards
  - New rule: All markdown files MUST pass linting before merge
  - Enforcement: .cursor/rules/markdown-linting.mdc created
Templates reviewed:
  ✅ No template updates required
Follow-up TODOs: None

Previous versions:
  - 1.0.0 (2024-12-15): Initial ratification with 5 core principles
-->

# AliCooks Constitution

## Core Principles

### I. User-First Simplicity

The primary user is non-technical. Every feature MUST be intuitive without requiring
documentation or explanation. If a feature needs a manual, it is too complex.

- All UI interactions MUST be self-explanatory
- Error messages MUST use plain language, not technical jargon
- The app MUST be usable by someone who has never seen it before

### II. Delight Over Features

A small set of polished features beats many half-finished ones. Ship less, but make
it feel great.

- New features MUST NOT be added until existing features are complete and refined
- Visual polish and micro-interactions are NOT optional extras
- "Good enough" is not acceptable for user-facing elements

### III. Smart Defaults

The app MUST make sensible suggestions automatically. Users configure only when they
want to, not because they have to.

- First-run experience MUST work without any configuration
- Suggestions MUST be useful without user training data
- Advanced options MUST be hidden until explicitly requested

### IV. Data Ownership

User data MUST be portable and never locked in.

- Export functionality MUST be available from day one
- Data format MUST be human-readable (JSON, CSV, or similar)
- No vendor lock-in for storage or hosting

### V. Mobile-Ready

The interface MUST work well on phones — that's where dinner decisions happen.

- Mobile viewport is the primary design target
- Touch interactions MUST be first-class citizens
- All features MUST be accessible on mobile (no desktop-only functionality)

## Current Scope Boundaries

These define what AliCooks is NOT — for now. This scope may expand in future versions,
but these boundaries keep the initial build focused.

**Out of scope for v1:**

- Recipe storage or instructions
- Grocery list generation
- Nutritional tracking or calorie counting
- Multi-household or social features
- Meal scheduling/calendar integration

## Quality Standards

### Code Quality

- All code MUST be tested before merge
- Classes, methods, and functions MUST have clear documentation in plain language
- Clarity and simplicity MUST be prioritized over efficiency or performance
- Premature optimization is forbidden

### Development Approach

- Work incrementally: build very small, contained pieces one at a time
- Each piece MUST be complete and working before moving to the next
- Commits SHOULD be atomic and focused on a single change

### Documentation

- Code comments MUST explain "why", not "what"
- Documentation MUST be written for a reader unfamiliar with the codebase
- Technical jargon MUST be avoided or explained when unavoidable
- All markdown files MUST pass linting before merge (enforced via `.cursor/rules/`)

## Governance

This constitution establishes the foundational principles for AliCooks development.
All implementation decisions MUST align with these principles.

**Amendment Process:**

1. Proposed changes MUST be documented with rationale
2. Changes to Core Principles require version bump (MAJOR for removals, MINOR for additions)
3. Scope Boundaries may be expanded via MINOR version bump with documented justification

**Compliance:**

- All code reviews MUST verify alignment with Core Principles
- Complexity MUST be justified against Principle II (Delight Over Features)
- Performance optimizations MUST be justified against Quality Standards (clarity over efficiency)

**Version**: 1.1.0 | **Ratified**: 2024-12-15 | **Last Amended**: 2024-12-15
