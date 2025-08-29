import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { userService } from '../services/userService'

interface ProfileContextType {
  loading: boolean
  userProfile: {
    description: string
    available: number
    days: string[]
    time?: string
    timezone?: string
    created_at?: string
  } | null
  refreshProfile: () => Promise<void>
  updateProfile: (updates: { description?: string; available?: number; days?: string[]; time?: string; timezone?: string }) => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<ProfileContextType['userProfile']>(null)

  const fetchProfile = useCallback(async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const profile = await userService.getUserProfile(parseInt(userId, 10))
      setUserProfile({
        description: profile.description || '',
        available: profile.available || 0,
        days: profile.days || [],
        time: profile.time || '',
        timezone: profile.timezone || '',
        created_at: profile.created_at
      })
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Provide default profile when API fails due to missing columns
      setUserProfile({
        description: '',
        available: 0,
        days: [],
        time: '',
        timezone: '',
        created_at: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }, [userId])

  const updateProfile = async (updates: { description?: string; available?: number; days?: string[]; time?: string; timezone?: string }) => {
    if (!userId) return
    
    try {
      const updatedProfile = await userService.updateUserProfile(parseInt(userId, 10), updates)
      setUserProfile({
        description: updatedProfile.description || '',
        available: updatedProfile.available || 0,
        days: updatedProfile.days || [],
        time: updatedProfile.time || '',
        timezone: updatedProfile.timezone || '',
        created_at: updatedProfile.created_at
      })
    } catch (error) {
      console.error('Error updating user profile:', error)
      // For now, just log the error but don't throw it
      // This prevents the UI from breaking when the backend doesn't support profile updates
      console.warn('Profile update failed - backend may not support this feature yet')
    }
  }

  const refreshProfile = async () => {
    await fetchProfile()
  }

  // Fetch profile when userId changes
  useEffect(() => {
    fetchProfile()
  }, [userId, fetchProfile])

  return (
    <ProfileContext.Provider value={{ loading, userProfile, refreshProfile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
} 