import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { riotAuthService } from '../services/riotAuthService'

interface RiotUser {
  id: number
  riot_id: string
  summoner_name: string
  region: string
  created_at: string
  description?: string
  available?: number
  days?: string[]
  time?: string
  timezone?: string
}

interface AuthContextType {
  user: RiotUser | null
  userId: number | null
  loading: boolean
  signInWithRiot: (gameName: string, tagLine: string, region: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  checkProfileCompletion: () => Promise<void>
  isProfileIncomplete: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<RiotUser | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const checkProfileCompletion = useCallback(async () => {
    // This function refreshes user data to get updated profile fields
    if (!userId) return
    
    try {
      // Always refresh user data to get the latest profile information
      const token = riotAuthService.getToken()
      if (token) {
        const result = await riotAuthService.verifyToken(token)
        setUser(result.user)
        // Also update userId in case it's not set
        if (result.user.id) {
          setUserId(result.user.id)
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
    }
  }, [userId])

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = riotAuthService.getToken()
      if (token) {
        try {
          const result = await riotAuthService.verifyToken(token)
          // Set both userId and full user data
          setUserId(result.user.id)
          setUser(result.user)
          
          // Ensure we have the latest profile data
          await checkProfileCompletion()
        } catch (error) {
          console.error('Token verification failed:', error)
          riotAuthService.removeToken()
          setUser(null)
          setUserId(null)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [checkProfileCompletion])

  const signInWithRiot = async (gameName: string, tagLine: string, region: string) => {
    try {
      const result = await riotAuthService.loginWithRiot(gameName, tagLine, region)
      riotAuthService.storeToken(result.token)
      setUser(result.user)
      setUserId(result.user.id)
      
      // Refresh user data to get complete profile information
      await checkProfileCompletion()
      
      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Login failed' }
    }
  }

  const signOut = async () => {
    riotAuthService.removeToken()
    setUser(null)
    setUserId(null)
  }

  const isProfileIncomplete = () => {
    if (!user) return false
    return !user.description || user.description.trim() === ''
  }

  const value = {
    user,
    userId,
    loading,
    signInWithRiot,
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