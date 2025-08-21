// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

// Retry function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.maxRetries,
  baseDelay: number = RETRY_CONFIG.baseDelay,
  maxDelay: number = RETRY_CONFIG.maxDelay
): Promise<T> {
  let lastError: Error | null = null;
  
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

export interface StudyGroupInvite {
  id: number;
  user_one: number; // Sender
  user_two: number; // Receiver
  study_group_id: number;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at?: string;
  sender_name?: string;
  receiver_name?: string;
  study_group?: {
    group_name: string;
    description: string;
  };
}

export interface CreateInviteRequest {
  user_one: number;
  user_two: number;
  study_group_id: number;
  message: string;
}

export interface RespondToInviteRequest {
  response: 'accept' | 'decline';
}

const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';

export const studyGroupInviteService = {
  // Create a new study group invite
  async createInvite(data: CreateInviteRequest): Promise<{ message: string; invite: StudyGroupInvite }> {
    const response = await retryWithBackoff(() => 
      fetch(`${API_BASE_URL}/api/study-group-invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create invitation');
    }
    
    return response.json();
  },

  // Get pending invites for a user (user_two - receiver)
  async getUserInvites(userId: number): Promise<StudyGroupInvite[]> {
    const response = await retryWithBackoff(() => 
      fetch(`${API_BASE_URL}/api/study-group-invites/user/${userId}`)
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch invitations');
    }
    
    const data = await response.json();
    return data.invites || [];
  },

  // Get invites sent by a user (user_one - sender)
  async getSentInvites(userId: number): Promise<StudyGroupInvite[]> {
    const response = await retryWithBackoff(() => 
      fetch(`${API_BASE_URL}/api/study-group-invites/sent/${userId}`)
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch sent invitations');
    }
    
    const data = await response.json();
    return data.invites || [];
  },

  // Respond to an invite (accept or decline)
  async respondToInvite(inviteId: number, response: 'accept' | 'decline'): Promise<{ message: string; status: string }> {
    const responseData = await retryWithBackoff(() => 
      fetch(`${API_BASE_URL}/api/study-group-invites/${inviteId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response }),
      })
    );
    
    if (!responseData.ok) {
      const errorData = await responseData.json();
      throw new Error(errorData.error || 'Failed to respond to invitation');
    }
    
    return responseData.json();
  },
}; 