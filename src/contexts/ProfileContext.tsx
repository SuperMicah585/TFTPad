import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { userService } from '../services/userService'
import { riotService } from '../services/riotService'

interface ProfileContextType {
  profileIconUrl: string | null
  loading: boolean
  refreshProfileIcon: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const [profileIconUrl, setProfileIconUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchProfileIcon = useCallback(async () => {
    if (!userId) return
    
    setLoading(true)
    setProfileIconUrl(null)
    try {
      const riotAccount = await userService.getUserRiotAccount(userId)
      if (riotAccount) {
        // Update the icon_id in the database
        try {
          await userService.updateUserRiotAccountIcon(userId)
        } catch (iconUpdateError) {
          console.error('Error updating icon ID in database:', iconUpdateError)
          // Continue with fetching the icon even if database update fails
        }
        
        const version = await riotService.getCurrentVersion()
        const summonerData = await riotService.getSummonerData(riotAccount.riot_id, riotAccount.region)
        const iconUrl = riotService.getProfileIconUrl(summonerData.profileIconId, version)
        setProfileIconUrl(iconUrl)
      }
    } catch (error) {
      console.error('Error fetching profile icon:', error)
      setProfileIconUrl(null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const refreshProfileIcon = async () => {
    await fetchProfileIcon()
  }

  // Fetch profile icon when userId changes
  useEffect(() => {
    fetchProfileIcon()
  }, [userId, fetchProfileIcon])

  // Listen for account updates
  useEffect(() => {
    const handleAccountUpdate = () => {
      fetchProfileIcon()
    }

    window.addEventListener('riotAccountUpdated', handleAccountUpdate)
    return () => window.removeEventListener('riotAccountUpdated', handleAccountUpdate)
  }, [userId, fetchProfileIcon])

  return (
    <ProfileContext.Provider value={{ profileIconUrl, loading, refreshProfileIcon }}>
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