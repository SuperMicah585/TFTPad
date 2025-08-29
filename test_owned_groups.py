#!/usr/bin/env python3
"""
Test script to verify the owned study groups API endpoint
"""

import requests
import json

def test_owned_study_groups():
    """Test the owned study groups API endpoint"""
    
    # Test with a user ID (you may need to replace this with a real user ID)
    user_id = 1  # Replace with an actual user ID from your database
    
    try:
        # Make the API call
        url = f"http://localhost:5001/api/users/{user_id}/owned-study-groups"
        print(f"Testing API endpoint: {url}")
        
        response = requests.get(url)
        
        print(f"Response status code: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response data: {json.dumps(data, indent=2)}")
            
            if 'study_groups' in data:
                groups = data['study_groups']
                print(f"Found {len(groups)} owned study groups")
                
                for i, group in enumerate(groups):
                    print(f"Group {i+1}:")
                    print(f"  ID: {group.get('id')}")
                    print(f"  Name: {group.get('group_name')}")
                    print(f"  Owner: {group.get('owner')}")
                    print(f"  Created: {group.get('created_at')}")
                    print()
            else:
                print("No 'study_groups' key in response")
        else:
            print(f"Error response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server. Make sure the Flask app is running on localhost:5001")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_owned_study_groups()
