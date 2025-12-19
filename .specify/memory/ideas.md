# AliCooks Ideas Backlog

A place to capture enhancement ideas and future features. Add freely — this is for brainstorming,
not commitment. Ideas here may or may not make it into the product.

**How to use this doc:**

- Jot down ideas when they come to you
- Don't overthink — capture the spark, refine later
- Periodically review and promote promising ideas to proper specs

---

## Dish Enhancements

Ideas for enriching the dish data model beyond name + type.

### Extended Dish Details

**Added**: 2024-12-18

Allow users to optionally add more context to dishes:

- **Cook Time** — How long does this take? (e.g., "30 min", "1 hour")
- **Difficulty** — Quick weeknight vs. weekend project
- **Notes** — Free-form personal notes ("Dad's favorite", "needs cast iron")

*Consideration*: Keep these optional. The constitution says first-run must work without
configuration — adding a dish should still be fast and friction-free.

### Recipe Links

**Added**: 2024-12-18

Link a dish to an external recipe source:

- Instagram post/reel demonstrating the recipe
- YouTube video
- Blog post or website URL
- Maybe even a TikTok

*Consideration*: This is about reference, not storage. AliCooks isn't a recipe manager
(out of scope per constitution), but linking to where Aliya learned a dish could be helpful.

### Household Favorites Tagging

**Added**: 2024-12-19

Tag dishes with which household members especially like them. Could help with:

- Filtering suggestions to please picky eaters
- Planning meals around who's home that night
- Remembering that "Olivia loves this one" when meal planning

*Consideration*: Keep it simple — maybe just a multi-select of household member names. Would need a way to define household members first (settings?). Aligns well with the "Smart Defaults" principle if suggestions can weight toward favorites.

---

## Social & Sharing

Ideas related to sharing or multi-user features.

### Household Meal Voting

**Added**: 2024-12-18

Share a meal suggestion with household members and let them vote — like or reject the idea
before committing to dinner. Takes the guesswork out of "what does everyone want?"

*Consideration*: Multi-household features are out of scope for v1 per constitution. Would
require user accounts, sharing mechanism (link? app invite?), and real-time or async voting
UI. Big feature, but addresses a real pain point for families.

---

## UI/UX Ideas

Visual and interaction improvements.

No ideas yet.

---

## Smart Features

Ideas for making the app more intelligent.

### Smart Meal Pairing

**Added**: 2024-12-18

The current suggestion feature pairs entrees with random sides. Future versions should make
smarter pairings. Several approaches to explore:

1. **User-defined pairings** — Let users connect sides to entrees they think go well together.
   When suggesting, prefer these known-good combinations over random picks.

2. **AI-inferred pairings** — Use an LLM to analyze the user's dish list and infer which sides
   complement which entrees based on cuisine, flavor profiles, cooking methods, etc.

3. **AI-suggested new dishes** — Go beyond the user's list. "You have Grilled Chicken — have
   you considered adding Caesar Salad or Garlic Bread as sides?" Could help users expand their
   repertoire with complementary dishes they haven't thought of.

*Consideration*: Start with user-defined pairings (no AI dependency, user stays in control).
AI features could be opt-in enhancements later. The constitution emphasizes offline-first and
no account requirements, so AI features would need careful design (on-device models? optional
cloud calls?).

### Suggestion History & Variety

**Added**: 2024-12-18

Don't suggest the same meal twice in a week. Track what's been suggested recently and weight
randomness toward variety.

---

## Technical Improvements

Under-the-hood enhancements.

No ideas yet.

---

## Review Log

| Date | Action |
| ---------- | ---------------------------------- |
| 2024-12-18 | Created backlog with initial ideas |
