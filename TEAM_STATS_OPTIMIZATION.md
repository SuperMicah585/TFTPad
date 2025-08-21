# Team Statistics API Optimization

This document outlines the optimizations made to the Team Statistics API calls to improve performance, reduce redundant requests, and enhance user experience.

## 🚀 Optimization Overview

### Before Optimization Issues:
1. **Multiple Sequential API Calls**: 3 API calls per member (members → riot account → league data)
2. **Redundant Data Fetching**: Multiple components fetching the same data independently
3. **No Caching**: Data refetched every time
4. **Inefficient Error Handling**: Falls back to multiple separate calls when combined API fails
5. **No Request Deduplication**: Same requests made simultaneously
6. **Poor Performance**: Slow loading times, especially for groups with many members

### After Optimization Benefits:
1. **Intelligent Caching**: Multi-level caching with configurable TTL
2. **Request Deduplication**: Prevents duplicate simultaneous requests
3. **Parallel Processing**: Member data fetched in parallel instead of sequentially
4. **Optimized API Consolidation**: Single optimized method for all team stats
5. **Better Error Handling**: Graceful fallbacks with proper error recovery
6. **Auto-refresh Capabilities**: Configurable automatic data refresh
7. **Cache Management**: Manual cache clearing and statistics

## 📊 Cache Configuration

### Cache TTL (Time To Live):
- **Team Stats**: 5 minutes
- **Member Stats**: 5 minutes  
- **Combined Stats**: 5 minutes
- **Live Data**: 2 minutes (shorter for real-time data)
- **Member List**: 5 minutes
- **Riot Accounts**: 10 minutes

### Cache Keys:
Cache keys are generated based on endpoint and parameters to ensure uniqueness:
```typescript
function getCacheKey(endpoint: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${endpoint}?${sortedParams}`;
}
```

## 🔧 Optimized Services

### 1. Enhanced `teamStatsService`

#### New Methods:
- `getOptimizedTeamStats()`: Single method for all team stats data
- `clearCache()`: Manual cache clearing
- `getCacheStats()`: Cache statistics for debugging

#### Features:
- **Intelligent Caching**: Checks cache before making API calls
- **Request Deduplication**: Prevents duplicate simultaneous requests
- **Graceful Fallbacks**: Falls back to basic stats if combined API fails
- **Error Recovery**: Proper error handling with retry logic

#### Usage:
```typescript
// Get all team stats in one optimized call
const result = await teamStatsService.getOptimizedTeamStats(groupId, startDate, includeLiveData);

// Clear cache manually
teamStatsService.clearCache();

// Get cache statistics
const stats = teamStatsService.getCacheStats();
```

### 2. Enhanced `livePlayerService`

#### Optimizations:
- **Parallel Processing**: Member data fetched in parallel using `Promise.allSettled()`
- **Multi-level Caching**: Separate caches for members, riot accounts, and league data
- **Request Deduplication**: Prevents duplicate requests for same data
- **Better Error Handling**: Individual member failures don't break entire request

#### Performance Improvement:
- **Before**: Sequential API calls (3 × number of members)
- **After**: Parallel API calls with caching (much faster)

## 🎣 Custom Hook: `useOptimizedTeamStats`

### Features:
- **Automatic Data Fetching**: Fetches data on mount and dependency changes
- **Auto-refresh**: Configurable automatic refresh for live data
- **Loading States**: Separate loading states for basic and live data
- **Error Handling**: Comprehensive error handling with retry capabilities
- **Cache Management**: Built-in cache clearing and statistics

### Usage:
```typescript
const {
  events,
  memberNames,
  liveData,
  members,
  isLoading,
  isLiveDataLoading,
  error,
  liveDataError,
  refresh,
  refreshLiveData,
  clearCache,
  cacheStats
} = useOptimizedTeamStats({
  groupId: 123,
  startDate: '2024-01-01',
  includeLiveData: true,
  autoRefresh: true,
  refreshInterval: 2 * 60 * 1000 // 2 minutes
});
```

### Options:
- `groupId`: Study group ID
- `startDate`: ISO date string for filtering
- `includeLiveData`: Whether to include live player data
- `autoRefresh`: Enable automatic refresh for live data
- `refreshInterval`: Refresh interval in milliseconds

## 📈 Performance Improvements

### API Call Reduction:
- **Before**: 3 × number of members + additional calls
- **After**: 1-2 calls total (depending on cache hit)

### Response Time:
- **Before**: Sequential calls = sum of all individual call times
- **After**: Parallel calls = max of individual call times + cache benefits

### Memory Usage:
- **Before**: No caching, repeated data fetching
- **After**: Intelligent caching with configurable TTL

### User Experience:
- **Before**: Slow loading, potential timeouts
- **After**: Fast loading, instant cache hits, smooth experience

## 🔄 Migration Guide

### For Existing Components:

#### Before:
```typescript
// Multiple separate calls
const memberStats = await teamStatsService.getMemberStats(groupId, startDate);
const combinedStats = await teamStatsService.getCombinedTeamStats(groupId, startDate);
```

#### After:
```typescript
// Single optimized call
const result = await teamStatsService.getOptimizedTeamStats(groupId, startDate, true);
```

### For New Components:

#### Recommended Approach:
```typescript
import { useOptimizedTeamStats } from '../hooks/useOptimizedTeamStats';

