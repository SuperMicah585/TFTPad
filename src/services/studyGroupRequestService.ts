// Study Group Request API Service
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
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

export interface StudyGroupRequest {
  id: number;
  created_at: string;
  study_group_id: number;
  user_id: number;
  status: 'pending' | 'approved' | 'rejected';
  user?: {
    id: number;
    summoner_name: string;
    elo?: number;
    rank?: string;
    icon_id?: number;
  };
  study_group?: {
    id: number;
    group_name: string;
  };
}

export interface CreateRequestData {
  study_group_id: number;
  user_id: number;
}

export const studyGroupRequestService = {
  // Create a new study group request
  async createRequest(data: CreateRequestData): Promise<StudyGroupRequest> {
    const response = await retryWithBackoff(() => 
      fetch(`${API_ENDPOINT}/study-group-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    );
    
    if (!response.ok) {
      throw new Error(`Failed to create study group request: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get all requests for a specific study group (for captains)
  async getGroupRequests(groupId: number): Promise<StudyGroupRequest[]> {
    const response = await retryWithBackoff(() => 
      fetch(`${API_ENDPOINT}/study-groups/${groupId}/requests`)
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch study group requests: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.requests || [];
  },

  // Get all requests for a specific user
  async getUserRequests(userId: number): Promise<StudyGroupRequest[]> {
    const response = await retryWithBackoff(() => 
      fetch(`${API_ENDPOINT}/users/${userId}/study-group-requests`)
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user study group requests: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.requests || [];
  },

  // Respond to a study group request (approve/reject)
  async respondToRequest(requestId: number, response: 'approve' | 'reject'): Promise<{ message: string }> {
    const responseData = await retryWithBackoff(() => 
      fetch(`${API_ENDPOINT}/study-group-requests/${requestId}/${response}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
    
    if (!responseData.ok) {
      throw new Error(`Failed to respond to study group request: ${responseData.statusText}`);
    }
    
    return responseData.json();
  },

  // Cancel a pending request
  async cancelRequest(requestId: number): Promise<{ message: string }> {
    const response = await retryWithBackoff(() => 
      fetch(`${API_ENDPOINT}/study-group-requests/${requestId}`, {
        method: 'DELETE',
      })
    );
    
    if (!response.ok) {
      throw new Error(`Failed to cancel study group request: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Check if user has a pending request for a specific group
  async checkUserRequest(groupId: number, userId: number): Promise<StudyGroupRequest | null> {
    try {
      const userRequests = await this.getUserRequests(userId);
      const pendingRequest = userRequests.find(
        request => request.study_group_id === groupId && request.status === 'pending'
      );
      return pendingRequest || null;
    } catch (error) {
      console.error('Error checking user request:', error);
      return null;
    }
  },
};
