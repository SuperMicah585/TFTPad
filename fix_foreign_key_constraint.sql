-- Fix foreign key constraint between user_to_study_group and riot_accounts tables
-- This enables JOIN queries for the rank_audit_processor Redis cache population
-- Both tables use riot_id as the linking column

-- Step 1: Add unique constraint on riot_accounts.riot_id (required for foreign key)
DO $$
BEGIN
    -- Check if unique constraint on riot_id already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'uk_riot_accounts_riot_id' 
        AND table_name = 'riot_accounts'
        AND constraint_type = 'UNIQUE'
    ) THEN
        -- Add unique constraint on riot_accounts.riot_id
        ALTER TABLE riot_accounts 
        ADD CONSTRAINT uk_riot_accounts_riot_id UNIQUE (riot_id);
        
        RAISE NOTICE 'Unique constraint uk_riot_accounts_riot_id added to riot_accounts.riot_id';
    ELSE
        RAISE NOTICE 'Unique constraint uk_riot_accounts_riot_id already exists on riot_accounts.riot_id';
    END IF;
END $$;

-- Step 2: Add foreign key constraint from user_to_study_group.riot_id to riot_accounts.riot_id
DO $$
BEGIN
    -- Check if the foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_to_study_group_riot_accounts' 
        AND table_name = 'user_to_study_group'
    ) THEN
        -- Add foreign key constraint from user_to_study_group.riot_id to riot_accounts.riot_id
        ALTER TABLE user_to_study_group 
        ADD CONSTRAINT fk_user_to_study_group_riot_accounts 
        FOREIGN KEY (riot_id) REFERENCES riot_accounts(riot_id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key constraint fk_user_to_study_group_riot_accounts added successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint fk_user_to_study_group_riot_accounts already exists';
    END IF;
END $$;

-- Step 3: Create an index on riot_id in user_to_study_group for better JOIN performance
CREATE INDEX IF NOT EXISTS idx_user_to_study_group_riot_id ON user_to_study_group(riot_id);

-- Step 4: Verify the constraint was added successfully
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

-- Step 5: Test the JOIN query that the rank_audit_processor uses
-- This should work after the constraint is added
SELECT 
    utsg.riot_id,
    utsg.study_group_id,
    ra.summoner_name,
    ra.region
FROM user_to_study_group utsg
JOIN riot_accounts ra ON ra.riot_id = utsg.riot_id
WHERE utsg.study_group_id = 86  -- Test with a specific group
LIMIT 5;
