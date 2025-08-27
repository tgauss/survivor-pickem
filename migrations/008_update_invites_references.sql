-- Update invites table references to users
-- Update claimed_by_user_id from claimed_by_entry via entries table
UPDATE invites 
SET claimed_by_user_id = entries.user_id 
FROM entries 
WHERE invites.claimed_by_entry = entries.id;

-- Set created_by_user_id to Taylor for existing invites (assuming Taylor created them)
UPDATE invites 
SET created_by_user_id = (SELECT id FROM users WHERE username = 'taylor' LIMIT 1)
WHERE created_by_user_id IS NULL;

-- Drop the old claimed_by_entry column
ALTER TABLE invites DROP COLUMN claimed_by_entry;

-- Add foreign key constraints
ALTER TABLE invites ADD CONSTRAINT fk_invites_created_by_user_id FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE invites ADD CONSTRAINT fk_invites_claimed_by_user_id FOREIGN KEY (claimed_by_user_id) REFERENCES users(id) ON DELETE SET NULL;