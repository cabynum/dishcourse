# DishCourse Ideas Backlog

A place to capture enhancement ideas and future features. Add freely — this is for brainstorming,
not commitment. Ideas here may or may not make it into the product.

**How to use this doc:**

- Jot down ideas when they come to you
- Don't overthink — capture the spark, refine later
- Periodically review and promote promising ideas to proper specs

---

## Dish Enhancements

Ideas for enriching the dish data model beyond name + type.

### Extended Dish Details (Partial ✅)

**Added**: 2024-12-18  
**Cook Time implemented**: 2024-12-19

Allow users to optionally add more context to dishes:

- ✅ **Cook Time** — Hours/minutes picker, stored as total minutes
- **Difficulty** — Quick weeknight vs. weekend project (not yet)
- **Notes** — Free-form personal notes (not yet)

*Consideration*: Keep these optional. The constitution says first-run must work without
configuration — adding a dish should still be fast and friction-free.

### Recipe Links ✅ IMPLEMENTED

**Added**: 2024-12-18  
**Implemented**: 2024-12-19

Link a dish to an external recipe source:

- Instagram post/reel demonstrating the recipe
- YouTube video
- Blog post or website URL
- Maybe even a TikTok

**Implementation notes**: Added `recipeUrls` array to Dish type. Multiple URLs per dish.
Domain-specific icons (Instagram, YouTube, TikTok, Pinterest). Tap icon on DishCard to
open URL. Also added `cookTimeMinutes` as bonus. All in expandable "More details" section.

### Restaurant Orders / Go-To Orders

**Added**: 2026-01-11

Store fast food and restaurant orders for household members. Pull up "Olivia's Chick-fil-A order" or "Dad's Chipotle bowl" when you're in the drive-thru and can't remember what everyone wants.

*Consideration*: Extends the concept of a "dish" beyond home cooking. Could be a new dish type (e.g., "Restaurant Order") or a separate section. Ties into Household Favorites — knowing who likes what. Keep it simple: name, restaurant, and the order details as free text.

---

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

### Family Collaboration 🌟 HIGH PRIORITY

**Added**: 2024-12-26

Aliya's vision: Make DishCourse a family app, not just a personal tool. Multiple family
members should be able to:

- View and add to the shared dish collection
- See and edit meal plans together
- Coordinate on what's for dinner without texting back and forth

**Open questions to explore**:

- Shared data model: One family account? Linked individual accounts?
- Sync mechanism: Real-time (WebSocket)? Poll-based? Manual refresh?
- Authentication: OAuth? Magic links? Simple PIN code?
- Conflict resolution: What if two people edit the same plan?
- Offline support: Can this work offline and sync later?

*Consideration*: This is a significant scope expansion. Requires proper specification before
implementation. May need a v2 milestone. Constitution principle IV (Data Ownership) must still
apply — users should be able to export their shared data.

### Household Meal Voting

**Added**: 2024-12-18

Share a meal suggestion with household members and let them vote — like or reject the idea
before committing to dinner. Takes the guesswork out of "what does everyone want?"

*Consideration*: Multi-household features are out of scope for v1 per constitution. Would
require user accounts, sharing mechanism (link? app invite?), and real-time or async voting
UI. Big feature, but addresses a real pain point for families. **Connects to Family Collaboration above.**

---

## UI/UX Ideas

Visual and interaction improvements.

### Onboarding Flow

**Added**: 2024-12-27

Create a welcoming first-run experience using the mascot duo. Would introduce new users to
the app's key features without requiring configuration.

Potential elements:

- Welcome screen with Duo mascots
- Brief walkthrough: add dish → get suggestions → plan meals
- Optional "Add your first dish" prompt to bootstrap the experience
- Skip option for returning users

*Consideration*: Aligns with Principle III (Smart Defaults) — first-run must work without
configuration. Onboarding should be delightful but not mandatory. Splash screen already
showcases mascots; this would extend that warmth into the first interaction.

---

### Micro-Interactions Polish

**Added**: 2024-12-27

Add subtle animations and touch feedback to make the app feel more alive:

- Button press feedback (scale/opacity)
- Card tap responses
- Smooth page transitions
- Loading states with personality

*Consideration*: Supports Principle II (Delight Over Features). Should feel polished, not
distracting. Mobile-first means touch feedback is especially important.

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
| 2024-12-26 | Added Family Collaboration (Aliya's request) |
