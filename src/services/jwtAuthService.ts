// JWT Authentication Service
// This service handles JWT token exchange and management after Supabase authentication

const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';

interface JWTTokenResponse {
  success: boolean;
  token: string;
  user_id: number;
}

class JWTAuthService {
  private token: string | null = null;
  private userId: number | null = null;
  private riotId: string | null = null;

  // Exchange Supabase token for JWT token
  async exchangeToken(supabaseToken: string): Promise<JWTTokenResponse> {
    try {
      console.log('🔐 JWT Service: Starting token exchange...');
      console.log('🔐 JWT Service: API_BASE_URL:', API_BASE_URL);
      console.log('🔐 JWT Service: Supabase token length:', supabaseToken.length);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/supabase/exchange-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔐 JWT Service: Response status:', response.status);
      console.log('🔐 JWT Service: Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔐 JWT Service: Error response:', errorText);
        throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
      }

      const data: JWTTokenResponse = await response.json();
      console.log('🔐 JWT Service: Success response:', data);
      
      // Store the JWT token and user info
      this.token = data.token;
      this.userId = data.user_id;
      
      // Store in localStorage for persistence
      localStorage.setItem('jwt_token', data.token);
      localStorage.setItem('jwt_user_id', data.user_id.toString());

      return data;
    } catch (error) {
      console.error('JWT token exchange failed:', error);
      throw error;
    }
  }

  // Get stored JWT token
  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('jwt_token');
    }
    return this.token;
  }

  // Get stored user ID
  getUserId(): number | null {
    if (!this.userId) {
      const stored = localStorage.getItem('jwt_user_id');
      this.userId = stored ? parseInt(stored, 10) : null;
    }
    return this.userId;
  }

  // Get stored riot ID
  getRiotId(): string | null {
    if (!this.riotId) {
      this.riotId = localStorage.getItem('jwt_riot_id');
    }
    return this.riotId;
  }

  // Check if user is authenticated with JWT
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Basic JWT expiration check (you might want to add more validation)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < expirationTime;
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return false;
    }
  }

  // Clear stored authentication data
  clearAuth(): void {
    this.token = null;
    this.userId = null;
    this.riotId = null;
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('jwt_user_id');
    localStorage.removeItem('jwt_riot_id');
  }

  // Create JWT token directly from user ID (bypasses Supabase session issues)
  async createTokenFromUserId(userId: number): Promise<JWTTokenResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/create-jwt-from-user-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        throw new Error(`Token creation failed: ${response.status} ${response.statusText}`);
      }

      const data: JWTTokenResponse = await response.json();
      
      // Store the JWT token and user info
      this.token = data.token;
      this.userId = data.user_id;
      
      // Store in localStorage for persistence
      localStorage.setItem('jwt_token', data.token);
      localStorage.setItem('jwt_user_id', data.user_id.toString());

      return data;
    } catch (error) {
      console.error('JWT token creation failed:', error);
      throw error;
    }
  }

  // Get headers for authenticated requests
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No JWT token available');
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
}

export const jwtAuthService = new JWTAuthService();
