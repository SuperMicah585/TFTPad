import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabaseAuthService } from '../services/supabaseAuthService'
import { jwtAuthService } from '../services/jwtAuthService'


interface SupabaseUser {
  id: string
  email: string
  created_at: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
    provider?: string
  }
}

interface AuthContextType {
  user: SupabaseUser | null
  userId: string | null
  jwtUserId: number | null
  loading: boolean
  signInWithDiscord: () => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  checkProfileCompletion: () => Promise<void>
  isProfileIncomplete: () => boolean
  exchangeTokenForJWT: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [jwtUserId, setJwtUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const checkProfileCompletion = useCallback(async () => {
    // This function refreshes user data to get updated profile fields
    if (!userId) return
    
    try {
      // Always refresh user data to get the latest profile information
      const session = await supabaseAuthService.getValidSession()
      if (session?.access_token) {
        const userData = await supabaseAuthService.getUserFromBackend(session.access_token)
        setUser(userData)
        setUserId(userData.id)
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
    }
  }, [userId])

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Warm up the connection early
        try {
          await supabaseAuthService.getCurrentUser();
        } catch (warmupError) {
          // Continue anyway if warmup fails
        }
        
        const session = await supabaseAuthService.getValidSession();
        if (session?.access_token) {
          const userData = await supabaseAuthService.getUserFromBackend(session.access_token);
          setUser(userData);
          setUserId(userData.id);
          
          // Exchange Supabase token for JWT token
          try {
            await exchangeTokenForJWT();
          } catch (error) {
            console.error('Failed to exchange token for JWT on mount:', error);
          }
          
          // Ensure we have the latest profile data
          await checkProfileCompletion();
        }
      } catch (error) {
        console.error('Session verification failed:', error);
        // Don't clear user state immediately on session errors - might be temporary
        // Only clear if it's a clear authentication error
        if (error instanceof Error && (
          error.message.includes('401') || 
          error.message.includes('403') || 
          error.message.includes('No authentication token')
        )) {
          setUser(null);
          setUserId(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [checkProfileCompletion]);

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabaseAuthService.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.access_token) {
          try {
            const userData = await supabaseAuthService.getUserFromBackend(session.access_token);
            setUser(userData);
            setUserId(userData.id);
            
            // Exchange Supabase token for JWT token
            try {
              await exchangeTokenForJWT();
            } catch (error) {
              console.error('Failed to exchange token for JWT on sign in:', error);
            }
            
            await checkProfileCompletion();
          } catch (error) {
            console.error('Error getting user from backend:', error);
            setUser(null);
            setUserId(null);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserId(null);
          setJwtUserId(null);
          jwtAuthService.clearAuth();
        }
        
        setLoading(false);
      }
    )

    return () => subscription.unsubscribe()
  }, [checkProfileCompletion])

  // Set up periodic session refresh to prevent token expiration
  useEffect(() => {
    if (!userId) return; // Only refresh if user is logged in
    
    const refreshInterval = setInterval(async () => {
      try {
        console.log('🔄 Periodic session refresh...');
        await supabaseAuthService.refreshSession();
      } catch (error) {
        console.error('Periodic session refresh failed:', error);
        // If refresh fails, the user might need to log in again
        // Don't clear the user state immediately, let the next API call handle it
      }
    }, 45 * 60 * 1000); // Refresh every 45 minutes (tokens typically expire after 1 hour)
    
    return () => clearInterval(refreshInterval);
  }, [userId]);

  const signInWithDiscord = async () => {
    try {
      const result = await supabaseAuthService.signInWithDiscord()
      if (!result.success) {
        return { error: result.message }
      }
      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Discord login failed' }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const result = await supabaseAuthService.signInWithGoogle()
      if (!result.success) {
        return { error: result.message }
      }
      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Google login failed' }
    }
  }

  const signOut = async () => {
    try {
      await supabaseAuthService.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      // Always clear user state, regardless of Supabase sign out success
      setUser(null)
      setUserId(null)
      setJwtUserId(null)
      jwtAuthService.clearAuth()
    }
  }

  const isProfileIncomplete = () => {
    // Since we're simplifying the profile system, we'll consider it complete if user exists
    return !user
  }

  const exchangeTokenForJWT = async () => {
    try {
      if (!userId) {
        throw new Error('No user ID available');
      }
      
      // Create custom JWT token from user ID
      await jwtAuthService.createTokenFromUserId(parseInt(userId, 10));
      setJwtUserId(parseInt(userId, 10));
      
    } catch (error) {
      console.error('Failed to exchange token for JWT:', error)
      throw error
    }
  }

  const value = {
    user,
    userId,
    jwtUserId,
    loading,
    signInWithDiscord,
    signInWithGoogle,
    signOut,
    checkProfileCompletion,
    isProfileIncomplete,
    exchangeTokenForJWT,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 