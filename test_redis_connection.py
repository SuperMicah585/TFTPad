#!/usr/bin/env python3
"""
Test script to verify Redis connection and basic functionality
"""

import redis
import json
from datetime import datetime, timezone

# Redis configuration
REDIS_HOST = "switchyard.proxy.rlwy.net"
REDIS_PORT = 36750
REDIS_PASSWORD = "TZroUBwEQBXarRTolomwuqDvarlqpZBe"
REDIS_DB = 0

def test_redis_connection():
    """Test basic Redis connection"""
    try:
        # Initialize Redis client
        redis_client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            password=REDIS_PASSWORD,
            db=REDIS_DB,
            decode_responses=True
        )
        
        # Test connection
        print("Testing Redis connection...")
        redis_client.ping()
        print("✅ Redis connection successful!")
        
        # Test basic operations
        print("\nTesting basic Redis operations...")
        
        # Set a test key
        test_key = "test_key"
        test_value = {"message": "Hello Redis!", "timestamp": datetime.now(timezone.utc).isoformat()}
        redis_client.setex(test_key, 60, json.dumps(test_value))  # 60 seconds expiration
        print(f"✅ Set key: {test_key}")
        
        # Get the test key
        retrieved_value = redis_client.get(test_key)
        if retrieved_value:
            parsed_value = json.loads(retrieved_value)
            print(f"✅ Retrieved key: {test_key} = {parsed_value}")
        else:
            print(f"❌ Failed to retrieve key: {test_key}")
        
        # Test member stats cache key
        group_id = 1
        cache_key = f"member_stats_group_{group_id}"
        cache_data = {
            "events": [],
            "memberNames": {"test_user": "TestUser"},
            "liveData": {},
            "cached_at": datetime.now(timezone.utc).isoformat()
        }
        
        redis_client.setex(cache_key, 1800, json.dumps(cache_data))  # 30 minutes expiration
        print(f"✅ Set cache key: {cache_key}")
        
        # Retrieve cache data
        cached_data = redis_client.get(cache_key)
        if cached_data:
            parsed_cache = json.loads(cached_data)
            print(f"✅ Retrieved cache: {cache_key} = {parsed_cache}")
        else:
            print(f"❌ Failed to retrieve cache: {cache_key}")
        
        # Clean up test key
        redis_client.delete(test_key)
        print(f"✅ Cleaned up test key: {test_key}")
        
        print("\n🎉 All Redis tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Redis test failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_redis_connection()
