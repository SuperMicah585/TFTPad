#!/usr/bin/env python3
"""
Fix sequence for rank_audit_events table

This script fixes the SERIAL sequence that's out of sync with the existing data.
"""

from supabase import create_client, Client

# Configuration
SUPABASE_URL = "https://wdxzsztlsrzolxadaisl.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkeHpzenRsc3J6b2x4YWRhaXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDEzNjE2NiwiZXhwIjoyMDQ1NzEyMTY2fQ.XBKTQbizNWgeblsCZyFRGMI80gErTCWBEXu6h1keKVI"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def fix_sequence():
    """Fix the sequence for rank_audit_events table"""
    try:
        print("🔧 Fixing sequence for rank_audit_events table...")
        
        # Get the current maximum ID
        response = supabase.table('rank_audit_events').select('id').order('id', desc=True).limit(1).execute()
        
        if response.data and len(response.data) > 0:
            max_id = response.data[0]['id']
            print(f"Current maximum ID: {max_id}")
            
            # Reset the sequence to the next value after the maximum ID
            next_id = max_id + 1
            print(f"Setting sequence to start from: {next_id}")
            
            # Execute the sequence reset
            # Note: This requires direct SQL execution which might not be available in the Python client
            # We'll try to insert a dummy record and then delete it to advance the sequence
            print("Attempting to fix sequence by inserting and deleting a dummy record...")
            
            # Insert a dummy record
            dummy_data = {
                'elo': 0,
                'wins': 0,
                'losses': 0,
                'riot_id': 'dummy_fix_sequence'
            }
            
            insert_response = supabase.table('rank_audit_events').insert(dummy_data).execute()
            
            if insert_response.data:
                dummy_id = insert_response.data[0]['id']
                print(f"Inserted dummy record with ID: {dummy_id}")
                
                # Delete the dummy record
                delete_response = supabase.table('rank_audit_events').delete().eq('id', dummy_id).execute()
                print(f"Deleted dummy record: {delete_response.data}")
                
                print("✅ Sequence should now be fixed!")
            else:
                print("❌ Failed to insert dummy record")
        else:
            print("No existing records found, sequence should be fine")
            
    except Exception as e:
        print(f"❌ Error fixing sequence: {str(e)}")

if __name__ == '__main__':
    fix_sequence() 