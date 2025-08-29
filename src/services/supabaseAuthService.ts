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
  // Sign in with Discord
  async signInWithDiscord(): Promise<SupabaseAuthResponse> {
    try {
      console.log('🔐 Starting Discord OAuth flow...')
      console.log('🔐 Current origin:', window.location.origin)
      console.log('🔐 Redirect URL:', `${window.location.origin}/auth/callback`)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      console.log('🔐 Discord OAuth response:', { data, error })

      if (error) {
        console.error('🔐 Discord OAuth error:', error)
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
      console.error('🔐 Discord OAuth exception:', error)
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
      console.log('🔐 Starting Google OAuth flow...')
      console.log('🔐 Current origin:', window.location.origin)
      console.log('🔐 Redirect URL:', `${window.location.origin}/auth/callback`)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      console.log('🔐 Google OAuth response:', { data, error })

      if (error) {
        console.error('🔐 Google OAuth error:', error)
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
      console.error('🔐 Google OAuth exception:', error)
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
      console.log('🔐 Frontend: Getting user from backend...')
      const response = await fetch(`${API_BASE_URL}/api/auth/supabase/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      })

      console.log('🔐 Frontend: Backend response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('🔐 Frontend: Backend error:', errorData)
        throw new Error(errorData.error || 'Failed to get user')
      }

      const result = await response.json()
      console.log('🔐 Frontend: Backend user data:', result)
      return result.user
    } catch (error) {
      console.error('🔐 Frontend: Error getting user from backend:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to get user from backend')
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    try {
      console.log('🔐 SupabaseAuthService: Starting sign out...')
      
      // Try Supabase sign out with a shorter timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign out timeout')), 3000)
      })
      
      const signOutPromise = supabase.auth.signOut()
      
      try {
        const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any
        
        if (error) {
          console.error('🔐 SupabaseAuthService: Supabase sign out error:', error)
        } else {
          console.log('🔐 SupabaseAuthService: Supabase sign out successful')
        }
      } catch (timeoutError) {
        console.log('🔐 SupabaseAuthService: Supabase sign out timed out, continuing with local cleanup')
      }
      
    } catch (error) {
      console.error('🔐 SupabaseAuthService: Unexpected error during sign out:', error)
    } finally {
      // Always perform local cleanup regardless of Supabase success/failure
      console.log('🔐 SupabaseAuthService: Performing local cleanup...')
      
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
        
        console.log('🔐 SupabaseAuthService: Local cleanup completed')
      } catch (cleanupError) {
        console.error('🔐 SupabaseAuthService: Error during local cleanup:', cleanupError)
      }
    }
  },

  // Get current session
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        throw new Error(error.message)
      }
      return session
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  },

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        throw new Error(error.message)
      }
      return user
    } catch (error) {
      console.error('Get current user error:', error)
      return null
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
  }
}
