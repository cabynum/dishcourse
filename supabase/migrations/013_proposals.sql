-- DishCourse Meal Proposals & Voting Schema
-- Migration: 013_proposals
-- Date: 2026-01-11
--
-- This migration creates the database schema for meal proposals and voting.
-- Household members can propose meals and vote to approve/reject them.
--
-- See: specs/004-meal-proposals/spec.md for full specification.

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Proposal status (includes 'expired' per Rule 2)
CREATE TYPE proposal_status AS ENUM ('pending', 'approved', 'rejected', 'withdrawn', 'expired');

-- ============================================================================
-- PROPOSALS TABLE
-- ============================================================================
-- A proposal is a suggested meal (entree + sides) for a specific date.
-- Members vote approve/reject, and strict veto rules apply (one rejection = rejected).

CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL REFERENCES profiles(id),
  proposed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target_date DATE NOT NULL,
  
  -- The proposed meal stored as JSONB
  -- Format: { "entreeId": "uuid", "sideIds": ["uuid", "uuid"] }
  meal JSONB NOT NULL,
  
  status proposal_status NOT NULL DEFAULT 'pending',
  -- When voting closed; starts 24h auto-clear timer (Rule 5)
  closed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX idx_proposals_household ON proposals(household_id);
CREATE INDEX idx_proposals_status ON proposals(status) WHERE status = 'pending';
CREATE INDEX idx_proposals_target_date ON proposals(target_date);
-- Index for finding proposals by proposer
CREATE INDEX idx_proposals_proposed_by ON proposals(proposed_by);

-- ============================================================================
-- PROPOSAL_VOTES TABLE
-- ============================================================================
-- Stores each member's vote on a proposal. One vote per member per proposal.

CREATE TABLE proposal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES profiles(id),
  vote TEXT NOT NULL CHECK (vote IN ('approve', 'reject')),
  voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Each member can only vote once per proposal
  UNIQUE(proposal_id, voter_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_proposal_votes_proposal ON proposal_votes(proposal_id);
CREATE INDEX idx_proposal_votes_voter ON proposal_votes(voter_id);

-- ============================================================================
-- PROPOSAL_DISMISSALS TABLE
-- ============================================================================
-- Tracks which members have cleared/dismissed a proposal from their view (Rule 4).
-- A dismissed proposal no longer appears in the member's active proposals list.

CREATE TABLE proposal_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Each member can only dismiss a proposal once
  UNIQUE(proposal_id, user_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_proposal_dismissals_proposal ON proposal_dismissals(proposal_id);
CREATE INDEX idx_proposal_dismissals_user ON proposal_dismissals(user_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
-- Apply the existing updated_at trigger function to the proposals table

CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_dismissals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROPOSALS POLICIES
-- ============================================================================

-- Members can read proposals in their households
CREATE POLICY "Members can read household proposals"
  ON proposals FOR SELECT
  USING (household_id IN (SELECT get_user_household_ids(auth.uid())));

-- Members can create proposals in their households
CREATE POLICY "Members can create proposals"
  ON proposals FOR INSERT
  WITH CHECK (
    household_id IN (SELECT get_user_household_ids(auth.uid()))
    AND proposed_by = auth.uid()
  );

-- Proposer can update their own proposal (for withdrawing)
-- Or system can update status when votes resolve the proposal
CREATE POLICY "Members can update proposals"
  ON proposals FOR UPDATE
  USING (household_id IN (SELECT get_user_household_ids(auth.uid())));

-- ============================================================================
-- PROPOSAL_VOTES POLICIES
-- ============================================================================

-- Members can read votes for proposals in their households
CREATE POLICY "Members can read proposal votes"
  ON proposal_votes FOR SELECT
  USING (
    proposal_id IN (
      SELECT id FROM proposals 
      WHERE household_id IN (SELECT get_user_household_ids(auth.uid()))
    )
  );

-- Members can cast their own vote on household proposals
CREATE POLICY "Members can cast votes"
  ON proposal_votes FOR INSERT
  WITH CHECK (
    proposal_id IN (
      SELECT id FROM proposals 
      WHERE household_id IN (SELECT get_user_household_ids(auth.uid()))
    )
    AND voter_id = auth.uid()
  );

-- Members can update (change) their own vote
CREATE POLICY "Members can change their vote"
  ON proposal_votes FOR UPDATE
  USING (voter_id = auth.uid());

-- Members can delete their own vote (to allow re-voting via delete + insert)
CREATE POLICY "Members can delete their vote"
  ON proposal_votes FOR DELETE
  USING (voter_id = auth.uid());

-- ============================================================================
-- PROPOSAL_DISMISSALS POLICIES
-- ============================================================================

-- Members can read dismissals for proposals in their households
CREATE POLICY "Members can read proposal dismissals"
  ON proposal_dismissals FOR SELECT
  USING (
    proposal_id IN (
      SELECT id FROM proposals 
      WHERE household_id IN (SELECT get_user_household_ids(auth.uid()))
    )
  );

-- Members can dismiss proposals in their households
CREATE POLICY "Members can dismiss proposals"
  ON proposal_dismissals FOR INSERT
  WITH CHECK (
    proposal_id IN (
      SELECT id FROM proposals 
      WHERE household_id IN (SELECT get_user_household_ids(auth.uid()))
    )
    AND user_id = auth.uid()
  );

-- Members can remove their own dismissal (to un-dismiss)
CREATE POLICY "Members can un-dismiss proposals"
  ON proposal_dismissals FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================
-- Enable realtime for proposals so votes appear immediately across devices

ALTER PUBLICATION supabase_realtime ADD TABLE proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE proposal_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE proposal_dismissals;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE proposals IS 'Meal proposals for household voting. See spec 004-meal-proposals.';
COMMENT ON COLUMN proposals.meal IS 'JSON: { "entreeId": "uuid", "sideIds": ["uuid", ...] }';
COMMENT ON COLUMN proposals.closed_at IS 'When voting closed; starts 24h auto-clear timer (Rule 5)';
COMMENT ON TABLE proposal_votes IS 'Member votes on proposals. One vote per member per proposal.';
COMMENT ON TABLE proposal_dismissals IS 'Tracks which members have cleared a proposal from their view (Rule 4).';
