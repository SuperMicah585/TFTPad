#!/usr/bin/env python3

import requests
import json

def test_group_search():
    """Test the group search functionality"""
    
    base_url = "http://localhost:5001/api/study-groups"
    
    # Test cases
    test_cases = [
        {
            "name": "No search (all groups)",
            "params": {},
            "expected": "Should return all groups"
        },
        {
            "name": "Search by group name",
            "params": {"search": "test"},
            "expected": "Should return groups with 'test' in name"
        },
        {
            "name": "Search by player name",
            "params": {"search": "john"},
            "expected": "Should return groups with members named 'john'"
        },
        {
            "name": "Search with ELO filter",
            "params": {"search": "test", "minEloFilter": 1000, "maxEloFilter": 2000},
            "expected": "Should return filtered groups with ELO between 1000-2000"
        }
    ]
    
    for test_case in test_cases:
        print(f"\n🧪 Testing: {test_case['name']}")
        print(f"Expected: {test_case['expected']}")
        
        try:
            response = requests.get(base_url, params=test_case['params'])
            
            if response.status_code == 200:
                data = response.json()
                groups = data.get('groups', [])
                pagination = data.get('pagination', {})
                
                print(f"✅ Status: {response.status_code}")
                print(f"📊 Groups returned: {len(groups)}")
                print(f"📄 Total pages: {pagination.get('total_pages', 0)}")
                print(f"📈 Total items: {pagination.get('total_items', 0)}")
                
                # Show first few groups and their details
                if groups:
                    print("👥 Sample groups:")
                    for i, group in enumerate(groups[:3]):
                        print(f"  {i+1}. {group.get('group_name', 'Unknown')} - {group.get('member_count', 0)} members (Avg ELO: {group.get('avg_elo', 0)})")
                else:
                    print("❌ No groups returned")
                    
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Connection error - make sure the server is running on localhost:5001")
        except Exception as e:
            print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    print("🔍 Testing Group Search Functionality")
    print("=" * 50)
    test_group_search()
