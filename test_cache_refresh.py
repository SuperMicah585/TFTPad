import requests
import json

def test_cache_refresh(group_id):
    """Test the cache refresh endpoint"""
    url = f"http://localhost:5001/api/cache/refresh/{group_id}"
    
    print(f"Testing cache refresh for group {group_id}")
    print(f"URL: {url}")
    
    try:
        response = requests.post(url, headers={'Content-Type': 'application/json'})
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success Response: {json.dumps(data, indent=2)}")
        else:
            try:
                error_data = response.json()
                print(f"Error Response: {json.dumps(error_data, indent=2)}")
            except:
                error_text = response.text
                print(f"Error Response (text): {error_text}")
                
    except requests.exceptions.ConnectionError:
        print("Connection Error: Could not connect to the server")
    except requests.exceptions.Timeout:
        print("Timeout Error: Request timed out")
    except Exception as e:
        print(f"Unexpected Error: {str(e)}")

if __name__ == "__main__":
    # Test with group ID 86 (the one that was failing)
    test_cache_refresh(86)
