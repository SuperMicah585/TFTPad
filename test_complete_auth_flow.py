#!/usr/bin/env python3
import requests
import json
import time

def test_complete_auth_flow():
    """Test the complete authentication flow"""
    
    print("🧪 Testing Complete Authentication Flow")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1️⃣ Testing server health...")
    try:
        health_response = requests.get('http://localhost:5001/health')
        if health_response.status_code == 200:
            print("✅ Backend server is healthy")
        else:
            print("❌ Backend server health check failed")
            return
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        return
    
    # Test 2: Frontend check
    print("\n2️⃣ Testing frontend...")
    try:
        frontend_response = requests.get('http://localhost:5182')
        if frontend_response.status_code == 200:
            print("✅ Frontend is running")
        else:
            print("❌ Frontend is not responding")
            return
    except Exception as e:
        print(f"❌ Cannot connect to frontend: {e}")
        return
    
    # Test 3: Authentication endpoint
    print("\n3️⃣ Testing Riot authentication...")
    test_data = {
        "gameName": "testuser",
        "tagLine": "TEST",
        "region": "americas"
    }
    
    try:
        auth_response = requests.post('http://localhost:5001/api/auth/riot-login', json=test_data)
        if auth_response.status_code == 200:
            auth_data = auth_response.json()
            print("✅ Authentication successful")
            print(f"   User ID: {auth_data['user']['id']}")
            print(f"   Summoner: {auth_data['user']['summoner_name']}")
            print(f"   Token: {auth_data['token'][:20]}...")
            
            # Test 4: Token verification
            print("\n4️⃣ Testing token verification...")
            token = auth_data['token']
            headers = {"Authorization": f"Bearer {token}"}
            
            verify_response = requests.get('http://localhost:5001/api/auth/verify', headers=headers)
            if verify_response.status_code == 200:
                verify_data = verify_response.json()
                print("✅ Token verification successful")
                print(f"   Verified User ID: {verify_data['user']['id']}")
            else:
                print("❌ Token verification failed")
                print(f"   Error: {verify_response.text}")
                
        else:
            print("❌ Authentication failed")
            print(f"   Error: {auth_response.text}")
            
    except Exception as e:
        print(f"❌ Authentication test failed: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Authentication Flow Test Complete!")
    print("\n📋 Next Steps:")
    print("1. Open http://localhost:5182 in your browser")
    print("2. Click 'Connect Riot Account' in the header")
    print("3. Enter a Riot ID (e.g., 'testuser#TEST')")
    print("4. Verify the authentication flow works in the UI")

if __name__ == "__main__":
    test_complete_auth_flow() 