#!/usr/bin/env python3
"""
Test script for study group requests functionality
"""

import requests
import json
import time

# Configuration
API_BASE_URL = "http://localhost:5001/api"

def test_study_group_requests():
    """Test the study group requests functionality"""
    
    print("🧪 Testing Study Group Requests Functionality")
    print("=" * 50)
    
    # Test 1: Create a study group request
    print("\n1. Testing create study group request...")
    try:
        create_data = {
            "study_group_id": 1,  # Assuming group ID 1 exists
            "user_id": 1          # Assuming user ID 1 exists
        }
        
        response = requests.post(
            f"{API_BASE_URL}/study-group-requests",
            json=create_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            request_data = response.json()
            print(f"✅ Request created successfully!")
            print(f"   Request ID: {request_data.get('id')}")
            print(f"   Status: {request_data.get('status')}")
            request_id = request_data.get('id')
        else:
            print(f"❌ Failed to create request: {response.status_code}")
            print(f"   Response: {response.text}")
            return
            
    except Exception as e:
        print(f"❌ Error creating request: {e}")
        return
    
    # Test 2: Get requests for a study group
    print("\n2. Testing get group requests...")
    try:
        response = requests.get(f"{API_BASE_URL}/study-groups/1/requests")
        
        if response.status_code == 200:
            data = response.json()
            requests_list = data.get('requests', [])
            print(f"✅ Retrieved {len(requests_list)} requests for group")
            for req in requests_list:
                print(f"   - Request {req.get('id')}: {req.get('user', {}).get('summoner_name', 'Unknown')} ({req.get('status')})")
        else:
            print(f"❌ Failed to get requests: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error getting requests: {e}")
    
    # Test 3: Get user requests
    print("\n3. Testing get user requests...")
    try:
        response = requests.get(f"{API_BASE_URL}/users/1/study-group-requests")
        
        if response.status_code == 200:
            data = response.json()
            requests_list = data.get('requests', [])
            print(f"✅ Retrieved {len(requests_list)} requests for user")
            for req in requests_list:
                print(f"   - Request {req.get('id')}: Group {req.get('study_group_id')} ({req.get('status')})")
        else:
            print(f"❌ Failed to get user requests: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error getting user requests: {e}")
    
    # Test 4: Approve request (if we have a request ID)
    if 'request_id' in locals():
        print(f"\n4. Testing approve request {request_id}...")
        try:
            response = requests.post(f"{API_BASE_URL}/study-group-requests/{request_id}/approve")
            
            if response.status_code == 200:
                print(f"✅ Request approved successfully!")
                print(f"   Response: {response.json()}")
            else:
                print(f"❌ Failed to approve request: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Error approving request: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")

if __name__ == "__main__":
    test_study_group_requests()
