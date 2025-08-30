#!/usr/bin/env python3
"""
Check the actual table structure of user_to_study_group and riot_accounts tables
"""

from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = "https://wdxzsztlsrzolxadaisl.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkeHpzenRsc3J6b2x4YWRhaXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDEzNjE2NiwiZXhwIjoyMDQ1NzEyMTY2fQ.XBKTQbizNWgeblsCZyFRGMI80gErTCWBEXu6h1keKVI"

def check_table_structure():
    """Check the structure of user_to_study_group and riot_accounts tables"""
    try:
        # Initialize Supabase client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("✅ Supabase client initialized successfully")
        
        # Check user_to_study_group table structure
        print("\n📋 Checking user_to_study_group table structure...")
        try:
            # Get a sample record to see the structure
            response = supabase.table('user_to_study_group').select('*').limit(1).execute()
            if response.data:
                print("✅ user_to_study_group table accessible")
                print(f"   Sample record: {response.data[0]}")
                print(f"   Columns: {list(response.data[0].keys())}")
            else:
                print("⚠️ user_to_study_group table is empty")
        except Exception as e:
            print(f"❌ user_to_study_group table error: {str(e)}")
        
        # Check riot_accounts table structure
        print("\n📋 Checking riot_accounts table structure...")
        try:
            # Get a sample record to see the structure
            response = supabase.table('riot_accounts').select('*').limit(1).execute()
            if response.data:
                print("✅ riot_accounts table accessible")
                print(f"   Sample record: {response.data[0]}")
                print(f"   Columns: {list(response.data[0].keys())}")
            else:
                print("⚠️ riot_accounts table is empty")
        except Exception as e:
            print(f"❌ riot_accounts table error: {str(e)}")
        
        # Test the JOIN query that's failing
        print("\n🔗 Testing the JOIN query that's failing...")
        try:
            response = supabase.table('user_to_study_group').select(
                'user_id, riot_accounts!inner(riot_id, summoner_name, region)'
            ).eq('study_group_id', 86).limit(1).execute()
            
            if response.data:
                print("✅ JOIN query works!")
                print(f"   Result: {response.data[0]}")
            else:
                print("⚠️ JOIN query returned no data")
        except Exception as e:
            print(f"❌ JOIN query failed: {str(e)}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == '__main__':
    check_table_structure()
