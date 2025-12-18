# Cooking Up Code: Building a Meal Planning App with Spec-Driven Development

> How I used AI pair programming and GitHub's spec-kit to build a dinner planning app for my family

---

## The Problem

"What's for dinner?"

It's the question that haunts every household. My wife and I found ourselves in the familiar loop:
staring at the fridge, mentally cycling through the same handful of meals, occasionally venturing
into recipe rabbit holes that lead nowhere.

I'm a developer. Surely I could build something to help with this?

---

## The Idea

I wanted to create an application that would:

- Let my wife add dishes she likes (with full CRUD capabilities)
- Track side dishes separately
- **Propose meal combinations that actually make sense** for our family

Simple enough in concept. But I've been down the road of jumping straight into code, only to realize
halfway through that I hadn't thought through the requirements. This time, I wanted to do it right.

---

## Enter Spec-Kit

I discovered **Spec-Driven Development** and GitHub's open-source toolkit called **spec-kit**.
The philosophy resonated with me: focus on *what* you want to build before obsessing over *how*
to build it.

Spec-kit provides a structured workflow:

1. **Constitution** — Establish project principles
2. **Specify** — Define what the app should do
3. **Clarify** — Resolve ambiguities
4. **Plan** — Create a technical blueprint
5. **Tasks** — Break it into actionable items
6. **Implement** — Build it

I decided this project would be the perfect opportunity to try it out — and I'd use Cursor as my AI pair programming environment.

---

## Setting Up

### Prerequisites

Working on my Mac, I verified the basics:

```bash
python3 --version  # Python 3.13.3 ✓
git --version      # git 2.49.0 ✓
which uv           # Already installed ✓
```

### Installing Spec-Kit

Installation was straightforward using `uv`:

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```

A quick PATH update:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

### Initializing the Project

Here's the key insight: spec-kit supports multiple AI assistants. Since I'm using Cursor, I initialized with:

```bash
specify init alicooks --ai cursor-agent
```

This created the project structure with:

- `.cursor/commands/` — Slash commands for the spec-kit workflow
- `.specify/memory/` — Where specifications will live
- `.specify/templates/` — Document templates

The slash commands (`/speckit.constitution`, `/speckit.specify`, etc.) now work directly in Cursor.

---

## What's Next

With the tooling in place, it's time to actually *think* about what we're building.
In [Part 2](./part-2-specification.md), we establish the constitution and create detailed specifications.

---

## Lessons Learned (So Far)

1. **Spec first, code second** — Taking time to spec things out prevents costly rewrites
2. **Use the right tool for your environment** — spec-kit's `--ai cursor-agent` option made everything click
3. **Document as you go** — Writing this alongside development captures decisions in real-time

---

*This is Part 1 of a series documenting the build of "AliCooks" — a family meal planning application.*

**Next:** [Part 2 — Constitution, Specification & Planning](./part-2-specification.md)

December 2024
