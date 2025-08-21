// Team Stats API Service
const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';
const API_ENDPOINT = `${API_BASE_URL}/api`;

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
};

// Cache configuration
const CACHE_CONFIG = {
  teamStats: 5 * 60 * 1000, // 5 minutes
  memberStats: 5 * 60 * 1000, // 5 minutes
  combinedStats: 5 * 60 * 1000, // 5 minutes
  liveData: 2 * 60 * 1000, // 2 minutes (shorter for live data)
};

// Cache storage
const cache = new Map<string, { data: any; timestamp: number; promise?: Promise<any> }>();

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

// Utility function for exponential backoff retry
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.maxRetries,
  baseDelay: number = RETRY_CONFIG.baseDelay,
  maxDelay: number = RETRY_CONFIG.maxDelay
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof Error && error.message.includes('4')) {
        throw error;
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Cache utility functions
function getCacheKey(endpoint: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${endpoint}?${sortedParams}`;
}

function isCacheValid(timestamp: number, ttl: number): boolean {
  return Date.now() - timestamp < ttl;
}

function getCachedData<T>(key: string, ttl: number): T | null {
  const cached = cache.get(key);
  if (cached && isCacheValid(cached.timestamp, ttl)) {
    return cached.data as T;
  }
  return null;
}

function setCachedData(key: string, data: any, _ttl: number): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Deduplication utility
async function deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  // Check if there's already a pending request
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }

  // Create new request
  const promise = requestFn();
  pendingRequests.set(key, promise);

  try {
    const result = await promise;
    return result;
  } finally {
    // Clean up pending request
    pendingRequests.delete(key);
  }
}

export interface RankAuditEvent {
  id: number;
  created_at: string;
  elo: number;
  wins: number;
  losses: number;
  riot_id: string;
}

export interface LivePlayerData {
  riot_id: string;
  summoner_name: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  elo: number;
  created_at: string;
}

export interface MemberData {
  summoner_name: string;
  elo: number;
  owner: number;
  rank?: string;
  icon_id?: number;
  user_id?: number;
  current_elo?: number; // Live ELO from live data
  current_wins?: number;
  current_losses?: number;
}

export interface CombinedTeamStatsResponse {
  events: RankAuditEvent[];
  memberNames: { [riotId: string]: string };
  liveData: { [summonerName: string]: LivePlayerData };
  members: MemberData[]; // Current member list with live ELO
}

export interface TeamStatsData {
  events: RankAuditEvent[];
  memberCount: number;
  averageElo: number;
  totalWins: number;
  totalLosses: number;
}

export interface TeamStatsParams {
  groupId: number;
  startDate: string; // ISO date string
}

export const teamStatsService = {
  // Clear cache (useful for testing or manual refresh)
  clearCache(): void {
    cache.clear();
  },

  // Get cache statistics (useful for debugging)
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: cache.size,
      keys: Array.from(cache.keys())
    };
  },

  // Get team stats for a study group
  async getTeamStats(params: TeamStatsParams): Promise<TeamStatsData> {
    const cacheKey = getCacheKey('team-stats', params);
    
    // Check cache first
    const cached = getCachedData<TeamStatsData>(cacheKey, CACHE_CONFIG.teamStats);
    if (cached) {
      console.log('📊 Using cached team stats for group:', params.groupId);
      return cached;
    }

    return deduplicateRequest(cacheKey, async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('group_id', params.groupId.toString());
      queryParams.append('start_date', params.startDate);

      const response = await retryWithBackoff(() => 
        fetch(`${API_ENDPOINT}/team-stats?${queryParams}`)
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team stats: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCachedData(cacheKey, data, CACHE_CONFIG.teamStats);
      return data;
    });
  },

  // Get individual member stats for a group
  async getMemberStats(groupId: number, startDate: string): Promise<{ [riotId: string]: RankAuditEvent[] }> {
    const cacheKey = getCacheKey('team-stats/members', { groupId, startDate });
    
    // Check cache first
    const cached = getCachedData<{ [riotId: string]: RankAuditEvent[] }>(cacheKey, CACHE_CONFIG.memberStats);
    if (cached) {
      console.log('📊 Using cached member stats for group:', groupId);
      return cached;
    }

    return deduplicateRequest(cacheKey, async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('group_id', groupId.toString());
      queryParams.append('start_date', startDate);

      const response = await retryWithBackoff(() => 
        fetch(`${API_ENDPOINT}/team-stats/members?${queryParams}`)
      );
      
      if (!response.ok) {
        console.error('❌ Team stats API error:', response.status, response.statusText);
        throw new Error(`Failed to fetch member stats: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCachedData(cacheKey, data, CACHE_CONFIG.memberStats);
      return data;
    });
  },

  // Get combined team stats including member data with current ELO
  async getCombinedTeamStats(groupId: number, startDate: string): Promise<CombinedTeamStatsResponse> {
    const cacheKey = getCacheKey('team-stats/members-combined', { groupId, startDate, include_members: 'true' });
    
    // Check cache first
    const cached = getCachedData<CombinedTeamStatsResponse>(cacheKey, CACHE_CONFIG.combinedStats);
    if (cached) {
      console.log('📊 Using cached combined stats for group:', groupId);
      return cached;
    }

    return deduplicateRequest(cacheKey, async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('group_id', groupId.toString());
      queryParams.append('start_date', startDate);
      queryParams.append('include_members', 'true'); // Flag to include member data

      const response = await retryWithBackoff(() => 
        fetch(`${API_ENDPOINT}/team-stats/members?${queryParams}`)
      );
      
      if (!response.ok) {
        console.error('❌ Combined team stats API error:', response.status, response.statusText);
        throw new Error(`Failed to fetch combined team stats: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCachedData(cacheKey, data, CACHE_CONFIG.combinedStats);
      return data;
    });
  },

  // Optimized method to get all team stats data in one call
  async getOptimizedTeamStats(groupId: number, startDate: string, includeLiveData: boolean = false): Promise<{
    events: RankAuditEvent[];
    memberNames: { [riotId: string]: string };
    liveData: { [summonerName: string]: LivePlayerData };
    members: MemberData[];
  }> {
    const cacheKey = getCacheKey('team-stats/optimized', { groupId, startDate, includeLiveData });
    
    // Check cache first
    const cached = getCachedData<{
      events: RankAuditEvent[];
      memberNames: { [riotId: string]: string };
      liveData: { [summonerName: string]: LivePlayerData };
      members: MemberData[];
    }>(cacheKey, includeLiveData ? CACHE_CONFIG.liveData : CACHE_CONFIG.combinedStats);
    
    if (cached) {
      console.log('📊 Using cached optimized stats for group:', groupId);
      return cached;
    }

    return deduplicateRequest(cacheKey, async () => {
      try {
        // Try the combined API first (most efficient)
        const combinedStats = await this.getCombinedTeamStats(groupId, startDate);
        
        const result = {
          events: combinedStats.events || [],
          memberNames: combinedStats.memberNames || {},
          liveData: combinedStats.liveData || {},
          members: combinedStats.members || []
        };
        
        setCachedData(cacheKey, result, includeLiveData ? CACHE_CONFIG.liveData : CACHE_CONFIG.combinedStats);
        return result;
        
      } catch (error) {
        console.log('⚠️ Combined API failed, falling back to basic stats:', error);
        
        // Fallback to basic member stats
        const memberStats = await this.getMemberStats(groupId, startDate);
        
        let allEvents: RankAuditEvent[] = [];
        let names: { [riotId: string]: string } = {};
        
        if (memberStats && memberStats.events && Array.isArray(memberStats.events)) {
          allEvents = memberStats.events;
          if (memberStats.memberNames && typeof memberStats.memberNames === 'object') {
            names = memberStats.memberNames as unknown as { [riotId: string]: string };
          }
        } else if (memberStats && typeof memberStats === 'object' && Object.keys(memberStats).length > 0) {
          allEvents = Object.values(memberStats).flat();
          Object.keys(memberStats).forEach(summonerName => {
            names[summonerName] = summonerName;
          });
        }
        
        const result = {
          events: allEvents,
          memberNames: names,
          liveData: {},
          members: []
        };
        
        setCachedData(cacheKey, result, includeLiveData ? CACHE_CONFIG.liveData : CACHE_CONFIG.combinedStats);
        return result;
      }
    });
  }
}; 