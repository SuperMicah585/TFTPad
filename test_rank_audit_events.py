#!/usr/bin/env python3
"""
Test script for rank audit events functionality
"""

import requests
import json
from datetime import datetime, timezone

# Test configuration
TEST_RIOT_ID = "test_puuid_123"  # Replace with a real test PUUID
TEST_REGION = "na1"  # Replace with a real test region
TFT_SET = "TFTSET15"

def test_metatft_api():
    """Test the MetaTFT API directly"""
    print("Testing MetaTFT API...")
    
    # Test with a known player (you can replace with a real player)
    test_name = "TestPlayer"
    test_tag = "1234"
    # MetaTFT API expects uppercase region and camelCase TFT set
    metatft_region = TEST_REGION.upper()
    metatft_tft_set = "TFTSet15"  # Use camelCase instead of TFTSET15
    
    # Construct MetaTFT API URL
    metatft_url = f"https://api.metatft.com/public/profile/lookup_by_riotid/{metatft_region}/{test_name}/{test_tag}?source=full_profile&tft_set={metatft_tft_set}"
    
    print(f"Testing URL: {metatft_url}")
    
    try:
        response = requests.get(metatft_url, timeout=30)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
            
            if 'ranked_rating_changes' in data:
                changes = data['ranked_rating_changes']
                print(f"Found {len(changes)} ranked rating changes")
                
                if changes:
                    # Show first few events
                    for i, event in enumerate(changes[:3]):
                        print(f"Event {i+1}:")
                        print(f"  Rating: {event.get('rating_numeric')}")
                        print(f"  Rating Text: {event.get('rating_text')}")
                        print(f"  Timestamp: {event.get('created_timestamp')}")
                        print(f"  Games: {event.get('num_games')}")
                        print()
            else:
                print("No ranked_rating_changes found in response")
        else:
            print(f"Error response: {response.text}")
            
    except Exception as e:
        print(f"Error testing MetaTFT API: {e}")

def test_parse_datetime():
    """Test the datetime parsing function"""
    print("\nTesting datetime parsing...")
    
    test_timestamps = [
        "2025-08-29T06:30:40.502",
        "2025-08-29T06:30:40.502Z",
        "2025-08-29T06:30:40.502+00:00",
        "2025-08-29"
    ]
    
    for timestamp in test_timestamps:
        try:
            # Import the function from app.py
            import sys
            import os
            sys.path.append(os.path.dirname(os.path.abspath(__file__)))
            
            # This would need to be imported from app.py
            # parsed = parse_datetime_safe(timestamp)
            # print(f"'{timestamp}' -> {parsed}")
            print(f"'{timestamp}' -> would be parsed")
        except Exception as e:
            print(f"Error parsing '{timestamp}': {e}")

def test_region_mapping():
    """Test region mapping logic"""
    print("\nTesting region mapping...")
    
    # MetaTFT API expects uppercase regions
    test_regions = ['na1', 'euw1', 'kr1', 'unknown']
    
    for region in test_regions:
        mapped = region.upper()
        print(f"'{region}' -> '{mapped}' (uppercase)")

def test_summoner_name_parsing():
    """Test summoner name parsing logic"""
    print("\nTesting summoner name parsing...")
    
    test_names = [
        "PlayerName#1234",
        "TestPlayer#5678",
        "InvalidName",  # No hash
        "Multiple#Hash#Signs",
        "NameWith#Hash#Multiple"
    ]
    
    for summoner_name in test_names:
        if '#' in summoner_name:
            name, tag = summoner_name.split('#', 1)
            print(f"'{summoner_name}' -> name: '{name}', tag: '{tag}'")
        else:
            print(f"'{summoner_name}' -> Invalid format (no #)")

if __name__ == "__main__":
    print("Rank Audit Events Test Script")
    print("=" * 40)
    
    test_region_mapping()
    test_summoner_name_parsing()
    test_parse_datetime()
    test_metatft_api()
    
    print("\nTest completed!")
