-- Add foreign key constraint to enable JOIN queries between user_to_study_group and riot_accounts
-- This will allow us to use a single query to fetch group members with their riot accounts

-- First, ensure riot_accounts.user_id has a unique constraint (required for foreign key)
DO $$
BEGIN
    -- Check if unique constraint on user_id already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'uk_riot_accounts_user_id' 
        AND table_name = 'riot_accounts'
        AND constraint_type = 'UNIQUE'
    ) THEN
        -- Add unique constraint on riot_accounts.user_id
        ALTER TABLE riot_accounts 
        ADD CONSTRAINT uk_riot_accounts_user_id UNIQUE (user_id);
        
        RAISE NOTICE 'Unique constraint uk_riot_accounts_user_id added to riot_accounts.user_id';
    ELSE
        RAISE NOTICE 'Unique constraint uk_riot_accounts_user_id already exists on riot_accounts.user_id';
    END IF;
END $$;

-- Now add the foreign key constraint
DO $$
BEGIN
    -- Check if the foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_to_study_group_riot_accounts' 
        AND table_name = 'user_to_study_group'
    ) THEN
        -- Add foreign key constraint from user_to_study_group.user_id to riot_accounts.user_id
        ALTER TABLE user_to_study_group 
        ADD CONSTRAINT fk_user_to_study_group_riot_accounts 
        FOREIGN KEY (user_id) REFERENCES riot_accounts(user_id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key constraint fk_user_to_study_group_riot_accounts added successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint fk_user_to_study_group_riot_accounts already exists';
    END IF;
END $$;

-- Create an index on user_id in user_to_study_group for better JOIN performance
CREATE INDEX IF NOT EXISTS idx_user_to_study_group_user_id ON user_to_study_group(user_id);

-- Verify the constraint was added
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'user_to_study_group'
    AND tc.constraint_name = 'fk_user_to_study_group_riot_accounts';
