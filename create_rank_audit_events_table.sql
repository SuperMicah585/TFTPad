-- Create rank_audit_events table
-- This table stores rank progression data for tracking team performance

CREATE TABLE IF NOT EXISTS rank_audit_events (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    elo INTEGER NOT NULL,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    riot_id TEXT NOT NULL,
    
    -- Add indexes for better query performance
    CONSTRAINT fk_riot_id FOREIGN KEY (riot_id) REFERENCES riot_accounts(riot_id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rank_audit_events_riot_id ON rank_audit_events(riot_id);
CREATE INDEX IF NOT EXISTS idx_rank_audit_events_created_at ON rank_audit_events(created_at);
CREATE INDEX IF NOT EXISTS idx_rank_audit_events_riot_id_created_at ON rank_audit_events(riot_id, created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE rank_audit_events ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view rank audit events for riot_ids they own
CREATE POLICY "Users can view own rank audit events" ON rank_audit_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM riot_accounts 
            WHERE riot_accounts.riot_id = rank_audit_events.riot_id 
            AND riot_accounts.user_id = auth.uid()
        )
    );

-- Policy to allow users to view rank audit events for group members
-- (This would need to be implemented based on your group membership logic)
CREATE POLICY "Users can view group member rank audit events" ON rank_audit_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_to_study_group utsg
            JOIN riot_accounts ra ON ra.user_id = utsg.user_id
            WHERE ra.riot_id = rank_audit_events.riot_id
            AND utsg.user_id = auth.uid()
        )
    );

-- Policy to allow insertion of rank audit events
CREATE POLICY "Users can insert own rank audit events" ON rank_audit_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM riot_accounts 
            WHERE riot_accounts.riot_id = rank_audit_events.riot_id 
            AND riot_accounts.user_id = auth.uid()
        )
    );

-- Policy to allow updates of rank audit events
CREATE POLICY "Users can update own rank audit events" ON rank_audit_events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM riot_accounts 
            WHERE riot_accounts.riot_id = rank_audit_events.riot_id 
            AND riot_accounts.user_id = auth.uid()
        )
    );

-- Policy to allow deletion of rank audit events
CREATE POLICY "Users can delete own rank audit events" ON rank_audit_events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM riot_accounts 
            WHERE riot_accounts.riot_id = rank_audit_events.riot_id 
            AND riot_accounts.user_id = auth.uid()
        )
    );

-- Insert some sample data for testing (optional)
-- INSERT INTO rank_audit_events (elo, wins, losses, riot_id) VALUES
-- (1200, 5, 3, 'sample_riot_id_1'),
-- (1250, 7, 2, 'sample_riot_id_1'),
-- (1300, 4, 4, 'sample_riot_id_1'),
-- (1150, 3, 5, 'sample_riot_id_2'),
-- (1200, 6, 2, 'sample_riot_id_2'),
-- (1250, 5, 3, 'sample_riot_id_2'); 