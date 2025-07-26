#!/usr/bin/env python3
"""
Test script for Team Stats API endpoints
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
API_BASE_URL = "http://localhost:5001/api"

def test_team_stats_endpoints():
    """Test both team stats endpoints"""
    
    # First, let's check what groups exist
    print("🔍 Checking available study groups...")
    try:
        response = requests.get(f"{API_BASE_URL}/study-groups")
        if response.status_code == 200:
            data = response.json()
            groups = data.get('groups', [])
            print(f"✅ Found {len(groups)} study groups:")
            for group in groups[:5]:  # Show first 5 groups
                print(f"   📋 Group {group['id']}: {group['group_name']} (created: {group['created_at']})")
            
            if groups:
                group_id = groups[0]['id']  # Use the first available group
                start_date = groups[0]['created_at']
                print(f"\n🎯 Using Group ID: {group_id} with creation date: {start_date}")
            else:
                print("❌ No groups found, using default values")
                group_id = 1
                start_date = (datetime.now() - timedelta(days=30)).isoformat()
        else:
            print(f"❌ Failed to fetch groups: {response.status_code}")
            group_id = 1
            start_date = (datetime.now() - timedelta(days=30)).isoformat()
    except Exception as e:
        print(f"❌ Error fetching groups: {e}")
        group_id = 1
        start_date = (datetime.now() - timedelta(days=30)).isoformat()
    
    print(f"🧪 Testing Team Stats API endpoints")
    print(f"📅 Start date: {start_date}")
    print(f"👥 Group ID: {group_id}")
    print("-" * 50)
    
    # Test 1: Get team stats
    print("\n1️⃣ Testing /api/team-stats")
    try:
        response = requests.get(f"{API_BASE_URL}/team-stats", params={
            'group_id': group_id,
            'start_date': start_date
        })
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Found {len(data.get('events', []))} events")
            print(f"👥 Member count: {data.get('memberCount', 0)}")
            print(f"📊 Average ELO: {data.get('averageElo', 0)}")
            print(f"🏆 Total wins: {data.get('totalWins', 0)}")
            print(f"💔 Total losses: {data.get('totalLosses', 0)}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    # Test 2: Get member stats
    print("\n2️⃣ Testing /api/team-stats/members")
    try:
        response = requests.get(f"{API_BASE_URL}/team-stats/members", params={
            'group_id': group_id,
            'start_date': start_date
        })
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Found data for {len(data)} members")
            for member_name, events in data.items():
                print(f"   👤 {member_name}: {len(events)} events")
                if events:
                    first_event = events[0]
                    last_event = events[-1]
                    print(f"      📈 ELO: {first_event.get('elo', 0)} → {last_event.get('elo', 0)}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Test completed!")

if __name__ == "__main__":
    test_team_stats_endpoints() 