#!/usr/bin/env python3

import requests
import json

def test_elo_filter():
    """Test the ELO filter functionality"""
    
    base_url = "http://localhost:5001/api/free-agents"
    
    # Test cases
    test_cases = [
        {
            "name": "Default filter (iron+ to challenger)",
            "params": {"minRank": "iron+", "maxRank": "challenger"},
            "expected": "Should return all players"
        },
        {
            "name": "Diamond+ filter",
            "params": {"minRank": "diamond+", "maxRank": "challenger"},
            "expected": "Should return only diamond+ players"
        },
        {
            "name": "Gold to Platinum filter",
            "params": {"minRank": "gold+", "maxRank": "platinum+"},
            "expected": "Should return only gold to platinum players"
        },
        {
            "name": "Frontend format test (IRON to CHALLENGER)",
            "params": {"minRank": "IRON", "maxRank": "CHALLENGER"},
            "expected": "Should handle uppercase format"
        }
    ]
    
    for test_case in test_cases:
        print(f"\n🧪 Testing: {test_case['name']}")
        print(f"Expected: {test_case['expected']}")
        
        try:
            response = requests.get(base_url, params=test_case['params'])
            
            if response.status_code == 200:
                data = response.json()
                free_agents = data.get('free_agents', [])
                pagination = data.get('pagination', {})
                
                print(f"✅ Status: {response.status_code}")
                print(f"📊 Players returned: {len(free_agents)}")
                print(f"📄 Total pages: {pagination.get('total_pages', 0)}")
                print(f"📈 Total items: {pagination.get('total_items', 0)}")
                
                # Show first few players and their ranks
                if free_agents:
                    print("👥 Sample players:")
                    for i, agent in enumerate(free_agents[:3]):
                        print(f"  {i+1}. {agent.get('summoner_name', 'Unknown')} - {agent.get('rank', 'Unknown')} (ELO: {agent.get('elo', 0)})")
                else:
                    print("❌ No players returned")
                    
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Connection error - make sure the server is running on localhost:5001")
        except Exception as e:
            print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    print("🔍 Testing ELO Filter Functionality")
    print("=" * 50)
    test_elo_filter()
