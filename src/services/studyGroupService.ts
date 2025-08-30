// Study Group API Service

const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';
const API_ENDPOINT = `${API_BASE_URL}/api`;

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  timeout: 30000, // 30 seconds total timeout
};

// Utility function for exponential backoff retry with timeout
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.maxRetries,
  baseDelay: number = RETRY_CONFIG.baseDelay,
  maxDelay: number = RETRY_CONFIG.maxDelay,
  timeout: number = RETRY_CONFIG.timeout
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout to the fetch operation
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${timeout}ms`));
        }, timeout);
      });
      
      const result = await Promise.race([fn(), timeoutPromise]);
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx) or timeouts
      if (error instanceof Error && (error.message.includes('4') || error.message.includes('timeout'))) {
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

export interface StudyGroup {
  id: number;
  group_name: string;
  description: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  total_elo?: number;
  avg_elo?: number;
  owner?: number; // User ID of who created the group
}

export interface StudyGroupsResponse {
  groups: StudyGroup[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface StudyGroupsParams {
  page?: number;
  limit?: number;
  search?: string;
  minEloFilter?: number;
  maxEloFilter?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface User {
  id: number;
  created_at: string;
  email: string;
}

export interface UserStudyGroup {
  id: number;
  created_at: string;
  riot_id: string;
  study_group_id: number;
  owner?: number;
  elo?: number;
  rank?: string;
  summoner_name?: string;
  icon_id?: number;
}

export const studyGroupService = {
  // Get study groups with pagination and filtering
  async getStudyGroups(params: StudyGroupsParams = {}): Promise<StudyGroupsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.minEloFilter !== undefined) queryParams.append('minEloFilter', params.minEloFilter.toString());
    if (params.maxEloFilter !== undefined) queryParams.append('maxEloFilter', params.maxEloFilter.toString());
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    

    const response = await retryWithBackoff(() => fetch(`${API_ENDPOINT}/study-groups?${queryParams}`));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch study groups: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get a specific study group by ID
  async getStudyGroup(id: number): Promise<StudyGroup> {
    const response = await retryWithBackoff(() => fetch(`${API_ENDPOINT}/study-groups/${id}`));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch study group: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get all users
  async getUsers(): Promise<User[]> {
    const response = await retryWithBackoff(() => fetch(`${API_ENDPOINT}/users`));
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }
    const data = await response.json();
    return data.users;
  },

  // Get all user-study-group relationships
  async getUserStudyGroups(): Promise<UserStudyGroup[]> {
    const response = await retryWithBackoff(() => fetch(`${API_ENDPOINT}/user-to-study-group`));
    if (!response.ok) {
      throw new Error(`Failed to fetch user study groups: ${response.statusText}`);
    }
    const data = await response.json();
    return data.user_study_groups;
  },

  // Get study groups for a specific user
  async getUserStudyGroupsByUser(userId: number): Promise<UserStudyGroup[]> {
    const response = await retryWithBackoff(() => fetch(`${API_ENDPOINT}/users/${userId}/study-groups`));
    if (!response.ok) {
      throw new Error(`Failed to fetch user study groups: ${response.statusText}`);
    }
    const data = await response.json();
    return data.user_study_groups;
  },

  // Get study groups created by a specific user (owner)
  async getStudyGroupsByOwner(ownerId: number): Promise<StudyGroup[]> {
    const response = await retryWithBackoff(() => fetch(`${API_ENDPOINT}/users/${ownerId}/owned-study-groups`));
    if (!response.ok) {
      throw new Error(`Failed to fetch owned study groups: ${response.statusText}`);
    }
    const data = await response.json();
    return data.study_groups || [];
  },

  // Get study groups created by a specific user (owner) with member data
  async getStudyGroupsByOwnerWithMembers(ownerId: number): Promise<StudyGroup[]> {
    // Use existing Supabase authentication instead of JWT
    try {
      const { fetchWithAuthRetry } = await import('./apiUtils');
      
      // Try multiple approaches for better reliability
      let lastError: Error | null = null;
      
      // Approach 1: Quick timeout with retry
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await fetchWithAuthRetry(`${API_ENDPOINT}/users/${ownerId}/owned-study-groups-with-members`, {
            signal: AbortSignal.timeout(15000) // 15 second timeout per attempt
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch owned study groups with members: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          return data.study_groups || [];
          
        } catch (error) {
          lastError = error as Error;
          
          // If it's a client error (4xx), don't retry
          if (error instanceof Error && error.message.includes('4')) {
            throw error;
          }
          
          // If this is the last attempt, try the fallback
          if (attempt === 3) {
            break;
          }
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
      
      // Approach 2: Fallback - try the simpler endpoint
      try {
        const fallbackGroups = await this.getStudyGroupsByOwner(ownerId);
        
        // Transform the data to match expected format
        const transformedGroups = fallbackGroups.map(group => ({
          ...group,
          members: [] // Empty members array since we don't have member data
        }));
        
        return transformedGroups;
        
      } catch (fallbackError) {
        throw lastError || fallbackError;
      }
      
    } catch (authError) {
      throw new Error(`Authentication failed: ${authError instanceof Error ? authError.message : 'Unknown error'}`);
    }
  },


  // Get users in a specific study group
  async getStudyGroupUsers(groupId: number, updateRanks: boolean = true): Promise<UserStudyGroup[]> {
    const url = new URL(`${API_ENDPOINT}/study-groups/${groupId}/users`);
    url.searchParams.append('update_ranks', updateRanks.toString());
    
    const response = await retryWithBackoff(() => fetch(url.toString()));
    if (!response.ok) {
      throw new Error(`Failed to fetch study group users: ${response.statusText}`);
    }
    const data = await response.json();
    return data.study_group_users;
  },

  // Captain functionality removed - this method is no longer needed

  // Delete a study group (only owners can delete)
  async deleteStudyGroup(groupId: number, userId: number): Promise<{ message: string, deleted_group_id: number }> {
    const response = await retryWithBackoff(() => 
      fetch(`${API_ENDPOINT}/study-groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      })
    );
    
    if (!response.ok) {
      throw new Error(`Failed to delete study group: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Create a new study group
  async createStudyGroup(data: {
    user_id: number;
    group_name: string;
    description?: string;
    meeting_schedule?: string[];
    application_instructions?: string;
    time?: string;
    timezone?: string;
    image_url?: string;
  }): Promise<{ message: string; group: StudyGroup }> {
    const response = await retryWithBackoff(() => 
      fetch(`${API_ENDPOINT}/study-groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    );
    
    if (!response.ok) {
      throw new Error(`Failed to create study group: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Update a study group
  async updateStudyGroup(id: number, data: {
    group_name?: string;
    description?: string;
    meeting_schedule?: string[];
    application_instructions?: string;
    time?: string;
    timezone?: string;
    image_url?: string;
  }): Promise<StudyGroup> {
    const response = await retryWithBackoff(() => 
      fetch(`${API_ENDPOINT}/study-groups/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    );
    
    if (!response.ok) {
      throw new Error(`Failed to update study group: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Leave a study group
  async leaveStudyGroup(groupId: number, riotId: string): Promise<{ message: string }> {
    const response = await retryWithBackoff(() => 
      fetch(`${API_ENDPOINT}/study-groups/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ riot_id: riotId }),
      })
    );
    
    if (!response.ok) {
      throw new Error(`Failed to leave study group: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Add a member directly to a study group
  async addMemberToStudyGroup(groupId: number, userSummonerName: string, addedByUserId: number): Promise<{ message: string, added_user_id: number, study_group_id: number }> {
    const response = await retryWithBackoff(() => 
      fetch(`${API_ENDPOINT}/study-groups/${groupId}/add-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user_summoner_name: userSummonerName,
          added_by_user_id: addedByUserId
        }),
      })
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to add member to study group: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Remove a member from a study group
  async removeMemberFromStudyGroup(groupId: number, summonerName: string): Promise<{ message: string }> {
    const response = await retryWithBackoff(() => 
      fetch(`${API_ENDPOINT}/study-groups/${groupId}/remove-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          summoner_name: summonerName
        }),
      })
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to remove member from study group: ${response.statusText}`);
    }
    
    return response.json();
  },

};