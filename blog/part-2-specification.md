# Part 2: Constitution, Specification & Planning

> Establishing principles, defining features, and choosing a tech stack — all before writing a single line of code

**Previous:** [Part 1 — Setup](./part-1-setup.md)

---

## The Constitution

Before diving into features, spec-kit asks you to establish a *constitution* — the foundational
principles that guide every decision. This felt a bit formal at first, but it turned out to be
incredibly valuable.

I ran `/speckit.constitution` in Cursor and worked with Claude to define what matters most for AliCooks.

### The Five Principles

#### I. User-First Simplicity

> The primary user is non-technical. Every feature MUST be intuitive without requiring documentation.

My wife shouldn't need a manual. If she has to ask "how do I...?" — we've failed.

#### II. Delight Over Features

> A small set of polished features beats many half-finished ones.

No feature creep. Ship less, but make it feel great.

#### III. Smart Defaults

> The app MUST make sensible suggestions automatically. Users configure only when they want to.

First-run should just *work*. No setup wizard, no onboarding flow.

#### IV. Data Ownership

> User data MUST be portable and never locked in.

Export from day one. Human-readable format (JSON). No vendor lock-in.

#### V. Mobile-Ready

> The interface MUST work well on phones — that's where dinner decisions happen.

Mobile viewport is the *primary* design target. Not an afterthought.

### What's Out of Scope

The constitution also defines boundaries. For v1, we're explicitly *not* building:

- Recipe storage or instructions
- Grocery list generation
- Nutritional tracking
- Multi-user features
- Calendar integration

These might come later, but the boundaries keep the initial build focused.

---

## The Specification

With principles established, it was time to specify *what* the app does.
I ran `/speckit.specify` and described the core concept:

> "I want to build a meal planning app that lets my wife add meals (entrees, side dishes, etc.),
> and suggests meal combinations that make sense for our family.
> She should be able to plan a menu for as many days as she'd like."

### Four User Stories

Claude helped break this into prioritized stories:

| Priority | Story | Why This Order |
| ---------- | ------- | ---------------- |
| **P1** | Add a Meal | Foundation — nothing else works without meals |
| **P2** | View My Meals | Users need to see what they've added |
| **P3** | Get Meal Suggestions | The "magic" differentiator |
| **P4** | Plan a Menu | Full planning experience |

Each story came with acceptance scenarios in Given/When/Then format. For example:

> **Given** I am on the app,  
> **When** I tap "Add Meal" and enter "Grilled Chicken" as an entree,  
> **Then** the meal is saved and visible in my collection

### Key Requirements

The spec distilled into clear functional requirements:

- **FR-001**: Users MUST be able to add a meal with a name and type
- **FR-004**: System MUST suggest meal combinations
- **FR-008**: System MUST persist all data locally
- **FR-009**: Users MUST be able to export their data

And success criteria we can actually measure:

- Add a meal in **under 15 seconds**
- Generate suggestion in **under 3 seconds**
- 90% of first-time users succeed **without help**

---

## The Planning Phase

Now for the big question: *how* do we build this?

I ran `/speckit.plan` and worked through technology decisions. Given our requirements
(mobile-first, local storage, data export, no backend), the answer became clear:

### The Stack

```text
┌────────────────────────────────────────────────┐
│                 AliCooks PWA                   │
├────────────────────────────────────────────────┤
│  UI:        React 18 + TypeScript              │
│  Styling:   Tailwind CSS (mobile-first)        │
│  Build:     Vite 5                             │
│  Storage:   localStorage (JSON)                │
│  Testing:   Vitest + React Testing Library     │
└────────────────────────────────────────────────┘
```

### Why a PWA?

A Progressive Web App gives us:

- **Cross-platform**: Works on iPhone, Android, desktop from one codebase
- **Installable**: Add to home screen, feels like a native app
- **Offline-capable**: Service worker caches the app
- **No app store**: No approval process, instant updates
- **Easy export**: JSON download is trivial in a web app

We considered native (Swift, Kotlin, React Native) but PWA wins on simplicity and reach.

### The Data Model

Three simple entities:

```text
Dish
| side |
└── createdAt, updatedAt

MealPlan
├── id, name, startDate
└── days: DayAssignment[]

DayAssignment
├── date
└── dishIds[]
```

All stored in localStorage with an `alicooks_` prefix. Simple, portable, human-readable.

### A Naming Refinement

Originally I called the entity "Meal" — but that felt wrong. When you "add a meal," you're really
adding a single dish like "Grilled Chicken." A *meal* is what you eat at dinner: an entree plus
sides.

So we renamed:

- **Dish** = individual item (Grilled Chicken, Mashed Potatoes)
- **Meal** = combination of dishes (what the suggestion produces)
- **MealPlan** = schedule of meals across days

Small change, but it makes the mental model much clearer. This is why spec-driven development
works — you catch these things *before* writing code.

---

## What We Produced

The planning phase generated several artifacts:

| File | Purpose |
| ------ | --------- |
| `plan.md` | Technical context & project structure |
| `research.md` | 7 technology decisions with rationale |
| `data-model.md` | Entity definitions & storage schema |
| `contracts/components.md` | React component interfaces |
| `quickstart.md` | Developer setup guide |

Every decision is documented with *why* we chose it and what alternatives we considered.

---

## What's Next

With the plan complete, it's time to break it into tasks and start building. In Part 3, we'll
create the project scaffold and implement our first user story: **Add a Dish**.

---

## Pro Tips: AI Pair Programming Session Management

One challenge with AI pair programming: context doesn't persist between sessions. Every new chat
starts fresh, and you have to re-explain where you left off.

I solved this with **custom Cursor slash commands**:

### The Commands

| Command | When | What It Does |
| --------- | ------ | -------------- |
| `/alicooks.start` | Beginning of session | Loads constitution, session guide, summarizes status |
| `/alicooks.lint` | Anytime | Checks all markdown files for linting errors |
| `/alicooks.save` | End of session | Updates session guide, blog, suggests commit message |

### How to Create Them

In Cursor, create markdown files in `.cursor/commands/`:

```text
.cursor/commands/
├── alicooks.start.md
├── alicooks.lint.md
└── alicooks.save.md
```

Each file has a YAML frontmatter with a description, then instructions for the AI:

```markdown
---
description: Start a new AliCooks development session
---

## AliCooks Session Start

Please read these files to get up to speed:
1. `.specify/memory/constitution.md`
2. `.specify/memory/session-guide.md`

Then summarize current status and ask how to proceed.
```

### The Session Guide Pattern

The real magic is the **session guide** — a markdown file that tracks:

- Current branch and phase
- What was completed last session
- What the next step is
- Key file locations

The `/alicooks.save` command updates this file, so the next session's `/alicooks.start` has accurate
context. It's like leaving a note for your future self (and your AI pair).

---

## Lessons Learned

1. **Constitution pays off** — Having principles to reference made every decision easier
2. **Prioritization is liberating** — P1 before P2 before P3. No debate.
3. **Document the "why"** — Future-me will thank present-me for the rationale
4. **PWA is underrated** — For single-user local-first apps, it's often the right call
5. **Naming matters** — "Dish" vs "Meal" seems trivial, but it clarifies the whole mental model
6. **Slash commands are a superpower** — Session management commands make AI pair programming *actually* work across sessions

---

*This is Part 2 of a series documenting the build of "AliCooks" — a family meal planning application.*

**Previous:** [Part 1 — Setup](./part-1-setup.md)  
**Next:** [Part 3 — Building the Foundation](./part-3-foundation.md)

December 2025
