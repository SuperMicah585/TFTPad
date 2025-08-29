#!/usr/bin/env python3
"""
Script to fix the owner field for existing study groups
This script will set the owner field for groups that don't have it set
"""

import os
import sys
from supabase import create_client, Client

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Initialize Supabase client
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def fix_owner_field():
    """Fix the owner field for existing study groups"""
    
    try:
        print("🔍 Checking for study groups without owner field...")
        
        # Get all study groups
        response = supabase.table('study_group').select('*').execute()
        
        if not response.data:
            print("No study groups found in the database")
            return
        
        print(f"Found {len(response.data)} study groups")
        
        # Check which groups don't have an owner field or have owner = null
        groups_to_fix = []
        for group in response.data:
            if not group.get('owner') or group['owner'] is None:
                groups_to_fix.append(group)
        
        if not groups_to_fix:
            print("✅ All study groups already have the owner field set correctly")
            return
        
        print(f"Found {len(groups_to_fix)} groups that need the owner field fixed")
        
        # For each group without an owner, find the first member and set them as owner
        for group in groups_to_fix:
            group_id = group['id']
            group_name = group['group_name']
            
            print(f"🔧 Fixing owner for group: {group_name} (ID: {group_id})")
            
            # Find the first member of this group
            members_response = supabase.table('user_to_study_group').select('user_id').eq('study_group_id', group_id).limit(1).execute()
            
            if members_response.data:
                first_member_id = members_response.data[0]['user_id']
                
                # Update the group to set the owner
                update_response = supabase.table('study_group').update({'owner': first_member_id}).eq('id', group_id).execute()
                
                if update_response.data:
                    print(f"✅ Set owner to user {first_member_id} for group {group_name}")
                else:
                    print(f"❌ Failed to update owner for group {group_name}")
            else:
                print(f"⚠️ No members found for group {group_name}, cannot set owner")
        
        print("🎉 Owner field fix completed!")
        
    except Exception as e:
        print(f"❌ Error fixing owner field: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    fix_owner_field()
