import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

export interface SupabaseUser {
  id: string
  email: string
  created_at: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
    provider?: string
  }
}

export interface SupabaseAuthResponse {
  success: boolean
  message: string
  user: SupabaseUser | null
  session: Session | null
}

export interface SupabaseAuthError {
  error: string
  message?: string
}

const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001'

export const supabaseAuthService = {
  // Track connection warming state
  _connectionWarmed: false,
  
  // Cache for the current session to avoid repeated Supabase calls
  _cachedSession: null as any,
  _sessionCacheTime: 0,
  _sessionCacheDuration: 5 * 60 * 1000, // 5 minutes

  // Sign in with Discord
  async signInWithDiscord(): Promise<SupabaseAuthResponse> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      // OAuth response doesn't include user/session immediately - it redirects
      return {
        success: true,
        message: 'Discord authentication initiated - redirecting...',
        user: null,
        session: null
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Discord authentication failed',
        user: null,
        session: null
      }
    }
  },

  // Sign in with Google
  async signInWithGoogle(): Promise<SupabaseAuthResponse> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      // OAuth response doesn't include user/session immediately - it redirects
      return {
        success: true,
        message: 'Google authentication initiated - redirecting...',
        user: null,
        session: null
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Google authentication failed',
        user: null,
        session: null
      }
    }
  },

  // Verify Supabase token with backend
  async verifyTokenWithBackend(accessToken: string): Promise<SupabaseUser> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/supabase/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Token verification failed')
      }

      const result = await response.json()
      return result.user
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Backend verification failed')
    }
  },

  // Get user from backend
  async getUserFromBackend(accessToken: string): Promise<SupabaseUser> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/supabase/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('🔐 Frontend: Backend error:', errorData)
        throw new Error(errorData.error || 'Failed to get user')
      }

      const result = await response.json()
      return result.user
    } catch (error) {
      console.error('🔐 Frontend: Error getting user from backend:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to get user from backend')
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    try {
      // Clear the session cache immediately
      this.clearSessionCache();
      
      // Try Supabase sign out with a shorter timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign out timeout')), 3000)
      })
      
      const signOutPromise = supabase.auth.signOut()
      
      try {
        const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any
        
        if (error) {
          console.error('Supabase sign out error:', error)
        }
      } catch (timeoutError) {
        // Continue with local cleanup if Supabase times out
      }
      
    } catch (error) {
      console.error('Unexpected error during sign out:', error)
    } finally {
      // Always perform local cleanup regardless of Supabase success/failure
      
      // Clear all possible auth-related storage
      try {
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('sb-' + supabaseUrl?.split('//')[1]?.split('.')[0] + '-auth-token')
        sessionStorage.clear()
        
        // Clear any other potential auth keys
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
            localStorage.removeItem(key)
          }
        })
      } catch (cleanupError) {
        console.error('Error during local cleanup:', cleanupError)
      }
    }
  },

  // Get cached session or fetch from Supabase
  async getSession(): Promise<Session | null> {
    // Check if we have a valid cached session
    const now = Date.now();
    if (this._cachedSession && (now - this._sessionCacheTime) < this._sessionCacheDuration) {
      return this._cachedSession;
    }

    try {
      // Warm up the connection first if this is the first call
      if (!this._connectionWarmed) {
        try {
          // Make a quick call to warm up the connection
          await supabase.auth.getUser();
          this._connectionWarmed = true;
        } catch (warmupError) {
          // Continue anyway if warmup fails
        }
      }
      
      // Try to get session with retry logic
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          // Add timeout to prevent hanging
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Session retrieval timeout after ${attempt === 1 ? 5 : 10} seconds`)), attempt === 1 ? 5000 : 10000);
          });
          
          const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
          
          if (error) {
            throw new Error(error.message);
          }
          
          // Cache the session
          this._cachedSession = session;
          this._sessionCacheTime = now;
          
          return session;
          
        } catch (error) {
          lastError = error as Error;
          
          // If this is the first attempt and it's a timeout, try warming up again
          if (attempt === 1 && error instanceof Error && error.message.includes('timeout')) {
            this._connectionWarmed = false; // Reset to force warmup
            await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
            continue;
          }
          
          // If this is the last attempt, throw the error
          if (attempt === 2) {
            throw error;
          }
        }
      }
      
      throw lastError || new Error('Session retrieval failed');
    } catch (error) {
      // Don't return null silently - throw the error so the caller knows what happened
      throw error;
    }
  },

  // Clear the session cache (call this on logout or when you need fresh data)
  clearSessionCache(): void {
    this._cachedSession = null;
    this._sessionCacheTime = 0;
  },

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return user;
    } catch (error) {
      console.error('Get current user error:', error)
      return null;
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const session = supabase.auth.getSession()
    return !!session
  },

  // Get access token directly from storage (bypasses Supabase calls)
  getAccessTokenFromStorage(): string | null {
    try {
      // Try to get token from localStorage
      const tokenKey = 'sb-' + supabaseUrl?.split('//')[1]?.split('.')[0] + '-auth-token';
      const storedToken = localStorage.getItem(tokenKey);
      
      if (storedToken) {
        const tokenData = JSON.parse(storedToken);
        if (tokenData?.access_token) {
          return tokenData.access_token;
        }
      }
      
      // Fallback to other possible storage locations
      const supabaseToken = localStorage.getItem('supabase.auth.token');
      if (supabaseToken) {
        const tokenData = JSON.parse(supabaseToken);
        if (tokenData?.access_token) {
          return tokenData.access_token;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error reading token from storage:', error);
      return null;
    }
  },

  // Get session with fallback to storage
  async getSessionWithFallback(): Promise<Session | null> {
    try {
      // First try the cached session
      const cachedSession = await this.getSession();
      if (cachedSession) {
        return cachedSession;
      }
      
      // If that fails, try to construct a session from storage
      const accessToken = this.getAccessTokenFromStorage();
      if (accessToken) {
        // Create a minimal session object
        return {
          access_token: accessToken,
          refresh_token: '',
          expires_in: 3600,
          token_type: 'bearer',
          user: null
        } as any;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  },

  // Refresh the session token
  async refreshSession(): Promise<Session | null> {
    try {
      console.log('🔄 Attempting to refresh session...');
      
      // Clear the cache to force a fresh session
      this.clearSessionCache();
      
      // Try to refresh the session using Supabase
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh failed:', error);
        throw error;
      }
      
      if (session) {
        // Update the cache with the new session
        this._cachedSession = session;
        this._sessionCacheTime = Date.now();
        console.log('✅ Session refreshed successfully');
        return session;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      return null;
    }
  },

  // Get a valid session with automatic refresh
  async getValidSession(): Promise<Session | null> {
    try {
      // First try to get the current session
      const session = await this.getSessionWithFallback();
      
      if (!session?.access_token) {
        return null;
      }
      
      // Check if the token is expired (tokens typically expire after 1 hour)
      // We'll assume it's expired if it's older than 50 minutes to be safe
      const tokenAge = Date.now() - this._sessionCacheTime;
      const maxTokenAge = 50 * 60 * 1000; // 50 minutes
      
      if (tokenAge > maxTokenAge) {
        console.log('🔄 Token appears to be expired, attempting refresh...');
        return await this.refreshSession();
      }
      
      return session;
    } catch (error) {
      console.error('Error getting valid session:', error);
      
      // If getting session fails, try to refresh
      try {
        return await this.refreshSession();
      } catch (refreshError) {
        console.error('Session refresh also failed:', refreshError);
        return null;
      }
    }
  }
}
