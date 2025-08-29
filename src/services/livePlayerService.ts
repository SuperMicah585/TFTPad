// Live Player Service for fetching real-time player statistics
const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';

// Cache configuration
const CACHE_CONFIG = {
  liveData: 2 * 60 * 1000, // 2 minutes for live data
  memberList: 5 * 60 * 1000, // 5 minutes for member list
  riotAccounts: 10 * 60 * 1000, // 10 minutes for riot accounts
};

// Cache storage
const cache = new Map<string, { data: any; timestamp: number; promise?: Promise<any> }>();

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

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

export interface LivePlayerStats {
  [summonerName: string]: LivePlayerData;
}

// Cache utility functions
function getCacheKey(endpoint: string, params: Record<string, any> = {}): string {
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

class LivePlayerService {
  private async rankToElo(rankStr: string): Promise<number> {
    // This function replicates the server-side rank_to_elo logic
    if (!rankStr || rankStr === 'UNRANKED') return 0;
    
    rankStr = rankStr.toUpperCase();
    
    // Handle TURBO ranks
    if (rankStr.startsWith('TURBO ')) {
      const turboRank = rankStr.replace('TURBO ', '');
      if (turboRank === 'UNRANKED') return 0;
      if (turboRank === 'IRON') return 200;
      if (turboRank === 'BRONZE') return 600;
      if (turboRank === 'SILVER') return 1000;
      if (turboRank === 'GOLD') return 1400;
      if (turboRank === 'PLATINUM') return 1800;
      if (turboRank === 'EMERALD') return 2200;
      if (turboRank === 'DIAMOND') return 2600;
      return 0;
    }
    
    // Handle regular ranks
    const getDivisionValue = (rankStr: string, baseElo: number): number => {
      if (rankStr.includes(' IV')) return baseElo + 0;
      if (rankStr.includes(' III')) return baseElo + 100;
      if (rankStr.includes(' II')) return baseElo + 200;
      if (rankStr.includes(' I')) return baseElo + 300;
      return baseElo;
    };
    
    const addLpToElo = (rankStr: string, baseElo: number): number => {
      let lp = 0;
      if (rankStr.includes('LP')) {
        try {
          const lpPart = rankStr.split('LP')[0].trim();
          lp = parseInt(lpPart.split(' ').pop() || '0');
        } catch {
          lp = 0;
        }
      }
      return baseElo + lp;
    };
    
    if (rankStr.includes('IRON')) {
      const baseElo = getDivisionValue(rankStr, 0);
      return addLpToElo(rankStr, baseElo);
    } else if (rankStr.includes('BRONZE')) {
      const baseElo = getDivisionValue(rankStr, 400);
      return addLpToElo(rankStr, baseElo);
    } else if (rankStr.includes('SILVER')) {
      const baseElo = getDivisionValue(rankStr, 800);
      return addLpToElo(rankStr, baseElo);
    } else if (rankStr.includes('GOLD')) {
      const baseElo = getDivisionValue(rankStr, 1200);
      return addLpToElo(rankStr, baseElo);
    } else if (rankStr.includes('PLATINUM')) {
      const baseElo = getDivisionValue(rankStr, 1600);
      return addLpToElo(rankStr, baseElo);
    } else if (rankStr.includes('EMERALD')) {
      const baseElo = getDivisionValue(rankStr, 2000);
      return addLpToElo(rankStr, baseElo);
    } else if (rankStr.includes('DIAMOND')) {
      const baseElo = getDivisionValue(rankStr, 2400);
      return addLpToElo(rankStr, baseElo);
    } else if (rankStr.includes('MASTER') || rankStr.includes('GRANDMASTER') || rankStr.includes('CHALLENGER')) {
      const baseElo = 2800;
      return addLpToElo(rankStr, baseElo);
    }
    
    return 0;
  }

  // Clear cache (useful for testing or manual refresh)
  clearCache(): void {
    cache.clear();
  }

  // Get cache statistics (useful for debugging)
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: cache.size,
      keys: Array.from(cache.keys())
    };
  }

  // Optimized method to get group members with caching
  private async getGroupMembers(groupId: number): Promise<any[]> {
    const cacheKey = getCacheKey(`study-groups/${groupId}/users`);
    
    // Check cache first
    const cached = getCachedData<any[]>(cacheKey, CACHE_CONFIG.memberList);
    if (cached) {
      console.log('📊 Using cached group members for group:', groupId);
      return cached;
    }

    return deduplicateRequest(cacheKey, async () => {
      const membersResponse = await fetch(`${API_BASE_URL}/api/study-groups/${groupId}/users`);
      if (!membersResponse.ok) {
        throw new Error('Failed to fetch group members');
      }
      
      const membersData = await membersResponse.json();
      const members = membersData.study_group_users || membersData;
      
      setCachedData(cacheKey, members, CACHE_CONFIG.memberList);
      return members;
    });
  }

  // Optimized method to get riot account with caching
  private async getRiotAccount(userId: number): Promise<any> {
    const cacheKey = getCacheKey(`user-riot-account/${userId}`);
    
    // Check cache first
    const cached = getCachedData<any>(cacheKey, CACHE_CONFIG.riotAccounts);
    if (cached) {
      return cached;
    }

    return deduplicateRequest(cacheKey, async () => {
      // Users don't need Riot accounts for basic functionality
      // Return null to indicate no Riot account is connected
      const riotAccount = null;
      setCachedData(cacheKey, riotAccount, CACHE_CONFIG.riotAccounts);
      return riotAccount;
    });
  }

  // Optimized method to get league data with caching
  private async getLeagueData(riotId: string, userId: number): Promise<any[]> {
    const cacheKey = getCacheKey(`tft-league/${riotId}`, { user_id: userId });
    
    // Check cache first
    const cached = getCachedData<any[]>(cacheKey, CACHE_CONFIG.liveData);
    if (cached) {
      return cached;
    }

    return deduplicateRequest(cacheKey, async () => {
      const leagueResponse = await fetch(`${API_BASE_URL}/api/tft-league/${riotId}`);
      if (!leagueResponse.ok) {
        throw new Error(`Failed to get league data for user ${userId}`);
      }
      
      const leagueData = await leagueResponse.json();
      setCachedData(cacheKey, leagueData, CACHE_CONFIG.liveData);
      return leagueData;
    });
  }

  async getLivePlayerStats(groupId: number): Promise<LivePlayerStats> {
    const cacheKey = getCacheKey(`live-player-stats/${groupId}`);
    
    // Check cache first
    const cached = getCachedData<LivePlayerStats>(cacheKey, CACHE_CONFIG.liveData);
    if (cached) {
      console.log('📊 Using cached live player stats for group:', groupId);
      return cached;
    }

    return deduplicateRequest(cacheKey, async () => {
      try {
        console.log('🚀 Starting to fetch live player stats for group:', groupId);
        
        // Get all members of the group
        const members = await this.getGroupMembers(groupId);
        
        const liveStats: LivePlayerStats = {};
        
        // Process members in parallel for better performance
        const memberPromises = members.map(async (member) => {
          if (!member.user_id) {
            console.warn('⚠️ Member has no user_id:', member);
            return null;
          }
          
          try {
            // Get user's riot account
            const riotAccount = await this.getRiotAccount(member.user_id);
            if (!riotAccount || !riotAccount.riot_id) {
              console.warn(`⚠️ No riot account found for user ${member.user_id}`);
              return null;
            }
            
            // Get league data
            const leagueData = await this.getLeagueData(riotAccount.riot_id, member.user_id);
            
            // Find Ranked TFT data (not Turbo)
            const rankedData = leagueData.find((entry: any) => entry.queueType === 'RANKED_TFT');
            if (!rankedData) {
              console.warn(`⚠️ No ranked TFT data found for ${member.summoner_name}`);
              return null;
            }
            
            // Convert rank to ELO
            const rankStr = `${rankedData.tier} ${rankedData.rank} ${rankedData.leaguePoints}LP`;
            const elo = await this.rankToElo(rankStr);
            
            // Create live data point
            const liveData: LivePlayerData = {
              riot_id: riotAccount.riot_id,
              summoner_name: member.summoner_name,
              tier: rankedData.tier,
              rank: rankedData.rank,
              leaguePoints: rankedData.leaguePoints,
              wins: rankedData.wins,
              losses: rankedData.losses,
              elo: elo,
              created_at: new Date().toISOString() // Current timestamp for live data
            };
            
            return { summonerName: member.summoner_name, data: liveData };
            
          } catch (error) {
            console.error(`❌ Error fetching live data for ${member.summoner_name}:`, error);
            return null;
          }
        });
        
        // Wait for all member data to be processed
        const results = await Promise.allSettled(memberPromises);
        
        // Process results
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            liveStats[result.value.summonerName] = result.value.data;
          }
        });
        
        console.log(`✅ Successfully fetched live data for ${Object.keys(liveStats).length} members`);
        
        setCachedData(cacheKey, liveStats, CACHE_CONFIG.liveData);
        return liveStats;
        
      } catch (error) {
        console.error('❌ Error fetching live player stats:', error);
        throw error;
      }
    });
  }
}

export const livePlayerService = new LivePlayerService(); 