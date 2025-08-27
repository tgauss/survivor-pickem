-- Update leagues table to include created_by_user_id and ensure league_code is not null
ALTER TABLE leagues 
ADD COLUMN created_by_user_id UUID,
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Make league_code required (it was optional before)
UPDATE leagues SET league_code = 'taylor2024' WHERE league_code IS NULL OR league_code = '';
ALTER TABLE leagues ALTER COLUMN league_code SET NOT NULL;

-- Create index for faster lookups
CREATE INDEX idx_leagues_created_by_user_id ON leagues(created_by_user_id);
CREATE INDEX idx_leagues_league_code ON leagues(league_code);