function MyComponent({ groupId, startDate }) {
  const {
    events,
    memberNames,
    liveData,
    isLoading,
    error,
    refresh
  } = useOptimizedTeamStats({
    groupId,
    startDate,
    includeLiveData: true,
    autoRefresh: true
  });

  // Use the data...
}
```

## 🛠️ Debugging and Monitoring

### Cache Statistics:
```typescript
// Get cache statistics
const teamStatsCache = teamStatsService.getCacheStats();
const liveDataCache = livePlayerService.getCacheStats();

console.log('Cache size:', teamStatsCache.size + liveDataCache.size);
console.log('Cached keys:', [...teamStatsCache.keys, ...liveDataCache.keys]);
```

### Manual Cache Management:
```typescript
// Clear all caches
teamStatsService.clearCache();
livePlayerService.clearCache();

// Or use the hook method
const { clearCache } = useOptimizedTeamStats({...});
clearCache();
```

### Console Logging:
The optimized services include detailed console logging:
- `📊 Using cached data...` - Cache hits
- `🚀 Starting to fetch...` - New requests
- `✅ Successfully fetched...` - Successful requests
- `❌ Error fetching...` - Error conditions
- `🔄 Auto-refreshing...` - Auto-refresh events

## 🎯 Best Practices

### 1. Use the Custom Hook
Prefer `useOptimizedTeamStats` over direct service calls for components.

### 2. Configure Auto-refresh Wisely
Only enable auto-refresh for live data when necessary to avoid excessive API calls.

### 3. Monitor Cache Performance
Use cache statistics to monitor performance and adjust TTL values if needed.

### 4. Handle Errors Gracefully
Always provide fallback UI for error states and retry mechanisms.

### 5. Clear Cache When Needed
Clear cache when data becomes stale or when users explicitly request fresh data.

## 🔮 Future Enhancements

### Potential Improvements:
1. **Background Sync**: Sync data in background when app is idle
2. **Offline Support**: Cache data for offline viewing
3. **Incremental Updates**: Only fetch changed data
4. **WebSocket Integration**: Real-time updates for live data
5. **Advanced Caching**: LRU cache with memory limits
6. **Performance Metrics**: Detailed performance monitoring

### Backend Optimizations:
1. **GraphQL**: Single endpoint for all team stats data
2. **Database Optimization**: Better indexing and query optimization
3. **CDN Integration**: Cache static data on CDN
4. **API Rate Limiting**: Implement proper rate limiting
5. **Compression**: Enable response compression

## 📝 Conclusion

The Team Statistics API optimization significantly improves performance, reduces server load, and enhances user experience. The intelligent caching system, request deduplication, and parallel processing provide substantial benefits while maintaining backward compatibility.

The new `useOptimizedTeamStats` hook provides a clean, easy-to-use interface for components that need team statistics data, with built-in caching, error handling, and auto-refresh capabilities.
