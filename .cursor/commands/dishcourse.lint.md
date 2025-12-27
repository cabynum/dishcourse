---
description: Check all markdown files for linting errors
---

## DishCourse Lint Check

Please run a lint check on all markdown files in the project:

```bash
npx markdownlint-cli2 "*.md" ".specify/**/*.md" "blog/**/*.md" "specs/**/*.md" ".cursor/**/*.md"
```

This covers:

- `*.md` — Root files (README.md, etc.)
- `.specify/**/*.md` — Memory and ideas
- `blog/**/*.md` — Development blog
- `specs/**/*.md` — Feature specifications
- `.cursor/**/*.md` — Cursor commands and rules

Report any errors found and fix them before continuing.

This should be run before any commit and at the end of editing sessions.
