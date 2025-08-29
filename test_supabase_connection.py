#!/usr/bin/env python3
"""
Test script to verify Supabase connection and configuration
"""

from supabase import create_client, Client
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = "https://wdxzsztlsrzolxadaisl.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkeHpzenRsc3J6b2x4YWRhaXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDEzNjE2NiwiZXhwIjoyMDQ1NzEyMTY2fQ.XBKTQbizNWgeblsCZyFRGMI80gErTCWBEXu6h1keKVI"

def test_supabase_connection():
    """Test Supabase connection and configuration"""
    try:
        # Initialize Supabase client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("✅ Supabase client initialized successfully")
        
        # Test users table
        print("\nTesting users table...")
        try:
            users_response = supabase.table('users').select('*').limit(1).execute()
            print(f"✅ users table accessible: {len(users_response.data)} users found")
            if users_response.data:
                print(f"   Sample user: {users_response.data[0]}")
        except Exception as e:
            print(f"❌ users table error: {str(e)}")
        
        # Test auth configuration
        print("\nTesting auth configuration...")
        try:
            # This will test if we can access auth settings
            auth_response = supabase.auth.admin.list_users()
            print("✅ Auth configuration accessible")
        except Exception as e:
            print(f"❌ Auth configuration error: {str(e)}")
        
        # Test table structure
        print("\nTesting table structure...")
        try:
            # Try to get table info
            users_sample = supabase.table('users').select('*').limit(1).execute()
            if users_sample.data:
                columns = list(users_sample.data[0].keys())
                print(f"✅ users table columns: {columns}")
                
                # Check if required columns exist
                required_columns = ['id', 'email', 'created_at']
                missing_columns = [col for col in required_columns if col not in columns]
                if missing_columns:
                    print(f"❌ Missing required columns: {missing_columns}")
                else:
                    print("✅ All required columns present")
            else:
                print("⚠️  No users in table, but table exists")
        except Exception as e:
            print(f"❌ Table structure error: {str(e)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Supabase connection failed: {str(e)}")
        return False

def test_oauth_configuration():
    """Test OAuth configuration"""
    print("\n=== OAuth Configuration Test ===")
    print("Please check the following in your Supabase dashboard:")
    print("\n1. Go to Authentication > Settings")
    print("   - Site URL should be: http://localhost:5173")
    print("   - Redirect URLs should include: http://localhost:5173/auth/callback")
    
    print("\n2. Go to Authentication > Providers")
    print("   - Discord should be enabled with Client ID and Secret")
    print("   - Google should be enabled with Client ID and Secret")
    
    print("\n3. For Discord OAuth:")
    print("   - Go to https://discord.com/developers/applications")
    print("   - Create/select your application")
    print("   - Add redirect URL: https://wdxzsztlsrzolxadaisl.supabase.co/auth/v1/callback")
    
    print("\n4. For Google OAuth:")
    print("   - Go to Google Cloud Console")
    print("   - Create/select your project")
    print("   - Add redirect URL: https://wdxzsztlsrzolxadaisl.supabase.co/auth/v1/callback")

if __name__ == "__main__":
    print("🔍 Testing Supabase Connection and Configuration")
    print("=" * 50)
    
    success = test_supabase_connection()
    
    if success:
        test_oauth_configuration()
        print("\n✅ Basic connection test passed!")
        print("⚠️  Please verify OAuth configuration manually")
    else:
        print("\n❌ Connection test failed!")
        print("Please check your Supabase URL and service key")
