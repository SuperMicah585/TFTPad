// Team Stats API Service
const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';
const API_ENDPOINT = `${API_BASE_URL}/api`;

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
};

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
      
      console.log(`API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

export interface RankAuditEvent {
  id: number;
  created_at: string;
  elo: number;
  wins: number;
  losses: number;
  riot_id: string;
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
  // Get team stats for a study group
  async getTeamStats(params: TeamStatsParams): Promise<TeamStatsData> {
    const queryParams = new URLSearchParams();
    queryParams.append('group_id', params.groupId.toString());
    queryParams.append('start_date', params.startDate);

    const response = await retryWithBackoff(() => 
      fetch(`${API_ENDPOINT}/team-stats?${queryParams}`)
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch team stats: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get individual member stats for a group
  async getMemberStats(groupId: number, startDate: string): Promise<{ [riotId: string]: RankAuditEvent[] }> {
    const queryParams = new URLSearchParams();
    queryParams.append('group_id', groupId.toString());
    queryParams.append('start_date', startDate);

    console.log('🔍 Fetching team stats with params:', {
      groupId,
      startDate,
      url: `${API_ENDPOINT}/team-stats/members?${queryParams}`
    });

    const response = await retryWithBackoff(() => 
      fetch(`${API_ENDPOINT}/team-stats/members?${queryParams}`)
    );
    
    if (!response.ok) {
      console.error('❌ Team stats API error:', response.status, response.statusText);
      throw new Error(`Failed to fetch member stats: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Team stats API response:', data);
    
    return data;
  }
}; 