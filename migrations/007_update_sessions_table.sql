-- Update sessions table to reference users instead of entries
-- Add user_id column
ALTER TABLE sessions ADD COLUMN user_id UUID;

-- Populate user_id from entries.user_id via entry_id
UPDATE sessions 
SET user_id = entries.user_id 
FROM entries 
WHERE sessions.entry_id = entries.id;

-- Update column names for consistency
ALTER TABLE sessions RENAME COLUMN token TO session_token;

-- Remove entry_id column
ALTER TABLE sessions DROP COLUMN entry_id;

-- Make user_id required and add foreign key
ALTER TABLE sessions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes for faster lookups
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);