
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { RiotConnectModal } from './auth/RiotConnectModal'
import { Footer } from './Footer'
import { LoadingSpinner } from './auth/LoadingSpinner'
import { userService } from '../services/userService'
import { tftService } from '../services/tftService'
import { Calendar, User, Clock, Star, Award, TrendingUp, TrendingDown } from 'lucide-react'

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

interface TftLeagueEntry {
  puuid: string
  leagueId: string
  queueType: string
  ratedTier?: string
  ratedRating?: number
  tier?: string
  rank?: string
  leaguePoints?: number
  wins: number
  losses: number
  hotStreak?: boolean
  veteran?: boolean
  freshBlood?: boolean
  inactive?: boolean
  miniSeries?: {
    losses: number;
    progress: string;
    target: number;
    wins: number;
  } | null
}

function ProfileContent() {
  const { user, userId, signOut } = useAuth()
  const { profileIconUrl, refreshProfileIcon } = useProfile()
  const [showRiotModal, setShowRiotModal] = useState(false)
  const [riotAccount, setRiotAccount] = useState<RiotAccount | null>(null)
  const [leagueData, setLeagueData] = useState<TftLeagueEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [riotAccountError, setRiotAccountError] = useState<string | null>(null)
  const [leagueDataError, setLeagueDataError] = useState<string | null>(null)
  
  // New state for user profile
  const [userProfile, setUserProfile] = useState<{ description: string; available: number; days: string[]; time?: string; timezone?: string } | null>(null)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [descriptionDraft, setDescriptionDraft] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isEditingDays, setIsEditingDays] = useState(false)
  const [daysDraft, setDaysDraft] = useState<string[]>([])
  const [timeDraft, setTimeDraft] = useState('')
  const [timezoneDraft, setTimezoneDraft] = useState('')
  const [removingAccount, setRemovingAccount] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const fetchRiotData = async () => {
    if (!userId) return
    
    setLoading(true)
    setRiotAccountError(null)
    setLeagueDataError(null)
    
    try {
      // Fetch Riot account data
      try {
        const account = await userService.getUserRiotAccount(userId)
        setRiotAccount(account)
        
        if (account) {
          // Update the icon_id in the database
          try {
            await userService.updateUserRiotAccountIcon(userId)
          } catch (iconUpdateError) {
            console.error('Error updating icon ID in database:', iconUpdateError)
            // Continue with fetching other data even if icon update fails
          }
          
          // Fetch league data
          try {
            const league = await tftService.getTftLeagueData(account.riot_id, userId)
            setLeagueData(league)
          } catch (leagueError) {
            console.error('Error fetching league data:', leagueError)
            setLeagueDataError('Failed to load TFT league data. Please try again later.')
            setLeagueData([])
          }
        }
      } catch (accountError) {
        console.error('Error fetching Riot account:', accountError)
        setRiotAccountError('Failed to load Riot account data. Please try again later.')
        setRiotAccount(null)
      }
    } catch (error) {
      console.error('Error fetching Riot data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRiotData()
  }, [userId])

  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!userId) return
    
    setProfileLoading(true)
    setProfileError(null)
    
    try {
      const profile = await userService.getUserProfile(userId)
      
      setUserProfile({
        description: profile.description || '',
        available: profile.available || 0,
        days: profile.days || [],
        time: profile.time || '',
        timezone: profile.timezone || ''
      })
      setDescriptionDraft(profile.description || '')
      setDaysDraft(profile.days || [])
      setTimeDraft(profile.time || '')
      setTimezoneDraft(profile.timezone || '')
    } catch (err) {
      console.error('Error fetching user profile:', err)
    } finally {
      setProfileLoading(false)
    }
  }

  // Update user profile
  const updateUserProfile = async (updates: { description?: string; available?: number; days?: string[]; time?: string; timezone?: string }) => {
    if (!userId) return
    
    try {
      const updatedProfile = await userService.updateUserProfile(userId, updates)
      setUserProfile({
        description: updatedProfile.description || '',
        available: updatedProfile.available || 0,
        days: updatedProfile.days || [],
        time: updatedProfile.time || '',
        timezone: updatedProfile.timezone || ''
      })
      if (updates.description !== undefined) {
        setDescriptionDraft(updates.description)
      }
      if (updates.days !== undefined) {
        setDaysDraft(updates.days)
      }
      if (updates.time !== undefined) {
        setTimeDraft(updates.time)
      }
      if (updates.timezone !== undefined) {
        setTimezoneDraft(updates.timezone)
      }
    } catch (err) {
      console.error('Error updating user profile:', err)
      setProfileError('Failed to update profile. Please try again.')
    }
  }

  // Handle description save
  const handleDescriptionSave = async () => {
    await updateUserProfile({ description: descriptionDraft })
    setIsEditingDescription(false)
  }

  // Handle description cancel
  const handleDescriptionCancel = () => {
    setDescriptionDraft(userProfile?.description || '')
    setIsEditingDescription(false)
  }

  // Handle available status toggle
  const handleAvailableToggle = async (available: number) => {
    await updateUserProfile({ available })
  }



  // Handle day selection
  const handleDayChange = (day: string) => {
    setDaysDraft(prev => 
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  // Handle time selection
  const handleTimeChange = (time: string) => {
    setTimeDraft(time)
  }

  // Handle timezone selection
  const handleTimezoneChange = (timezone: string) => {
    setTimezoneDraft(timezone)
  }



  // Handle availability save (both days and time)
  const handleAvailabilitySave = async () => {
    await updateUserProfile({ days: daysDraft, time: timeDraft, timezone: timezoneDraft })
    setIsEditingDays(false)
  }

  // Handle availability cancel
  const handleAvailabilityCancel = () => {
    setDaysDraft(userProfile?.days || [])
    setTimeDraft(userProfile?.time || '')
    setTimezoneDraft(userProfile?.timezone || '')
    setIsEditingDays(false)
  }

  // Handle remove Riot account
  const handleRemoveAccount = async () => {
    if (!userId || !riotAccount) return
    
    if (!window.confirm('Are you sure you want to remove your Riot account? This action cannot be undone.')) {
      return
    }
    
    setRemovingAccount(true)
    try {
      await userService.deleteUserRiotAccount(userId)
      setRiotAccount(null)
      setLeagueData([])
      // Refresh profile icon
      await refreshProfileIcon()
    } catch (err) {
      console.error('Error removing Riot account:', err)
      alert('Failed to remove Riot account. Please try again.')
    } finally {
      setRemovingAccount(false)
    }
  }

  // Handle delete account button click - show modal
  const handleDeleteButtonClick = () => {
    setShowDeleteModal(true)
    setDeleteConfirmation('')
  }

  // Handle actual account deletion from modal
  const handleConfirmDelete = async () => {
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type "DELETE" exactly to confirm.')
      return
    }
    
    if (!userId) return
    
    setDeletingAccount(true)
    try {
      await userService.deleteUserAccount(userId)
      alert('Your account has been deleted successfully. You will be signed out.')
      // Sign out the user
      await signOut()
    } catch (err) {
      console.error('Error deleting account:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete account. Please try again.'
      alert(errorMessage)
    } finally {
      setDeletingAccount(false)
      setShowDeleteModal(false)
    }
  }



  useEffect(() => {
    fetchUserProfile()
  }, [userId])

  const getRankedTftData = () => {
    return leagueData.find(entry => entry.queueType === 'RANKED_TFT')
  }

  const getTurboTftData = () => {
    return leagueData.find(entry => entry.queueType === 'RANKED_TFT_TURBO')
  }

  return (
    <>
      <div className="min-h-screen bg-white text-gray-800 relative flex flex-col">
      {/* Notebook Lines Background - Full Viewport */}
      <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#F0F3F0' }}>
        <div className="absolute inset-0 opacity-15 dark:opacity-20">
          <svg width="100%" height="100%">
            <pattern id="notebook-lines-profile" x="0" y="0" width="100%" height="24" patternUnits="userSpaceOnUse">
              <line
                x1="0"
                y1="23"
                x2="100%"
                y2="23"
                stroke="currentColor"
                strokeWidth="1"
                className="text-blue-500 dark:text-blue-400"
              />
            </pattern>
            <rect width="100%" height="100%" fill="url(#notebook-lines-profile)" />
          </svg>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
      <div className="container mx-auto px-4 py-8 relative z-10 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-4xl font-bold text-black mb-2">Player Dashboard</h1>
                <p className="text-black text-base sm:text-lg">Track your TFT performance and manage your account</p>
              </div>
              <div className="flex flex-col items-start sm:items-end sm:text-right min-w-0">
                <p className="text-sm text-black mb-1">Signed in as</p>
                <p className="font-semibold text-black mb-4 break-all">{user?.email || 'User'}</p>
                <button
                  onClick={handleDeleteButtonClick}
                  disabled={!userId || deletingAccount}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                >
                  {deletingAccount ? (
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      Deleting...
                    </div>
                  ) : (
                    'Delete Account'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-6" />
              <p className="text-black text-lg font-medium">Loading your dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Account & Stats */}
            <div className="space-y-8">
              {/* Riot Account Card */}
              {riotAccountError ? (
                <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-red-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      Riot Account
                    </h2>
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      Error
                    </span>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-red-800 font-medium">{riotAccountError}</p>
                    </div>
                    <button
                      onClick={fetchRiotData}
                      className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : riotAccount && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-black flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {profileIconUrl ? (
                          <img 
                            src={profileIconUrl} 
                            alt="Profile Icon" 
                            className="w-full h-full object-cover"
                            onError={() => {}} // Error handling is managed by the context
                          />
                        ) : (
                          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      Riot Account
                    </h2>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Connected
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-black mb-1">Summoner Name</p>
                      <p className="font-semibold text-black text-lg">{riotAccount.summoner_name}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-black mb-1">Region</p>
                      <p className="font-semibold text-black text-lg">{riotAccount.region.charAt(0).toUpperCase() + riotAccount.region.slice(1)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-black mb-1">Connected Since</p>
                      <p className="font-semibold text-black text-lg">{new Date(riotAccount.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {/* Availability Status within Riot Account Card */}
                  <div className="mb-6">
                    {profileLoading ? (
                      <div className="flex justify-center items-center py-4">
                        <LoadingSpinner size="md" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="available"
                              value="1"
                              checked={userProfile?.available === 1}
                              onChange={() => handleAvailableToggle(1)}
                              className="w-4 h-4 text-amber-600 bg-gray-100 border-amber-300 focus:ring-amber-500"
                            />
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-[#00c9ac] rounded-full"></div>
                              <span className="text-black font-medium">Available</span>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="available"
                              value="0"
                              checked={userProfile?.available === 0}
                              onChange={() => handleAvailableToggle(0)}
                              className="w-4 h-4 text-amber-600 bg-gray-100 border-amber-300 focus:ring-amber-500"
                            />
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-[#ff8889] rounded-full"></div>
                              <span className="text-black font-medium">Not Available</span>
                            </div>
                          </label>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-black text-xs">
                            <strong>Available:</strong> Study groups can see you're open to joining<br/>
                            <strong>Not Available:</strong> You won't appear in search results
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowRiotModal(true)}
                      disabled={!userId}
                      className="flex-1 bg-[#00c9ac] hover:bg-[#00b89a] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-sm"
                    >
                      Change Account
                    </button>
                    <button
                      onClick={handleRemoveAccount}
                      disabled={!userId || removingAccount}
                      className="flex-1 bg-[#ff8889] hover:bg-[#ff7778] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-sm"
                    >
                      {removingAccount ? 'Unlinking...' : 'Unlink Account'}
                    </button>
                  </div>
                </div>
              )}

              {/* Connect Riot Account - Show when no account is connected */}
              {!riotAccount && !riotAccountError && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-black flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      Riot Account
                    </h2>
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                      Not Connected
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <div className="text-center">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-lg font-semibold text-black mb-2">Connect Your Riot Account</h3>
                      <p className="text-black text-sm">
                        Connect your Riot Games account to unlock personalized features and track your TFT performance.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRiotModal(true)}
                    disabled={!userId}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    Connect Riot Account
                  </button>
                </div>
              )}

              {/* TFT League Stats */}
              {leagueDataError ? (
                <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-6">
                  <h2 className="text-2xl font-bold text-red-900 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    TFT League Stats
                  </h2>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-red-800 font-medium">{leagueDataError}</p>
                    </div>
                    <button
                      onClick={fetchRiotData}
                      className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : leagueData.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5 text-yellow-600" fill="currentColor" />
                    </div>
                    TFT League Stats
                  </h2>
                  <div className="space-y-4">
                    {/* Ranked TFT */}
                    {getRankedTftData() && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <h3 className="font-bold text-black mb-3">
                          Ranked TFT
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-6">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Award className="w-3 h-3 text-amber-600" />
                                <p className="text-xs text-black">Rank</p>
                              </div>
                              <p className="font-bold text-black text-sm sm:text-lg">{getRankedTftData()?.tier} {getRankedTftData()?.rank}</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Star className="w-3 h-3 text-yellow-600" fill="currentColor" />
                                <p className="text-xs text-black">LP</p>
                              </div>
                              <p className="font-bold text-black text-sm sm:text-lg">{getRankedTftData()?.leaguePoints}</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <TrendingUp className="w-3 h-3 text-green-600" />
                                <p className="text-xs text-black">Wins</p>
                              </div>
                              <p className="font-bold text-black text-sm sm:text-lg">{getRankedTftData()?.wins}</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <TrendingDown className="w-3 h-3 text-red-600" />
                                <p className="text-xs text-black">Losses</p>
                              </div>
                              <p className="font-bold text-black text-sm sm:text-lg">{getRankedTftData()?.losses}</p>
                            </div>
                          </div>
                          <div className="text-center sm:border-l sm:border-gray-200 sm:pl-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                            <p className="text-xs text-black mb-1">Win Rate</p>
                            <p className="font-bold text-black text-lg sm:text-xl">
                              {getRankedTftData() ? 
                                `${((getRankedTftData()!.wins / (getRankedTftData()!.wins + getRankedTftData()!.losses)) * 100).toFixed(1)}%` : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Turbo TFT */}
                    {getTurboTftData() && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <h3 className="font-bold text-black mb-3 flex items-center gap-2">
                          <div className="w-5 h-5 bg-gray-200 rounded-lg flex items-center justify-center">
                            <svg className="w-3 h-3 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          Turbo TFT
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-6">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Award className="w-3 h-3 text-amber-600" />
                                <p className="text-xs text-black">Tier</p>
                              </div>
                              <p className="font-bold text-black text-sm sm:text-lg">{getTurboTftData()?.ratedTier}</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Star className="w-3 h-3 text-yellow-600" fill="currentColor" />
                                <p className="text-xs text-black">Rating</p>
                              </div>
                              <p className="font-bold text-black text-sm sm:text-lg">{getTurboTftData()?.ratedRating}</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <TrendingUp className="w-3 h-3 text-green-600" />
                                <p className="text-xs text-black">Wins</p>
                              </div>
                              <p className="font-bold text-black text-sm sm:text-lg">{getTurboTftData()?.wins}</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <TrendingDown className="w-3 h-3 text-red-600" />
                                <p className="text-xs text-black">Losses</p>
                              </div>
                              <p className="font-bold text-black text-sm sm:text-lg">{getTurboTftData()?.losses}</p>
                            </div>
                          </div>
                          <div className="text-center sm:border-l sm:border-gray-200 sm:pl-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                            <p className="text-xs text-black mb-1">Win Rate</p>
                            <p className="font-bold text-black text-lg sm:text-xl">
                              {getTurboTftData() ? 
                                `${((getTurboTftData()!.wins / (getTurboTftData()!.wins + getTurboTftData()!.losses)) * 100).toFixed(1)}%` : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Actions & Features */}
            <div className="space-y-8">
              {/* User Profile Description */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  Profile Description
                </h2>
                {profileError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <p className="text-red-800 text-sm">{profileError}</p>
                  </div>
                )}
                {profileLoading ? (
                  <div className="flex justify-center items-center py-4">
                    <LoadingSpinner size="md" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {isEditingDescription ? (
                      <div className="space-y-3">
                        <textarea
                          value={descriptionDraft}
                          onChange={(e) => setDescriptionDraft(e.target.value)}
                          placeholder="Tell others about yourself..."
                          className="w-full p-3 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-xs"
                          rows={4}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleDescriptionSave}
                            className="flex-1 bg-[#00c9ac] hover:bg-[#00b89a] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleDescriptionCancel}
                            className="flex-1 bg-[#ff8889] hover:bg-[#ff7778] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                                              <div>
                          <div className="bg-gray-50 rounded-xl p-4 min-h-[100px]">
                            {userProfile?.description ? (
                              <p className="text-black whitespace-pre-wrap text-left text-xs">{userProfile.description}</p>
                            ) : (
                              <p className="text-gray-500 italic text-left text-xs">No description added yet.</p>
                            )}
                          </div>
                        <div className="mt-3 flex justify-between items-center">
                          <button
                            onClick={() => setIsEditingDescription(true)}
                            className="md:hidden w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                          >
                            {userProfile?.description ? 'Edit Description' : 'Add Description'}
                          </button>
                          <button
                            onClick={() => setIsEditingDescription(true)}
                            className="hidden md:flex items-center gap-2 text-gray-600 hover:text-gray-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="text-sm font-medium">Edit</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Availability */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                {profileError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <p className="text-red-800 text-sm">{profileError}</p>
                  </div>
                )}
                {profileLoading ? (
                  <div className="flex justify-center items-center py-4">
                    <LoadingSpinner size="md" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Display Mode */}
                    {!isEditingDays && (
                      <>
                        {/* Days Section */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                            <Calendar className="w-5 h-5" style={{ color: '#ff8889' }} />
                            Available Days
                          </h3>
                          <div className="bg-gray-50 rounded-xl p-4 min-h-[60px]">
                            {userProfile?.days && userProfile.days.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {userProfile.days.map(day => (
                                  <span key={day} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-medium">
                                    {day}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 italic">No days selected yet.</p>
                            )}
                          </div>
                        </div>

                        {/* Time Section */}
                        <div className="space-y-4 border-t border-gray-200 pt-6">
                          <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                            <Clock className="w-5 h-5" style={{ color: '#00c9ac' }} />
                            Preferred Time
                          </h3>
                          <div className="bg-gray-50 rounded-xl p-4 min-h-[60px]">
                            {timeDraft ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-black font-medium">Time:</span>
                                  <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-medium">
                                    {timeDraft.charAt(0).toUpperCase() + timeDraft.slice(1)}
                                  </span>
                                </div>
                                {timezoneDraft && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-black font-medium">Timezone:</span>
                                    <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-medium">
                                      {timezoneDraft}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500 italic">No time selected yet.</p>
                            )}
                          </div>
                        </div>

                        {/* Edit Button */}
                        <div className="mt-6 flex justify-between items-center">
                          <button
                            onClick={() => setIsEditingDays(true)}
                            className="md:hidden w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                          >
                            Edit Availability
                          </button>
                          <button
                            onClick={() => setIsEditingDays(true)}
                            className="hidden md:flex items-center gap-2 text-gray-600 hover:text-gray-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="text-sm font-medium">Edit</span>
                          </button>
                        </div>
                      </>
                    )}

                    {/* Edit Mode */}
                    {isEditingDays && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                            <Calendar className="w-5 h-5" style={{ color: '#ff8889' }} />
                            Edit Available Days
                          </h3>
                          <p className="text-black text-sm">
                            Select the days you're typically available for study groups.
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Flexible"].map(day => (
                              <label key={day} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={daysDraft.includes(day)}
                                  onChange={() => handleDayChange(day)}
                                  className="mr-2 w-4 h-4 text-amber-600 bg-gray-100 border-amber-300 focus:ring-amber-500"
                                />
                                <span className="text-black">{day}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                            <Clock className="w-5 h-5" style={{ color: '#00c9ac' }} />
                            Edit Preferred Time
                          </h3>
                          <p className="text-black text-sm">
                            Select your preferred time of day for study group activities.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-black mb-2">
                                Time of Day
                              </label>
                              <select
                                value={timeDraft}
                                onChange={(e) => handleTimeChange(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              >
                                <option value="">Select time...</option>
                                <option value="mornings">Mornings</option>
                                <option value="afternoons">Afternoons</option>
                                <option value="evenings">Evenings</option>
                                <option value="flexible">Flexible</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-black mb-2">
                                Timezone
                              </label>
                              <select
                                value={timezoneDraft}
                                onChange={(e) => handleTimezoneChange(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              >
                                <option value="">Select timezone...</option>
                                <option value="UTC-8">Pacific Time (UTC-8)</option>
                                <option value="UTC-7">Mountain Time (UTC-7)</option>
                                <option value="UTC-6">Central Time (UTC-6)</option>
                                <option value="UTC-5">Eastern Time (UTC-5)</option>
                                <option value="UTC+0">UTC</option>
                                <option value="UTC+1">Central European Time (UTC+1)</option>
                                <option value="UTC+2">Eastern European Time (UTC+2)</option>
                                <option value="UTC+8">China Standard Time (UTC+8)</option>
                                <option value="UTC+9">Japan Standard Time (UTC+9)</option>
                                <option value="UTC+10">Australian Eastern Time (UTC+10)</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleAvailabilitySave}
                            className="flex-1 bg-[#00c9ac] hover:bg-[#00b89a] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                          >
                            Save Availability
                          </button>
                          <button
                            onClick={handleAvailabilityCancel}
                            className="flex-1 bg-[#ff8889] hover:bg-[#ff7778] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
      
      {/* Riot Connect Modal */}
      <RiotConnectModal
        isOpen={showRiotModal}
        onClose={() => setShowRiotModal(false)}
        userId={userId || 0}
        onSuccess={async () => {
          await fetchRiotData()
          await refreshProfileIcon()
        }}
      />
      
      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-900">Delete Account</h3>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800 text-sm mb-3">
                <strong>Warning:</strong> This action will permanently delete your account and all associated data.
              </p>
              <ul className="text-red-700 text-sm space-y-1">
                <li>• Delete all your profile data</li>
                <li>• Remove you from all study groups</li>
                <li>• Delete your Riot account connection</li>
                <li>• Remove all your invitations</li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-800 text-sm">
                <strong>Note:</strong> If you are a captain of any study groups, you must transfer 
                captaincy to another member or leave those groups before deleting your account.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "DELETE" to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingAccount}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteConfirmation !== 'DELETE' || deletingAccount}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed font-medium"
              >
                {deletingAccount ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    Deleting...
                  </div>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
        </div>
      </div>
      
      <Footer />
    </>
  )
}

export function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  )
} 