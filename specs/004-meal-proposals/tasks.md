# Meal Proposals & Voting — Task Breakdown

**Feature**: 004-meal-proposals  
**Created**: 2026-01-11  
**Estimated Phases**: 5

---

## Phase 1: Data Model & Infrastructure

Set up the database schema and basic service layer.

### Task 1.1 — Create Migration for Proposals

Create Supabase migration `013_proposals.sql`:

- `proposals` table with all fields from spec
- `proposal_votes` table for votes
- `proposal_dismissals` table for tracking cleared results (Rule 4)
- `proposal_status` enum including 'expired' status
- Indexes for performance
- RLS policies for security

**Acceptance**: Migration applies cleanly, tables exist in Supabase

---

### Task 1.2 — TypeScript Types

Add types to `src/types/`:

- `Proposal` interface (including `dismissals` array)
- `Vote` interface
- `ProposalDismissal` interface
- `ProposalStatus` type (including 'expired')
- `CreateProposalInput` interface
- Export from `src/types/index.ts`

**Acceptance**: Types compile, imported in service layer

---

### Task 1.3 — Proposals Service

Create `src/services/proposals.ts`:

- `createProposal(input: CreateProposalInput): Promise<Proposal>`
- `getProposals(householdId: string): Promise<Proposal[]>`
- `getProposal(id: string): Promise<Proposal>`
- `castVote(proposalId: string, vote: 'approve' | 'reject'): Promise<void>`
- `withdrawProposal(id: string): Promise<void>`
- `dismissProposal(proposalId: string): Promise<void>` — Rule 4: clear from view
- `resolveProposal(proposal: Proposal, memberCount: number): ProposalStatus`
- `shouldExpireProposal(proposal: Proposal): boolean` — Rule 2: 24h expiration
- `shouldAutoClearResult(proposal: Proposal): boolean` — Rule 5: 24h auto-clear
- `isVisibleToUser(proposal: Proposal, userId: string): boolean` — check dismissal/expiry

**Acceptance**: All functions work against Supabase, handle errors gracefully

---

### Task 1.4 — Local Cache for Proposals

Extend `src/lib/db.ts` (Dexie):

- Add `proposals` table
- Add `proposalVotes` table
- Add sync status tracking

**Acceptance**: Proposals cache locally, work offline

---

### Task 1.5 — Sync Integration

Extend `src/services/sync.ts`:

- Sync proposals from Supabase
- Sync votes from Supabase
- Handle offline vote queuing

**Acceptance**: Proposals appear across household devices within 30 seconds

---

## Phase 2: Core UI Components

Build the reusable components for proposals.

### Task 2.1 — VotingButtons Component

Create `src/components/proposals/VotingButtons.tsx`:

- Two large buttons: approve (ThumbsUp icon) and reject (ThumbsDown icon)
- Visual feedback for selected state
- Disabled state during voting
- Accessible labels

**Acceptance**: Component renders, handles clicks, shows selected state

**Tests**: 10+ tests covering states and interactions

---

### Task 2.2 — ProposalCard Component

Create `src/components/proposals/ProposalCard.tsx`:

