#!/usr/bin/env python3
"""
Debug script to check data association issues
"""

import requests
import json
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:5001/api"

def debug_group_data():
    """Debug the data association"""
    
    # Test both groups
    groups = [
        {"id": 54, "created_at": "2025-07-19T17:53:09.929826+00:00", "name": "asdasd"},
        {"id": 60, "created_at": "2025-07-20T07:42:54.672219+00:00", "name": "asdas"}
    ]
    
    for group in groups:
        print(f"\n🔍 Testing Group {group['id']}: {group['name']}")
        print(f"📅 Created: {group['created_at']}")
        print("-" * 50)
        
        try:
            response = requests.get(f"{API_BASE_URL}/team-stats/members", params={
                'group_id': group['id'],
                'start_date': group['created_at']
            })
            
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Found data for {len(data)} members")
                
                for member_name, events in data.items():
                    print(f"\n👤 {member_name}: {len(events)} events")
                    for i, event in enumerate(events):
                        event_date = event.get('created_at', 'unknown')
                        elo = event.get('elo', 'unknown')
                        riot_id = event.get('riot_id', 'unknown')
                        print(f"     {i+1}. {event_date} - ELO: {elo} - Riot ID: {riot_id[:20]}...")
                        
                        # Check if this is the specific event you mentioned
                        if event_date == "2025-07-20T19:45:12.234567+00:00":
                            print(f"        ⚠️  This is the event you mentioned!")
                            print(f"        📊 Group {group['id']} created: {group['created_at']}")
                            print(f"        📊 Event time: {event_date}")
                            
                            # Check if it should be included
                            try:
                                event_timestamp = datetime.fromisoformat(event_date.replace('Z', '+00:00'))
                                group_timestamp = datetime.fromisoformat(group['created_at'].replace('Z', '+00:00'))
                                is_valid = event_timestamp >= group_timestamp
                                print(f"        ✅ Should be included: {is_valid}")
                            except Exception as e:
                                print(f"        ❌ Error parsing dates: {e}")
            else:
                print(f"❌ Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")

if __name__ == "__main__":
    debug_group_data() 