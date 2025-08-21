#!/usr/bin/env python3
"""
Script to check if date_updated timestamps are being updated in the riot_accounts table
"""
import os
from supabase import create_client, Client
from datetime import datetime, timezone

# Supabase configuration (same as in app.py)
SUPABASE_URL = "https://wdxzsztlsrzolxadaisl.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkeHpzenRsc3J6b2x4YWRhaXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDEzNjE2NiwiZXhwIjoyMDQ1NzEyMTY2fQ.XBKTQbizNWgeblsCZyFRGMI80gErTCWBEXu6h1keKVI"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def check_recent_updates(group_id=69):
    """Check recent date_updated timestamps for users in a specific group"""
    print(f"Checking date_updated timestamps for group {group_id}...")
    
    try:
        # Get users in the group
        members_response = supabase.table('user_to_study_group').select('user_id, users(id)').eq('study_group_id', group_id).execute()
        
        if not members_response.data:
            print(f"No members found in group {group_id}")
            return
        
        print(f"Found {len(members_response.data)} members in group {group_id}")
        print("-" * 80)
        
        for member in members_response.data:
            if member.get('users'):
                user_id = member['users']['id']
                
                # Get riot account info
                riot_response = supabase.table('riot_accounts').select('user_id, summoner_name, rank, date_updated, created_at').eq('user_id', user_id).execute()
                
                if riot_response.data and len(riot_response.data) > 0:
                    riot_account = riot_response.data[0]
                    summoner_name = riot_account.get('summoner_name', 'Unknown')
                    rank = riot_account.get('rank', 'UNRANKED')
                    date_updated = riot_account.get('date_updated')
                    created_at = riot_account.get('created_at')
                    
                    print(f"User {user_id} ({summoner_name}):")
                    print(f"  Rank: {rank}")
                    print(f"  Created: {created_at}")
                    print(f"  Last Updated: {date_updated}")
                    
                    # Check how recent the update is
                    if date_updated:
                        try:
                            if 'Z' in date_updated:
                                updated_time = datetime.fromisoformat(date_updated.replace('Z', '+00:00'))
                            else:
                                updated_time = datetime.fromisoformat(date_updated)
                            
                            now = datetime.now(timezone.utc)
                            if updated_time.tzinfo is None:
                                updated_time = updated_time.replace(tzinfo=timezone.utc)
                            
                            time_diff = now - updated_time
                            minutes_ago = time_diff.total_seconds() / 60
                            
                            if minutes_ago < 1:
                                print(f"  🟢 Updated {time_diff.total_seconds():.0f} seconds ago (VERY RECENT)")
                            elif minutes_ago < 5:
                                print(f"  🟡 Updated {minutes_ago:.1f} minutes ago (RECENT)")
                            elif minutes_ago < 60:
                                print(f"  🟠 Updated {minutes_ago:.0f} minutes ago")
                            else:
                                hours_ago = minutes_ago / 60
                                print(f"  🔴 Updated {hours_ago:.1f} hours ago (OLD)")
                        except Exception as e:
                            print(f"  ❌ Error parsing date: {e}")
                    else:
                        print(f"  ❌ No date_updated timestamp")
                    
                    print()
                else:
                    print(f"User {user_id}: No riot account found")
                    print()
        
    except Exception as e:
        print(f"Error checking updates: {e}")

def watch_updates(group_id=69, interval=10):
    """Watch for updates in real-time"""
    import time
    
    print(f"Watching for updates in group {group_id} every {interval} seconds...")
    print("Press Ctrl+C to stop")
    
    try:
        while True:
            print(f"\n{'='*80}")
            print(f"Checking at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"{'='*80}")
            check_recent_updates(group_id)
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\nStopped watching.")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "watch":
            group_id = int(sys.argv[2]) if len(sys.argv) > 2 else 69
            watch_updates(group_id)
        else:
            group_id = int(sys.argv[1])
            check_recent_updates(group_id)
    else:
        check_recent_updates()
