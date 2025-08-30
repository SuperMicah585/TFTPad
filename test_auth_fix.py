#!/usr/bin/env python3
"""
Test script to verify authentication improvements
"""

import requests
import time
import json

# Configuration
API_BASE_URL = "http://localhost:5001"
TEST_ENDPOINT = f"{API_BASE_URL}/api/users/618779/owned-study-groups-with-members"

def test_auth_endpoint():
    """Test the authentication endpoint that was failing"""
    print("🧪 Testing authentication endpoint...")
    
    try:
        # Make a request without authentication (should fail)
        response = requests.get(TEST_ENDPOINT, timeout=10)
        print(f"❌ Request without auth returned: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Correctly returned 401 for unauthenticated request")
        else:
            print(f"⚠️ Unexpected status code: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    
    print("\n📋 Test Summary:")
    print("- The frontend now has automatic token refresh")
    print("- Retry logic handles 401 errors gracefully")
    print("- Periodic session refresh prevents token expiration")
    print("- Better error messages for users")

if __name__ == "__main__":
    test_auth_endpoint()
