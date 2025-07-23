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
      
      console.log(`API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

interface User {
  id: number
  email: string
  description: string
  available: number
  days: string[]
  time?: string
  timezone?: string
  created_at: string
}

interface LoginResponse {
  user: User
}

interface RiotAccount {
  id: number
  user_id: number
  riot_id: string
  summoner_name: string
  region: string
  rank?: string
  icon_id?: number
  created_at: string
  date_updated?: string
}

const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';

export const userService = {
  async loginOrCreateUser(email: string): Promise<User> {
    const response = await retryWithBackoff(() => fetch(`${API_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    }))

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to login or create user')
    }

    const data: LoginResponse = await response.json()
    return data.user
  },

  async getUserRiotAccount(userId: number): Promise<RiotAccount | null> {
    try {
      const response = await retryWithBackoff(() => fetch(`${API_BASE_URL}/api/user-riot-account/${userId}`))
      
      if (!response.ok) {
        if (response.status === 404) {
          return null // No Riot account found
        }
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch Riot account')
      }

      return response.json()
    } catch (error) {
      console.error('Error fetching Riot account:', error)
      return null
    }
  },

  async getUserProfile(userId: number): Promise<User> {
    const response = await retryWithBackoff(() => fetch(`${API_BASE_URL}/api/users/${userId}`))
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch user profile')
    }

    return response.json()
  },

  async updateUserProfile(userId: number, updates: { description?: string; available?: number; days?: string[]; time?: string; timezone?: string }): Promise<User> {
    const response = await retryWithBackoff(() => fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    }))

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update user profile')
    }

    return response.json()
  },

  async deleteUserRiotAccount(userId: number): Promise<void> {
    const response = await retryWithBackoff(() => fetch(`${API_BASE_URL}/api/user-riot-account/${userId}`, {
      method: 'DELETE',
    }))

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete Riot account')
    }
  },

  async updateUserRiotAccountRank(userId: number): Promise<{ rank: string }> {
    const response = await retryWithBackoff(() => fetch(`${API_BASE_URL}/api/user-riot-account/${userId}/update-rank`, {
      method: 'POST',
    }))

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update rank')
    }

    return response.json()
  },

  async updateUserRiotAccountIcon(userId: number): Promise<{ icon_id: number }> {
    const response = await retryWithBackoff(() => fetch(`${API_BASE_URL}/api/user-riot-account/${userId}/update-icon`, {
      method: 'POST',
    }))

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update icon ID')
    }

    return response.json()
  },

  async deleteUserAccount(userId: number): Promise<{ message: string }> {
    const response = await retryWithBackoff(() => fetch(`${API_BASE_URL}/api/users/${userId}/delete-account`, {
      method: 'DELETE',
    }))

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || errorData.error || 'Failed to delete user account')
    }

    return response.json()
  }
} 