#!/usr/bin/env python3
import requests
import json

# Test data
test_data = {
    "elo": 1500,
    "wins": 10,
    "losses": 5,
    "riot_id": "test_user_123"
}

# Base URL
base_url = "http://localhost:5001"

def test_rank_audit_duplicate_prevention():
    """Test that duplicate entries with same wins/losses are prevented"""
    
    print("Testing rank audit events duplicate prevention...")
    
    # First request - should succeed
    print("\n1. Making first request (should succeed):")
    response1 = requests.post(
        f"{base_url}/api/rank-audit-events",
        headers={"Content-Type": "application/json"},
        json=test_data
    )
    
    print(f"Status Code: {response1.status_code}")
    print(f"Response: {response1.text}")
    
    # Second request with same data - should fail with 409
    print("\n2. Making second request with same data (should fail with 409):")
    response2 = requests.post(
        f"{base_url}/api/rank-audit-events",
        headers={"Content-Type": "application/json"},
        json=test_data
    )
    
    print(f"Status Code: {response2.status_code}")
    print(f"Response: {response2.text}")
    
    # Third request with different wins/losses - should succeed
    print("\n3. Making third request with different wins/losses (should succeed):")
    different_data = test_data.copy()
    different_data["wins"] = 15
    different_data["losses"] = 8
    
    response3 = requests.post(
        f"{base_url}/api/rank-audit-events",
        headers={"Content-Type": "application/json"},
        json=different_data
    )
    
    print(f"Status Code: {response3.status_code}")
    print(f"Response: {response3.text}")
    
    # Summary
    print("\n" + "="*50)
    print("TEST SUMMARY:")
    print(f"First request (new entry): {'✓ PASS' if response1.status_code == 201 else '✗ FAIL'}")
    print(f"Second request (duplicate): {'✓ PASS' if response2.status_code == 409 else '✗ FAIL'}")
    print(f"Third request (different): {'✓ PASS' if response3.status_code == 201 else '✗ FAIL'}")
    
    if response1.status_code == 201 and response2.status_code == 409 and response3.status_code == 201:
        print("\n🎉 All tests passed! Duplicate prevention is working correctly.")
    else:
        print("\n❌ Some tests failed. Check the responses above.")

if __name__ == "__main__":
    test_rank_audit_duplicate_prevention()
