// Study Group API Service
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

export interface StudyGroup {
  id: number;
  group_name: string;
  description: string;
  meeting_schedule: string[];
  application_instructions: string;
  time?: string;
  timezone?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  total_elo?: number;
  avg_elo?: number;
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
  meeting_days?: string;
  minEloFilter?: number;
  maxEloFilter?: number;
  time?: string;
  timezone?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface User {
  id: number;
  created_at: string;
  email: string;
  description: string;
  available: number;
}

export interface UserStudyGroup {
  id: number;
  created_at: string;
  user_id: number;
  study_group_id: number;
  owner: number; // 1 = owner, 0 = not owner
  users?: User;
  study_group?: StudyGroup;
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
    if (params.meeting_days !== undefined) queryParams.append('meeting_days', params.meeting_days);
    if (params.minEloFilter !== undefined) queryParams.append('minEloFilter', params.minEloFilter.toString());
    if (params.maxEloFilter !== undefined) queryParams.append('maxEloFilter', params.maxEloFilter.toString());
    if (params.time) queryParams.append('time', params.time);
    if (params.timezone) queryParams.append('timezone', params.timezone);
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

  // Get users in a specific study group
  async getStudyGroupUsers(groupId: number): Promise<UserStudyGroup[]> {
    const response = await retryWithBackoff(() => fetch(`${API_ENDPOINT}/study-groups/${groupId}/users`));
    if (!response.ok) {
      throw new Error(`Failed to fetch study group users: ${response.statusText}`);
    }
    const data = await response.json();
    return data.study_group_users;
  },

  // Switch captain for a study group
  async switchCaptain(groupId: number, newCaptainSummonerName: string): Promise<{ message: string, new_captain_summoner_name: string }> {
    const response = await retryWithBackoff(() => 
      fetch(`${API_ENDPOINT}/study-groups/${groupId}/switch-captain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_captain_summoner_name: newCaptainSummonerName }),
      })
    );
    
    if (!response.ok) {
      throw new Error(`Failed to switch captain: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Delete a study group (captain only)
  async deleteStudyGroup(groupId: number, captainSummonerName: string): Promise<{ message: string, deleted_group_id: number }> {
    const response = await retryWithBackoff(() => 
      fetch(`${API_ENDPOINT}/study-groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ captain_summoner_name: captainSummonerName }),
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
  async leaveStudyGroup(groupId: number, userId: number): Promise<{ message: string }> {
    const response = await retryWithBackoff(() => 
      fetch(`${API_ENDPOINT}/study-groups/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      })
    );
    
    if (!response.ok) {
      throw new Error(`Failed to leave study group: ${response.statusText}`);
    }
    
    return response.json();
  },

};