- Show proposer name and "proposed for [date]"
- Display meal (entree + sides) using existing dish display patterns
- Voting buttons (if pending and user hasn't voted)
- Vote tally ("2/4 voted")
- Status badge (pending, approved, rejected, withdrawn, expired)
- **Vote results display** (who voted what — transparency per Rule 3)
- **Clear/Dismiss button** for closed proposals (Rule 4)
- Withdraw button (only for proposer, only if pending)

**Acceptance**: Card displays all proposal info, voting works, dismiss works

**Tests**: 25+ tests covering display, voting, dismissal, and status states

---

### Task 2.3 — ProposalList Component

Create `src/components/proposals/ProposalList.tsx`:

- List of ProposalCards
- Filter: pending first, then recent closed
- Empty state: "No proposals yet — be the first!"
- Loading state

**Acceptance**: List renders, filters work, empty state shows

**Tests**: 10+ tests

---

### Task 2.4 — CelebrationModal Component

Create `src/components/proposals/CelebrationModal.tsx`:

- Confetti or celebration animation (use CSS animations)
- Show the approved meal prominently
- "Everyone approved!" message
- "Awesome!" dismiss button
- Auto-dismiss after 5 seconds

**Acceptance**: Modal triggers on consensus, animation plays, dismisses

**Tests**: 5+ tests

---

### Task 2.5 — ProposeModal Component

Create `src/components/proposals/ProposeModal.tsx`:

- Show meal preview
- Date picker (default: today)
- "Your household will be notified" message
- Cancel and Propose buttons

**Acceptance**: Modal opens, date selectable, creates proposal on confirm

**Tests**: 10+ tests

---

## Phase 3: Integration & Pages

Wire up the components into the app flow.

### Task 3.1 — useProposals Hook

Create `src/hooks/useProposals.ts`:

- Fetch proposals for current household
- Create proposal
- Cast vote
- Withdraw proposal
- Listen for real-time updates (Supabase realtime or polling)

**Acceptance**: Hook provides reactive proposal data

**Tests**: 15+ tests

---

### Task 3.2 — ProposalsPage

Create `src/pages/ProposalsPage.tsx`:

- Header: "Proposals"
- ProposalList component
- FAB or button: "Propose a Meal"
- Add to router

**Acceptance**: Page renders, navigation works

**Tests**: 10+ tests

---

### Task 3.3 — Integrate "Propose This" on SuggestionPage

Update `src/pages/SuggestionPage.tsx`:

- Add "Propose This" button next to existing actions
- Open ProposeModal with pre-filled meal
- Only show when user is in a household

**Acceptance**: Button appears for household members, opens modal

**Tests**: 5+ tests (add to existing SuggestionPage tests)

---

### Task 3.4 — Home Page Proposal Prompt

Update `src/pages/HomePage.tsx`:

- Show pending proposal count badge
- Inline prompt for first pending proposal: "[Name] proposed [Meal] — tap to vote"
- Link to ProposalsPage

**Acceptance**: Prompt appears when proposals pending

**Tests**: 5+ tests (add to existing HomePage tests)

---

### Task 3.5 — Navigation Update

Update navigation to include Proposals:

- Add Proposals tab/link (only for household members)
- Badge showing pending count
- Use Vote icon from Lucide

**Acceptance**: Navigation shows Proposals, badge updates

---

## Phase 4: Auto-Assignment & Resolution

Handle what happens when proposals are approved.

### Task 4.1 — Proposal Resolution Logic

Implement resolution in service per Voting Rules:

- **Rule 1**: Any rejection immediately sets status to 'rejected'
- **Rule 2**: All members must vote 'approve' for 'approved' status
- **Rule 2**: Proposals expire after 24 hours without resolution → 'expired'
- **Rule 5**: Auto-clear closed proposals after 24 hours (hide from active view)
- Trigger celebration animation only for 'approved' (consensus)

**Acceptance**: Proposals resolve correctly per all 6 voting rules

**Tests**: 15+ tests covering all rules and edge cases

---

### Task 4.2 — Auto-Assign to Meal Plan

When proposal approved:

- Find or create meal plan containing target date
- Assign meal to that date
- Handle conflict (date already has meal) — prompt user

**Acceptance**: Approved meals appear in plan automatically

**Tests**: 10+ tests

---

### Task 4.3 — Celebration Trigger

After resolution:

- If all votes are approvals → trigger CelebrationModal
- Store "celebration seen" to avoid re-showing
- Sync celebration state across devices (everyone should see it once)

**Acceptance**: Celebration shows once per user per approved proposal

---

## Phase 5: Polish & Edge Cases

### Task 5.1 — Offline Support

- Queue proposals created offline
- Queue votes cast offline
- Resolve conflicts when syncing

**Acceptance**: App works without network, syncs when online

**Tests**: 5+ tests for offline scenarios

---

### Task 5.2 — Proposal Expiration (Required per Rule 2)

- Proposals expire after 24 hours if not all members have voted
- Set status to 'expired' and `closed_at` timestamp
- Show "Expired" status badge on card
- Run expiration check on app load and periodically

**Acceptance**: Old proposals don't stay pending forever; expiration is automatic

---

### Task 5.3 — Solo Household Handling (Rule 6)

- If household has 1 member, hide the Proposals feature entirely
- No "Propose" buttons visible
- No Proposals tab in navigation
- Feature becomes visible when second member joins

**Acceptance**: Solo users don't see proposal features at all

---

### Task 5.4 — Empty States & Loading

- Loading skeletons for ProposalList
- Empty state with CTA to propose
- Error state with retry

**Acceptance**: All states feel polished

---

### Task 5.5 — Auto-Clear Results (Rule 5)

- Closed proposals auto-hide 24 hours after `closed_at`
- Implement in `isVisibleToUser()` check
- Proposals remain in database but hidden from active views
- Users can still see count: "3 recent proposals" if curious

**Acceptance**: Old results don't clutter the UI after 24 hours

---

### Task 5.6 — Accessibility Pass

- Keyboard navigation for voting
- Screen reader announcements
- Focus management for modals

**Acceptance**: WCAG AA compliance

---

## Test Summary

| Area | Estimated Tests |
| ---- | --------------- |
| VotingButtons | 10 |
| ProposalCard | 25 |
| ProposalList | 10 |
| CelebrationModal | 5 |
| ProposeModal | 10 |
| useProposals Hook | 20 |
| ProposalsPage | 10 |
| SuggestionPage (additions) | 5 |
| HomePage (additions) | 5 |
| Resolution Logic (all 6 rules) | 20 |
| Dismissal Logic | 10 |
| Expiration Logic | 10 |
| Auto-Clear Logic | 5 |
| Auto-Assignment | 10 |
| Offline Support | 5 |
| Solo Household Hiding | 5 |
| **Total** | **~165** |

---

## Dependencies

- **002-family-collaboration**: Household infrastructure, member profiles, realtime sync
- **003-smart-meal-pairing**: Meal structure (entree + sides), suggestion integration

---

## Risk Areas

1. **Real-time sync complexity** — Need proposals and votes to appear quickly
2. **Celebration timing** — Everyone should see celebration close to same time
3. **Conflict with meal plan locking** — Auto-assign shouldn't conflict with manual edits
4. **Notification fatigue** — Don't overwhelm users with proposal notifications

---

## Future Enhancements (Not in Scope)

- Push notifications
- Counter-proposals ("How about this instead?")
- Proposal comments/discussion
- Scheduled proposals (propose now for next week)
- Voting deadline reminders
