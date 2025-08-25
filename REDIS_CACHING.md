# Redis Caching Implementation

This document describes the Redis caching implementation for the `get_member_stats` function to improve performance.

## Overview

The `get_member_stats` function is an expensive operation that processes rank audit events for study group members. To improve performance, we've implemented Redis caching that:

1. **Caches processed data** for 30 minutes
2. **Reduces database queries** by serving cached data when available
3. **Maintains live data capability** by fetching fresh Riot API data when requested
4. **Automatically populates cache** via the rank_audit_processor background task

## Architecture

### Cache Keys
- Format: `member_stats_group_{group_id}`
- Example: `member_stats_group_1`
- TTL: 1800 seconds (30 minutes)

### Cache Data Structure
```json
{
  "events": [...],           // Processed rank audit events
  "memberNames": {...},      // Mapping of riot_id to summoner_name
  "liveData": {},           // Empty for cached data (filled on demand)
  "cached_at": "2024-01-01T12:00:00Z"
}
```

## Implementation Details

### 1. Flask App (app.py)

#### Cache Check in get_member_stats()
- Checks Redis cache first (unless `force_refresh=true`)
- Returns cached data if available
- Fetches live data separately if `include_members=true`

#### Cache Population
- Automatically caches fresh data when fetched
- Stores data without live data to avoid API calls in cache

#### New Endpoints
- `GET /api/redis-health` - Check Redis connection
- `DELETE /api/cache/clear/{group_id}` - Clear specific group cache
- `DELETE /api/cache/clear-all` - Clear all member stats cache
- `POST /api/cache/refresh/{group_id}` - Refresh cache with fresh data (including live data)

### 2. Rank Audit Processor (rank_audit_processor.py)

#### Background Cache Population
- Runs every 30 minutes with the rank audit task
- Processes all study groups
- Applies same optimization logic as the main function
- Stores processed data in Redis

## Usage

### API Parameters
- `group_id` (required): Study group ID
- `include_members` (optional): Set to 'true' for live Riot API data
- `force_refresh` (optional): Set to 'true' to bypass cache

### Example Requests

#### Normal request (uses cache if available)
```
GET /api/team-stats/members?group_id=1
```

#### Request with live data
```
GET /api/team-stats/members?group_id=1&include_members=true
```

#### Force fresh data (bypass cache)
```
GET /api/team-stats/members?group_id=1&force_refresh=true
```

#### Check Redis health
```
GET /api/redis-health
```

#### Clear specific group cache
```
DELETE /api/cache/clear/1
```

#### Clear all cache
```
DELETE /api/cache/clear-all
```

#### Refresh cache for a specific group (with fresh data)
```
POST /api/cache/refresh/1
```

## Configuration

### Redis Connection
```python
REDIS_HOST = "switchyard.proxy.rlwy.net"
REDIS_PORT = 36750
REDIS_PASSWORD = "TZroUBwEQBXarRTolomwuqDvarlqpZBe"
REDIS_DB = 0
```

### Dependencies
Add to requirements.txt:
```
redis==5.0.1
```

## Testing

Run the Redis connection test:
```bash
python test_redis_connection.py
```

## Performance Benefits

1. **Faster Response Times**: Cached data returns immediately
2. **Reduced Database Load**: Fewer expensive queries
3. **Better User Experience**: Consistent response times
4. **Scalability**: Handles more concurrent requests

## Monitoring

### Log Messages
- Cache hits: `"Cache hit for group {group_id}"`
- Cache misses: `"Cache miss for group {group_id}"`
- Cache errors: `"Redis cache error for group {group_id}: {error}"`
- Cache population: `"Successfully cached data for group {group_id}"`

### Health Check
Use `/api/redis-health` to monitor Redis connection status.

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server status
   - Verify connection credentials
   - Test with `test_redis_connection.py`

2. **Cache Not Working**
   - Check if rank_audit_processor is running
   - Verify cache keys with Redis CLI
   - Check logs for cache errors

3. **Stale Data**
   - Use `force_refresh=true` parameter
   - Clear cache manually via API endpoints
   - Check cache TTL settings

### Redis CLI Commands
```bash
# Connect to Redis
redis-cli -h switchyard.proxy.rlwy.net -p 36750 -a TZroUBwEQBXarRTolomwuqDvarlqpZBe

# List all cache keys
KEYS member_stats_group_*

# Get specific cache data
GET member_stats_group_1

# Check TTL
TTL member_stats_group_1

# Clear specific cache
DEL member_stats_group_1
```

## Future Enhancements

1. **Cache Invalidation**: Automatic cache invalidation on data changes
2. **Cache Warming**: Pre-populate cache for popular groups
3. **Metrics**: Add cache hit/miss metrics
4. **Compression**: Compress cached data for memory efficiency
5. **Distributed Cache**: Use Redis Cluster for high availability
