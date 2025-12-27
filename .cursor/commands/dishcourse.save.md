---
description: Save DishCourse session context before ending
---

## DishCourse Session Save

Before we end this session, please complete these steps:

### 0. Lint Check (FIRST!)

Run lint checks on ALL markdown files edited this session:

- `blog/`
- `specs/`
- `.specify/memory/`

Fix any errors before proceeding. Do not skip this step.

### 1. Update Session Guide

Update the "Current Status" section in `.specify/memory/session-guide.md` with:

- Today's date
- Current branch
- Current phase
- What was completed this session (as a bullet list)
- The next step
- Any open decisions

### 2. Update Blog (if applicable)

If significant progress was made this session, update the blog posts in `blog/`:

- Add to existing part if it's a continuation
- Create a new part if we've moved to a new phase
- Keep the README.md index updated

### 3. Suggest Commit Message

Provide a git commit message following conventional commits format that summarizes today's work. Use this structure:

```text
type(scope): brief description

- bullet point of key changes
- another key change
```

Types: feat, fix, docs, refactor, chore
