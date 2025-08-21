export interface RiotAuthResponse {
  success: boolean
  message: string
  token: string
  user: {
    id: number
    riot_id: string
    summoner_name: string
    region: string
    created_at: string
  }
}

export interface RiotAuthError {
  error: string
  message?: string
}

const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001'

// Helper function for retry logic
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)))
    }
  }
  throw new Error('Max retries reached')
}

export const riotAuthService = {
  async loginWithRiot(gameName: string, tagLine: string, region: string): Promise<RiotAuthResponse> {
    // Validate Riot ID format
    if (!gameName || !tagLine) {
      throw new Error('Game name and tag line are required')
    }
    
    if (gameName.length < 3 || gameName.length > 16) {
      throw new Error('Game name must be between 3 and 16 characters')
    }
    
    if (tagLine.length < 2 || tagLine.length > 5) {
      throw new Error('Tag line must be between 2 and 5 characters')
    }
    
    // For proof of concept, we'll simulate a successful login
    // In the real implementation, this would call the Riot API

    
    const response = await retryWithBackoff(() => 
      fetch(`${API_BASE_URL}/api/auth/riot-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameName,
          tagLine,
          region
        })
      })
    )

    if (!response.ok) {
      const errorData: RiotAuthError = await response.json()
      throw new Error(errorData.error || 'Failed to login with Riot account')
    }

    return response.json()
  },

  async verifyToken(token: string): Promise<{ success: boolean; user: { id: number; riot_id: string; summoner_name: string; region: string; created_at: string; description?: string; available?: number; days?: string[]; time?: string; timezone?: string } }> {
    const response = await retryWithBackoff(() =>
      fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Token verification failed')
    }

    return response.json()
  },

  // Store token in localStorage
  storeToken(token: string): void {
    localStorage.setItem('riot_auth_token', token)
  },

  // Get token from localStorage
  getToken(): string | null {
    return localStorage.getItem('riot_auth_token')
  },

  // Remove token from localStorage
  removeToken(): void {
    localStorage.removeItem('riot_auth_token')
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken()
  },

  // Check if token is expired
  isTokenExpired(): boolean {
    const token = this.getToken()
    if (!token) return true
    
    try {
      // Decode the token without verification to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]))
      const exp = payload.exp * 1000 // Convert to milliseconds
      return Date.now() >= exp
    } catch (error) {
      console.error('Error checking token expiration:', error)
      return true
    }
  }
} 