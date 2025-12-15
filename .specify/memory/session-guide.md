# AliCooks Session Guide

Quick reference for starting and ending AI pair programming sessions.

## Starting a New Session

Copy and paste this prompt to begin:

```text
Let's continue working on AliCooks.

Please read these files to get up to speed:
- `.specify/memory/constitution.md` (project principles)
- `.specify/memory/session-guide.md` (this file - for current status)

Current status: [see below]
```

## Ending a Session

Before closing, ask:

```text
Before we end, please:
1. Update the "Current Status" section in `.specify/memory/session-guide.md`
2. Suggest a git commit message for today's work
```

## Current Status

**Last Updated**: 2024-12-15  
**Current Branch**: `001-meal-planner`  
**Current Phase**: Specification complete, ready for Planning

### Completed This Session

- ✅ Initialized spec-kit with `--ai cursor-agent`
- ✅ Created constitution v1.1.0 (5 principles + markdown linting)
- ✅ Created feature spec: `specs/001-meal-planner/spec.md`
- ✅ Created quality checklist: `specs/001-meal-planner/checklists/requirements.md`
- ✅ Set up Cursor rules for markdown linting

### Next Step

Run `/speckit.plan` to create the technical implementation plan (choose tech stack, design data model, etc.)

### Key Files

| Purpose | Path |
|---------|------|
| Constitution | `.specify/memory/constitution.md` |
| Feature Spec | `specs/001-meal-planner/spec.md` |
| Quality Checklist | `specs/001-meal-planner/checklists/requirements.md` |
| Markdown Rules | `.cursor/rules/markdown-linting.mdc` |
| This Guide | `.specify/memory/session-guide.md` |

### Open Decisions

None at this time.

### Notes

- Use two trailing spaces for line breaks (not tables) unless truly tabular
- All markdown files must pass linting before merge

