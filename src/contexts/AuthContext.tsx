import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabaseAuthService } from '../services/supabaseAuthService'


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
  loading: boolean
  signInWithDiscord: () => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  checkProfileCompletion: () => Promise<void>
  isProfileIncomplete: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const checkProfileCompletion = useCallback(async () => {
    // This function refreshes user data to get updated profile fields
    if (!userId) return
    
    try {
      // Always refresh user data to get the latest profile information
      const session = await supabaseAuthService.getSession()
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
        const session = await supabaseAuthService.getSession()
        if (session?.access_token) {
          const userData = await supabaseAuthService.getUserFromBackend(session.access_token)
          setUser(userData)
          setUserId(userData.id)
          
          // Ensure we have the latest profile data
          await checkProfileCompletion()
        }
      } catch (error) {
        console.error('Session verification failed:', error)
        setUser(null)
        setUserId(null)
      }
      setLoading(false)
    }

    checkAuth()
  }, [checkProfileCompletion])

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabaseAuthService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session)
        
        if (event === 'SIGNED_IN' && session?.access_token) {
          try {
            const userData = await supabaseAuthService.getUserFromBackend(session.access_token)
            setUser(userData)
            setUserId(userData.id)
            await checkProfileCompletion()
          } catch (error) {
            console.error('Error getting user from backend:', error)
            setUser(null)
            setUserId(null)
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('Auth state: SIGNED_OUT detected, clearing user state')
          setUser(null)
          setUserId(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [checkProfileCompletion])

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
      console.log('🔐 AuthContext: Starting sign out...')
      await supabaseAuthService.signOut()
      console.log('🔐 AuthContext: Supabase sign out completed, clearing user state...')
    } catch (error) {
      console.error('🔐 AuthContext: Sign out error:', error)
    } finally {
      // Always clear user state, regardless of Supabase sign out success
      console.log('🔐 AuthContext: Clearing user state...')
      setUser(null)
      setUserId(null)
      console.log('🔐 AuthContext: User state cleared')
    }
  }

  const isProfileIncomplete = () => {
    // Since we're simplifying the profile system, we'll consider it complete if user exists
    return !user
  }

  const value = {
    user,
    userId,
    loading,
    signInWithDiscord,
    signInWithGoogle,
    signOut,
    checkProfileCompletion,
    isProfileIncomplete,
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