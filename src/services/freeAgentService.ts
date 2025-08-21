export interface FreeAgent {
  id: number; // This is the user ID
  summoner_name: string;
  elo: number;
  rank: string;
  looking_for: string;
  availability: string[];
  time?: string;
  timezone?: string;
  experience: string;
  created_date: string;
  region: string;
  date_updated: string;
  icon_id?: number;
  riot_id?: string;
}

export interface FreeAgentFilters {
  page?: number;
  limit?: number;
  search?: string;
  minRank?: string;
  maxRank?: string;
  availabilityDays?: string;
  availabilityTime?: string;
  availabilityTimezone?: string;
  region?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface FreeAgentResponse {
  free_agents: FreeAgent[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

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
      
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';

export const freeAgentService = {
  async getFreeAgents(filters?: FreeAgentFilters): Promise<FreeAgentResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.minRank) params.append('minRank', filters.minRank);
        if (filters.maxRank) params.append('maxRank', filters.maxRank);
        if (filters.availabilityDays) params.append('availabilityDays', filters.availabilityDays);
        if (filters.availabilityTime) params.append('availabilityTime', filters.availabilityTime);
        if (filters.availabilityTimezone) params.append('availabilityTimezone', filters.availabilityTimezone);
        if (filters.region) params.append('region', filters.region);
        if (filters.sort_by) params.append('sort_by', filters.sort_by);
        if (filters.sort_order) params.append('sort_order', filters.sort_order);
      }
      
      const url = `${API_BASE_URL}/api/free-agents${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await retryWithBackoff(() => fetch(url));
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch free agents');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching free agents:', error);
      throw error;
    }
  },

  async getFreeAgentById(id: number): Promise<FreeAgent> {
    try {
      const url = `${API_BASE_URL}/api/free-agents/${id}`;
      
      const response = await retryWithBackoff(() => fetch(url));
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch free agent');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching free agent:', error);
      throw error;
    }
  }
} 