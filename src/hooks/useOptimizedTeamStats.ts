import { useState, useEffect, useCallback, useRef } from 'react';
import { teamStatsService } from '../services/teamStatsService';
import { livePlayerService } from '../services/livePlayerService';

interface UseOptimizedTeamStatsOptions {
  groupId: number;
  startDate: string;
  includeLiveData?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseOptimizedTeamStatsReturn {
  // Data
  events: any[];
  memberNames: { [riotId: string]: string };
  liveData: { [summonerName: string]: any };
  members: any[];
  
  // Loading states
  isLoading: boolean;
  isLiveDataLoading: boolean;
  
  // Error states
  error: string | null;
  liveDataError: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  refreshLiveData: () => Promise<void>;
  clearCache: () => void;
  
  // Cache info
  cacheStats: { size: number; keys: string[] };
}

export function useOptimizedTeamStats({
  groupId,
  startDate,
  includeLiveData = false,
  autoRefresh = false,
  refreshInterval = 2 * 60 * 1000 // 2 minutes default
}: UseOptimizedTeamStatsOptions): UseOptimizedTeamStatsReturn {
  const [events, setEvents] = useState<any[]>([]);
  const [memberNames, setMemberNames] = useState<{ [riotId: string]: string }>({});
  const [liveData, setLiveData] = useState<{ [summonerName: string]: any }>({});
  const [members, setMembers] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveDataLoading, setIsLiveDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveDataError, setLiveDataError] = useState<string | null>(null);
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Fetch basic team stats data - NO CACHING
  const fetchTeamStats = useCallback(async () => {
    if (!groupId || !startDate) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🚀 Fetching team stats for group (NO CACHING):', groupId);
      
      // Clear cache before fetching to ensure fresh data
      teamStatsService.clearCache();
      livePlayerService.clearCache();
      
      // Use direct API calls instead of cached services
      const queryParams = new URLSearchParams();
      queryParams.append('group_id', groupId.toString());
      queryParams.append('start_date', startDate);
      if (includeLiveData) {
        queryParams.append('include_members', 'true');
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001'}/api/team-stats/members?${queryParams}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch team stats: ${response.statusText}`);
      }
      const result = await response.json();
      
      setEvents(result.events || []);
      setMemberNames(result.memberNames || {});
      setLiveData(result.liveData || {});
      setMembers(result.members || []);
      
      console.log('✅ Team stats fetched successfully (fresh data)');
      
    } catch (err) {
      console.error('❌ Error fetching team stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch team stats');
    } finally {
      setIsLoading(false);
    }
  }, [groupId, startDate, includeLiveData]);

  // Fetch live data separately (for manual refresh) - NO CACHING
  const fetchLiveData = useCallback(async () => {
    if (!groupId) return;
    
    try {
      setIsLiveDataLoading(true);
      setLiveDataError(null);
      
      console.log('🚀 Fetching live data for group (NO CACHING):', groupId);
      
      // Clear cache before fetching
      livePlayerService.clearCache();
      
      const liveStats = await livePlayerService.getLivePlayerStats(groupId);
      setLiveData(liveStats);
      
      console.log('✅ Live data fetched successfully');
      
    } catch (err) {
      console.error('❌ Error fetching live data:', err);
      setLiveDataError(err instanceof Error ? err.message : 'Failed to fetch live data');
    } finally {
      setIsLiveDataLoading(false);
    }
  }, [groupId]);

  // Manual refresh functions
  const refresh = useCallback(async () => {
    await fetchTeamStats();
  }, [fetchTeamStats]);

  const refreshLiveData = useCallback(async () => {
    await fetchLiveData();
  }, [fetchLiveData]);

  // Clear cache function
  const clearCache = useCallback(() => {
    teamStatsService.clearCache();
    livePlayerService.clearCache();
    console.log('🗑️ Cache cleared');
  }, []);

  // Get cache statistics
  const cacheStats = {
    size: teamStatsService.getCacheStats().size + livePlayerService.getCacheStats().size,
    keys: [...teamStatsService.getCacheStats().keys, ...livePlayerService.getCacheStats().keys]
  };

  // Set up auto-refresh for live data
  useEffect(() => {
    if (autoRefresh && includeLiveData) {
      refreshIntervalRef.current = setInterval(() => {
        console.log('🔄 Auto-refreshing live data...');
        fetchLiveData();
      }, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefresh, includeLiveData, refreshInterval, fetchLiveData]);

  // Initial data fetch
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      fetchTeamStats();
    }
  }, [fetchTeamStats]);

  // Refetch when dependencies change
  useEffect(() => {
    if (isInitializedRef.current) {
      fetchTeamStats();
    }
  }, [groupId, startDate, includeLiveData]);

  return {
    // Data
    events,
    memberNames,
    liveData,
    members,
    
    // Loading states
    isLoading,
    isLiveDataLoading,
    
    // Error states
    error,
    liveDataError,
    
    // Actions
    refresh,
    refreshLiveData,
    clearCache,
    
    // Cache info
    cacheStats
  };
}
