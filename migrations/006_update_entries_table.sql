-- Update entries table to reference users
-- Add user_id column
ALTER TABLE entries ADD COLUMN user_id UUID;

-- Populate user_id based on matching username
UPDATE entries 
SET user_id = users.id 
FROM users 
WHERE entries.username = users.username;

-- Remove old user-related columns from entries (keep username for display)
ALTER TABLE entries 
DROP COLUMN real_name,
DROP COLUMN email,
DROP COLUMN phone,
DROP COLUMN pin_hash,
DROP COLUMN avatar_url;

-- Make user_id required and add foreign key
ALTER TABLE entries ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE entries ADD CONSTRAINT fk_entries_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes for faster lookups
CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_league_user ON entries(league_id, user_id);