#!/usr/bin/env python3
"""
Test script to verify database connection and table structure
"""

from supabase import create_client, Client
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = "https://wdxzsztlsrzolxadaisl.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkeHpzenRsc3J6b2x4YWRhaXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDEzNjE2NiwiZXhwIjoyMDQ1NzEyMTY2fQ.XBKTQbizNWgeblsCZyFRGMI80gErTCWBEXu6h1keKVI"

def test_database_connection():
    """Test database connection and table structure"""
    try:
        # Initialize Supabase client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("✅ Supabase client initialized successfully")
        
        # Test study_group table
        print("\nTesting study_group table...")
        try:
            study_groups_response = supabase.table('study_group').select('id, group_name').limit(5).execute()
            print(f"✅ study_group table accessible: {len(study_groups_response.data)} groups found")
            if study_groups_response.data:
                print(f"   Sample group: {study_groups_response.data[0]}")
        except Exception as e:
            print(f"❌ study_group table error: {str(e)}")
        
        # Test user_to_study_group table
        print("\nTesting user_to_study_group table...")
        try:
            members_response = supabase.table('user_to_study_group').select('*').limit(5).execute()
            print(f"✅ user_to_study_group table accessible: {len(members_response.data)} members found")
            if members_response.data:
                print(f"   Sample member: {members_response.data[0]}")
        except Exception as e:
            print(f"❌ user_to_study_group table error: {str(e)}")
        
        # Test riot_accounts table
        print("\nTesting riot_accounts table...")
        try:
            accounts_response = supabase.table('riot_accounts').select('*').limit(5).execute()
            print(f"✅ riot_accounts table accessible: {len(accounts_response.data)} accounts found")
            if accounts_response.data:
                print(f"   Sample account: {accounts_response.data[0]}")
        except Exception as e:
            print(f"❌ riot_accounts table error: {str(e)}")
        
        # Test rank_audit_events table
        print("\nTesting rank_audit_events table...")
        try:
            events_response = supabase.table('rank_audit_events').select('*').limit(5).execute()
            print(f"✅ rank_audit_events table accessible: {len(events_response.data)} events found")
            if events_response.data:
                print(f"   Sample event: {events_response.data[0]}")
        except Exception as e:
            print(f"❌ rank_audit_events table error: {str(e)}")
        
        # Test the specific query that will be used in Redis caching
        print("\nTesting Redis caching query...")
        try:
            # Get all study groups
            study_groups_response = supabase.table('study_group').select('id, group_name').execute()
            
            if study_groups_response.data:
                print(f"✅ Found {len(study_groups_response.data)} study groups")
                
                # Test the first group
                first_group = study_groups_response.data[0]
                group_id = first_group['id']
                group_name = first_group['group_name']
                
                print(f"   Testing group {group_id}: {group_name}")
                
                # Get members for this group
                members_response = supabase.table('user_to_study_group').select(
                    'user_id, riot_accounts!inner(riot_id, summoner_name, region)'
                ).eq('study_group_id', group_id).execute()
                
                if members_response.data:
                    print(f"   ✅ Found {len(members_response.data)} members in group")
                    
                    # Get events for these members
                    riot_ids = []
                    for member in members_response.data:
                        riot_account = member.get('riot_accounts')
                        if riot_account and riot_account.get('riot_id'):
                            riot_ids.append(riot_account['riot_id'])
                    
                    if riot_ids:
                        print(f"   ✅ Found {len(riot_ids)} riot accounts")
                        
                        events_response = supabase.table('rank_audit_events').select('*').in_('riot_id', riot_ids[:5]).execute()
                        print(f"   ✅ Found {len(events_response.data)} events for these accounts")
                    else:
                        print("   ⚠️  No riot accounts found for group members")
                else:
                    print("   ⚠️  No members found in group")
            else:
                print("   ⚠️  No study groups found")
                
        except Exception as e:
            print(f"❌ Redis caching query error: {str(e)}")
        
        print("\n🎉 Database connection test completed!")
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_database_connection()
