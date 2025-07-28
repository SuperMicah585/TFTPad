-- Add riot_id column to users table for JWT authentication
-- This migration adds the riot_id column and makes it unique

-- Add riot_id column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS riot_id TEXT;

-- Create unique index on riot_id (will fail if there are duplicates)
-- We'll handle duplicates in the application logic for now
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_riot_id ON users(riot_id) WHERE riot_id IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN users.riot_id IS 'Riot Games PUUID used for JWT authentication'; 