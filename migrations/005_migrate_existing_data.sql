-- Migrate existing data from entries to users table
-- First, create users from unique entries
INSERT INTO users (id, username, pin_hash, first_name, last_name, email, phone, avatar_url, role, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  username,
  pin_hash,
  SPLIT_PART(real_name, ' ', 1) as first_name,
  CASE 
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY(real_name, ' '), 1) > 1 
    THEN SUBSTRING(real_name FROM POSITION(' ' IN real_name) + 1)
    ELSE real_name
  END as last_name,
  email,
  phone,
  avatar_url,
  CASE 
    WHEN username = 'taylor' THEN 'super_admin'
    ELSE 'player'
  END as role,
  created_at,
  NOW() as updated_at
FROM entries 
WHERE username NOT IN (SELECT username FROM users)
GROUP BY username, pin_hash, real_name, email, phone, avatar_url, created_at;

-- Update leagues.created_by_user_id to reference Taylor (super admin)
UPDATE leagues 
SET created_by_user_id = (SELECT id FROM users WHERE username = 'taylor' LIMIT 1)
WHERE created_by_user_id IS NULL;