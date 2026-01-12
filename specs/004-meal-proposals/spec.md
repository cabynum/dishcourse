# Feature Specification: Meal Proposals & Voting

**Feature ID**: 004-meal-proposals  
**Created**: 2026-01-11  
**Status**: Ready for Implementation  
**Depends On**: 002-family-collaboration (complete), 003-smart-meal-pairing (complete)  
**Voting Rules Decided**: 2026-01-11

## Overview

Meal Proposals & Voting transforms DishCourse from a meal planning tool into a collaborative
decision-making app. Household members can propose meals, vote on them, and celebrate when
consensus is reached — eliminating the endless "what do you want for dinner?" conversations.

**Aliya's Vision**: The family shouldn't have to text back and forth about dinner. Someone
proposes, everyone votes, and the decision is made.

## Problem

Currently, meal planning in DishCourse is a solo activity. One person creates the plan, assigns
dishes, and the rest of the family just sees the result. This doesn't solve the real problem:
getting everyone to agree on what to eat.

**Pain points**:

- "What sounds good tonight?" texts that go unanswered
- One person always making the decision (and the blame when it's wrong)
- Kids and partners don't feel included in meal choices
- Decision fatigue from having to pick every night

## Solution

Add a **Proposals** feature where any household member can propose a meal for a specific date.
Other members see the proposal and vote thumbs up or thumbs down. When enough votes are in
(configurable), the meal is either accepted or rejected.

### Core Concepts

| Term | Definition |
| ---- | ---------- |
| **Proposal** | A suggested meal (entree + sides) for a specific date |
| **Vote** | A member's approval (👍) or rejection (👎) of a proposal |
| **Veto** | Any single rejection immediately rejects the proposal (Rule 1) |
| **Consensus** | All members vote approve — triggers celebration! |
| **Expiration** | Proposals without full votes expire after 24 hours (Rule 2) |
| **Dismissal** | Member clears a result from their active view (Rule 4) |

> **📋 Voting Rules Reference**: See the "Voting Rules" section below for the canonical
> documentation of all voting behavior. Reference those rules for any implementation decisions.

## User Stories

### User Story 1 — Propose a Meal (Priority: P1)

A household member sees a meal suggestion they like and proposes it for tonight's dinner,
or they create their own proposal from scratch.

**Acceptance Scenarios**:

1. **Given** a user on the Suggestion page, **When** they tap "Propose This", **Then** a proposal
   is created for that meal with a default date of today.

2. **Given** a user on the home page, **When** they tap "Propose a Meal", **Then** they can
   select dishes to build a proposal and choose a date.

3. **Given** a proposal is created, **When** other household members open the app, **Then**
   they see a notification badge indicating a pending proposal.

4. **Given** a user is offline, **When** they create a proposal, **Then** it queues locally
   and syncs when online.

---

### User Story 2 — Vote on a Proposal (Priority: P1)

A household member sees a pending proposal and votes to approve or reject it.

**Acceptance Scenarios**:

1. **Given** a pending proposal, **When** a member views it, **Then** they see the meal details
   and can tap thumbs up or thumbs down.

2. **Given** a member has voted, **When** they view the proposal again, **Then** they see their
   vote and can change it before the proposal closes.

3. **Given** a proposal with all household members voted, **When** the quorum is met,
   **Then** the proposal is automatically finalized.

4. **Given** all votes are approvals, **When** the proposal finalizes, **Then** a celebration
   animation plays for all household members.

---

### User Story 3 — View Proposal Status (Priority: P1)

A user wants to see which proposals are pending, approved, or rejected.

**Acceptance Scenarios**:

1. **Given** pending proposals exist, **When** a user views the proposals list, **Then** they
   see each proposal's meal, date, and current vote tally.

2. **Given** a proposal is approved, **When** a user views it, **Then** they see the meal was
   accepted and which date it's assigned to.

3. **Given** a proposal is rejected, **When** a user views it, **Then** they see it was
   rejected and who voted against it (transparency).

---

### User Story 4 — Auto-Assign Approved Proposals (Priority: P2)

When a proposal is approved, it should automatically be added to the meal plan.

**Acceptance Scenarios**:

1. **Given** an approved proposal for Monday, **When** the proposal closes, **Then** the
   meal is automatically assigned to Monday in the active meal plan.

2. **Given** Monday already has a meal assigned, **When** a proposal for Monday is approved,
   **Then** the user is asked whether to replace or skip assignment.

3. **Given** no meal plan exists for the proposal date, **When** the proposal is approved,
   **Then** a new plan is created containing that date.

---

### User Story 5 — Proposal Notifications (Priority: P2)

Household members should be notified when someone proposes a meal.

**Acceptance Scenarios**:

1. **Given** a new proposal is created, **When** other members open the app, **Then** they
   see a badge on the Proposals tab/section.

2. **Given** a proposal the user hasn't voted on, **When** they're on the home page,
   **Then** they see a prompt like "Alex proposed Tacos for tonight — vote now!"

3. **Given** a proposal was just approved, **When** a member opens the app, **Then**
   they see a brief toast: "Tonight's dinner: Tacos 🎉"

---

### User Story 6 — Withdraw a Proposal (Priority: P3)

The proposer realizes they made a mistake and wants to cancel their proposal.

**Acceptance Scenarios**:

1. **Given** a proposal the user created, **When** they tap "Withdraw", **Then** the
   proposal is cancelled and removed from others' views.

2. **Given** a proposal with votes already cast, **When** the proposer withdraws it,
   **Then** voters see "Proposal withdrawn by [name]" briefly.

---

## User Flow

### Proposing from Suggestion

```text
┌─────────────────────────────────────────────┐
│         Tonight's Suggestion                │
├─────────────────────────────────────────────┤
│                                             │
│  🍗 Grilled Chicken                         │
│  🥗 Caesar Salad    🌽 Corn on the Cob      │
│                                             │
│  ┌─────────────┐   ┌─────────────────────┐  │
│  │  Shuffle    │   │  Propose This ✋    │  │
│  └─────────────┘   └─────────────────────┘  │
│                                             │
│           [ Use This Meal ]                 │
└─────────────────────────────────────────────┘
```

Tapping "Propose This" opens a confirmation:

```text
┌─────────────────────────────────────────────┐
│         Propose This Meal?                  │
├─────────────────────────────────────────────┤
│                                             │
│  Grilled Chicken + Caesar Salad + Corn      │
│                                             │
│  For: [ Tonight ▼ ]                         │
│                                             │
│  Your household will be notified to vote.   │
│                                             │
│           [ Cancel ]  [ Propose ]           │
└─────────────────────────────────────────────┘
```

### Voting on a Proposal

```text
┌─────────────────────────────────────────────┐
│  🗳️  Pending Proposal                       │
├─────────────────────────────────────────────┤
│                                             │
│  Alex proposed for Tonight:                 │
│                                             │
│  🍗 Grilled Chicken                         │
│  🥗 Caesar Salad    🌽 Corn on the Cob      │
│                                             │
│  ┌───────────────┐   ┌───────────────┐      │
│  │      👍       │   │      👎       │      │
│  │   Sounds good │   │   Not tonight │      │
│  └───────────────┘   └───────────────┘      │
│                                             │
│  Votes: 1/3 (waiting for Jamie, Sam)        │
└─────────────────────────────────────────────┘
```

### After Consensus

```text
┌─────────────────────────────────────────────┐
│             🎉 It's Decided! 🎉             │
├─────────────────────────────────────────────┤
│                                             │
│         Tonight's dinner is:                │
│                                             │
│         🍗 Grilled Chicken                  │
│   🥗 Caesar Salad    🌽 Corn on the Cob     │
│                                             │
│         Everyone approved!                  │
│                                             │
│              [ Awesome! ]                   │
└─────────────────────────────────────────────┘
```

(Note: Replace emoji placeholders with Lucide icons in implementation per Constitution)

---

## Data Model

### Proposal Entity

```typescript
interface Proposal {
  id: string;                    // UUID
  householdId: string;           // Household this proposal belongs to
  proposedBy: string;            // Profile ID of proposer
  proposedAt: string;            // ISO 8601 timestamp
  targetDate: string;            // ISO 8601 date (YYYY-MM-DD) for the meal
  
  // The proposed meal
  meal: {
    entreeId: string;            // Dish ID for the entree
    sideIds: string[];           // Dish IDs for the sides
  };
  
  // Voting
  votes: Vote[];                 // Array of votes cast
  status: ProposalStatus;        // 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'expired'
  
  // Result visibility (Rule 4 & 5)
  dismissals: ProposalDismissal[];  // Members who have cleared this from their view
  
  // Timestamps
  closedAt?: string;             // When voting closed (starts 24h auto-clear timer)
  createdAt: string;
  updatedAt: string;
}

interface Vote {
  voterId: string;               // Profile ID of voter
  vote: 'approve' | 'reject';    // The vote
  votedAt: string;               // ISO 8601 timestamp
}

type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'expired';

/**
 * Tracks which members have dismissed/cleared a proposal from their view.
 * Per Rule 4: Members can dismiss results once viewed.
 */
interface ProposalDismissal {
  userId: string;                // Profile ID of member who dismissed
  dismissedAt: string;           // ISO 8601 timestamp
}
```

### PostgreSQL Schema

```sql
CREATE TYPE proposal_status AS ENUM ('pending', 'approved', 'rejected', 'withdrawn', 'expired');

CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL REFERENCES profiles(id),
  proposed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target_date DATE NOT NULL,
  
  -- The meal: stored as JSONB for flexibility
  meal JSONB NOT NULL,
  -- Format: { "entreeId": "uuid", "sideIds": ["uuid", "uuid"] }
  
  status proposal_status NOT NULL DEFAULT 'pending',
  closed_at TIMESTAMPTZ,  -- When resolved; starts 24h auto-clear timer (Rule 5)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE proposal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES profiles(id),
  vote TEXT NOT NULL CHECK (vote IN ('approve', 'reject')),
  voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(proposal_id, voter_id)  -- One vote per member per proposal
);

-- Tracks which members have dismissed a proposal from their active view (Rule 4)
CREATE TABLE proposal_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(proposal_id, user_id)  -- One dismissal per member per proposal
);

CREATE INDEX idx_proposals_household ON proposals(household_id);
CREATE INDEX idx_proposals_status ON proposals(status) WHERE status = 'pending';
CREATE INDEX idx_proposals_target_date ON proposals(target_date);
CREATE INDEX idx_proposal_votes_proposal ON proposal_votes(proposal_id);
CREATE INDEX idx_proposal_dismissals_proposal ON proposal_dismissals(proposal_id);
CREATE INDEX idx_proposal_dismissals_user ON proposal_dismissals(user_id);
```

### Row-Level Security

```sql
-- Members can view proposals in their households
CREATE POLICY "Members can read household proposals"
  ON proposals FOR SELECT
  USING (
    household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );

-- Members can create proposals in their households
CREATE POLICY "Members can create proposals"
  ON proposals FOR INSERT
  WITH CHECK (
    household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
    AND proposed_by = auth.uid()
  );

-- Only proposer can withdraw (update status to 'withdrawn')
CREATE POLICY "Proposer can withdraw"
  ON proposals FOR UPDATE
  USING (proposed_by = auth.uid())
  WITH CHECK (status = 'withdrawn');

-- Members can vote on proposals in their households
CREATE POLICY "Members can vote"
  ON proposal_votes FOR INSERT
  WITH CHECK (
    proposal_id IN (
      SELECT id FROM proposals WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
    AND voter_id = auth.uid()
  );

-- Members can change their vote
CREATE POLICY "Members can change vote"
  ON proposal_votes FOR UPDATE
  USING (voter_id = auth.uid());

-- Members can dismiss proposals in their households (Rule 4)
CREATE POLICY "Members can dismiss proposals"
  ON proposal_dismissals FOR INSERT
  WITH CHECK (
    proposal_id IN (
      SELECT id FROM proposals WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
    AND user_id = auth.uid()
  );

-- Members can read dismissals for their proposals
CREATE POLICY "Members can read dismissals"
  ON proposal_dismissals FOR SELECT
  USING (
    proposal_id IN (
      SELECT id FROM proposals WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );
```

---

## UI Components

### ProposalCard

Displays a single proposal with meal details and voting UI.

```typescript
interface ProposalCardProps {
  proposal: Proposal;
  dishes: Dish[];              // To resolve dish names from IDs
  members: HouseholdMember[];  // To show who voted
  currentUserId: string;
  onVote: (vote: 'approve' | 'reject') => void;
  onWithdraw?: () => void;     // Only for proposer
}
```

### ProposalList

Shows all proposals (pending first, then recent closed).

```typescript
interface ProposalListProps {
  proposals: Proposal[];
  filter?: 'pending' | 'all';
}
```

### ProposeButton

Floating action or prominent button to start a new proposal.

```typescript
interface ProposeButtonProps {
  meal?: { entreeId: string; sideIds: string[] };  // Pre-filled if from suggestion
  onPropose: () => void;
}
```

### VotingButtons

Thumbs up/down voting interface.

```typescript
interface VotingButtonsProps {
  currentVote?: 'approve' | 'reject';
  disabled?: boolean;
  onVote: (vote: 'approve' | 'reject') => void;
}
```

### CelebrationModal

Animation/modal shown when consensus is reached.

```typescript
interface CelebrationModalProps {
  proposal: Proposal;
  dishes: Dish[];
  onClose: () => void;
}
```

---

## Voting Rules *(Canonical Reference)*

This section documents the official voting rules for proposals. Reference this section for
any implementation decisions related to voting behavior.

### Rule 1: Strict Veto (One "No" Rejects)

**Any single rejection vote immediately rejects the proposal.**

- Rationale: No one should be forced to eat something they don't want
- Effect: Encourages proposers to pick meals that work for everyone
- A proposal with 10 approvals and 1 rejection is **rejected**

### Rule 2: All Members Must Vote (or Proposal Expires)

**A proposal requires all household members to vote to be approved.**

- If all members vote "approve" → proposal is **approved** (consensus!)
- If any member votes "reject" → proposal is **rejected** immediately
- If not all members have voted within 24 hours → proposal **expires**

### Rule 3: Vote Results Visibility

**All members can see the full results of any closed proposal.**

- Who voted approve vs. reject (transparency)
- Who proposed the meal
- What date the proposal was for

### Rule 4: Manual Clearing

**Each member can dismiss/clear a vote result once they've viewed it.**

- A "Clear" or "Dismiss" action removes it from their active view
- Other members still see it until they clear it themselves
- Cleared proposals go to a "Recent" section (for reference)

### Rule 5: Auto-Clear After 24 Hours

**Vote results auto-clear 24 hours after the proposal closes.**

- Prevents old results from cluttering the UI
- Timer starts at `closedAt` timestamp
- After auto-clear, proposal moves to archive (not deleted, just hidden)

### Rule 6: Solo Household Exclusion

**The proposals feature is hidden for single-member households.**

- No point in voting with yourself
- Feature becomes visible when a second member joins
- Proposals created before last member left remain accessible

---

## Algorithm: Proposal Resolution

```typescript
function resolveProposal(
  proposal: Proposal,
  householdMemberCount: number
): ProposalStatus {
  if (proposal.status !== 'pending') {
    return proposal.status;  // Already resolved
  }

  // Rule 6: Solo households don't use proposals
  if (householdMemberCount < 2) {
    return 'pending';  // Should not happen (feature hidden)
  }

  const rejections = proposal.votes.filter(v => v.vote === 'reject').length;

  // Rule 1: Any rejection = rejected (strict veto)
  if (rejections > 0) {
    return 'rejected';
  }

  const approvals = proposal.votes.filter(v => v.vote === 'approve').length;

  // Rule 2: All members must vote to approve
  if (approvals === householdMemberCount) {
    return 'approved';  // Consensus!
  }

  return 'pending';  // Still waiting for votes
}

function shouldExpireProposal(proposal: Proposal): boolean {
  if (proposal.status !== 'pending') {
    return false;
  }

  const createdAt = new Date(proposal.proposedAt);
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  // Rule 2: Expire after 24 hours without resolution
  return hoursSinceCreation >= 24;
}

function shouldAutoClearResult(proposal: Proposal): boolean {
  if (proposal.status === 'pending') {
    return false;
  }

  if (!proposal.closedAt) {
    return false;
  }

  const closedAt = new Date(proposal.closedAt);
  const now = new Date();
  const hoursSinceClosed = (now.getTime() - closedAt.getTime()) / (1000 * 60 * 60);

  // Rule 5: Auto-clear after 24 hours
  return hoursSinceClosed >= 24;
}
```

---

## Notifications Strategy

### In-App Notifications (Phase 1)

- Badge on home page / navigation showing pending proposal count
- Inline prompt: "Alex proposed Tacos for tonight — tap to vote"
- Toast when proposal resolves

### Push Notifications (Phase 2 — Future)

- "New proposal from Alex: Tacos for tonight"
- "Everyone voted! Tonight's dinner is Tacos 🎉"
- Requires push notification infrastructure (Firebase, OneSignal, etc.)

---

## Success Criteria

1. **SC-001**: Users can propose a meal and see votes within 30 seconds of other members voting
2. **SC-002**: Proposals resolve correctly based on voting rules
3. **SC-003**: Approved proposals auto-assign to meal plan (when enabled)
4. **SC-004**: Celebration animation plays on consensus
5. **SC-005**: Works offline (proposals queue, sync when online)
6. **SC-006**: Users report fewer "what's for dinner" texts (qualitative)

---

## Out of Scope

- **Push notifications** — Future enhancement, not blocking for v1
- **Multiple proposals for same date** — Handle one at a time initially
- **Scheduled proposals** — "Propose for next Tuesday" (date picker covers this simply)
- **Counter-proposals** — "I don't like that, how about this instead?" (just reject and propose)
- **Proposal comments** — Keep it simple: vote or don't

---

## Resolved Decisions

These questions were answered during specification (2026-01-11):

| Question | Decision |
| -------- | -------- |
| **Rejection policy** | One "no" vote immediately rejects the proposal (Rule 1) |
| **Expiration** | Yes, proposals auto-expire after 24 hours (Rule 2) |
| **Result visibility** | All members see results, can manually clear (Rule 3 & 4) |
| **Auto-clear** | Results auto-clear 24 hours after closing (Rule 5) |
| **Solo households** | Feature hidden for 1-member households (Rule 6) |

## Open Questions

1. **Quorum override**: Can proposer close early if enough approvals? (Probably no — see Rule 2)
2. **Archive access**: Should users be able to view proposals older than 24 hours? (Low priority)

---

## Design Inspiration

- **Twitter polls** — Simple, visual, low friction
- **Slack reactions** — Emoji-based quick response
- **Family group chats** — The problem we're solving
- **Doodle polls** — Async consensus building
