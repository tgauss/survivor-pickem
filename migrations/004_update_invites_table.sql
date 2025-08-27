-- Update invites table for new invite system
ALTER TABLE invites 
ADD COLUMN created_by_user_id UUID,
ADD COLUMN max_uses INTEGER,
ADD COLUMN current_uses INTEGER NOT NULL DEFAULT 0,
ADD COLUMN expires_at TIMESTAMPTZ;

-- Rename claimed_by_entry to claimed_by_user_id (we'll update this after migration)
ALTER TABLE invites ADD COLUMN claimed_by_user_id UUID;

-- Create indexes for faster lookups
CREATE INDEX idx_invites_created_by_user_id ON invites(created_by_user_id);
CREATE INDEX idx_invites_claimed_by_user_id ON invites(claimed_by_user_id);
CREATE INDEX idx_invites_token ON invites(token);