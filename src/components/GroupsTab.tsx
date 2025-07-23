import { useRef, useCallback, useState, useEffect } from 'react'
import { Users, Zap, Crown, ArrowRight, Calendar, Globe, SquareX } from 'lucide-react'

import { userService } from '../services/userService'
import type { StudyGroup } from '../services/studyGroupService'
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";
import { FaSearch } from "react-icons/fa";

interface GroupMember {
  summoner_name: string;
  elo: number;
  owner: number;
  rank?: string;
  icon_id?: number;
  user_id?: number;
}

interface MemberCounts {
  [groupId: number]: number;
}

const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';

// Study Groups Tab Component
export function GroupsTab({ 
  studyGroups, 
  searchQuery, 
  setSearchQuery, 
  setActiveSearchQuery,
  updateSearchInURL,
  meetingDayFilter, 
  setMeetingDayFilter, 
  minEloFilter, 
  setMinEloFilter, 
  maxEloFilter,
  setMaxEloFilter,
  timezoneFilter,
  setTimezoneFilter,
  meetingDays,
  selectedGroupMembers,
  membersLoading,
  loading,
  error,
  memberCounts,
  fetchGroupMembers,
  loadMoreGroups,
  hasMore,
  loadingMore,
  onRetry
}: {
  studyGroups: StudyGroup[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  setActiveSearchQuery: (query: string) => void
  updateSearchInURL: (query: string) => void
  meetingDayFilter: string
  setMeetingDayFilter: (filter: string) => void
  minEloFilter: number
  setMinEloFilter: (filter: number) => void
  maxEloFilter: number
  setMaxEloFilter: (filter: number) => void
  timezoneFilter: string
  setTimezoneFilter: (filter: string) => void
  meetingDays: string[]
  selectedGroupMembers: GroupMember[]
  showMembersPopup: boolean
  setShowMembersPopup: (show: boolean) => void
  membersLoading: boolean
  loading?: boolean
  error?: string | null
  memberCounts?: MemberCounts
  fetchGroupMembers?: (groupId: number) => Promise<void>
  loadMoreGroups?: () => Promise<void>
  hasMore?: boolean
  loadingMore?: boolean
  onRetry?: () => void
  handleOpenInfoModal: (groupId: number) => void
}) {
  // New state for combined modal
  const [showCombinedModal, setShowCombinedModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [groupInfo, setGroupInfo] = useState({ description: '', instructions: '' });
  const [infoLoading, setInfoLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'info'>('members');
  const [showFilters, setShowFilters] = useState(false);
  
  // Player modal state
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [playerLeagueData, setPlayerLeagueData] = useState<any[]>([]);
  const [leagueDataLoading, setLeagueDataLoading] = useState(false);
  const [leagueDataError, setLeagueDataError] = useState<string | null>(null);
  const [activePlayerTab, setActivePlayerTab] = useState<'about' | 'stats'>('stats');
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  // Intersection Observer for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastGroupRef = useCallback((node: HTMLDivElement) => {
    if (loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && loadMoreGroups) {
        loadMoreGroups();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasMore, loadMoreGroups]);

  // Handler for tile click - opens combined modal
  const handleTileClick = async (groupId: number) => {
    const group = studyGroups.find(g => g.id === groupId);
    if (!group) return;
    
    setSelectedGroup(group);
    setShowCombinedModal(true);
    setInfoLoading(true);
    setGroupInfo({ description: '', instructions: '' });
    
    try {
      // Fetch both members and group info
      if (fetchGroupMembers) {
        await fetchGroupMembers(groupId);
      }
      
      // Fetch group info
      const groupDetails = await import('../services/studyGroupService').then(module => 
        module.studyGroupService.getStudyGroup(groupId)
      );
      setGroupInfo({
        description: groupDetails.description || '',
        instructions: groupDetails.application_instructions || ''
      });
    } catch (err) {
      console.error('Error fetching group data:', err);
      setGroupInfo({
        description: 'Error loading group description.',
        instructions: 'Error loading application instructions.'
      });
    } finally {
      setInfoLoading(false);
    }
  };

  // Player modal functions
  const fetchPlayerLeagueData = async (userId: number) => {
    try {
      setLeagueDataLoading(true);
      setLeagueDataError(null);
      
      // Get user's riot account to get PUUID
      const riotAccount = await userService.getUserRiotAccount(userId);
      if (!riotAccount || !riotAccount.riot_id) {
        setLeagueDataError('No Riot account found for this user');
        return;
      }

      // Fetch league data using the riot_id (which contains the PUUID)
              const response = await fetch(`${API_BASE_URL}/api/tft-league/${riotAccount.riot_id}?user_id=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch league data');
      }
      
      const data = await response.json();
      setPlayerLeagueData(data);
    } catch (error) {
      console.error('Error fetching player league data:', error);
      setLeagueDataError('Failed to load league data');
    } finally {
      setLeagueDataLoading(false);
    }
  };

  const fetchPlayerProfile = async (userId: number) => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      
      const profile = await userService.getUserProfile(userId);
      setPlayerProfile(profile);
    } catch (error) {
      console.error('Error fetching player profile:', error);
      setProfileError('Failed to load profile data');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePlayerClick = async (member: any) => {
    if (!member.user_id) {
      console.error('No user_id found for member:', member);
      return;
    }
    
    setSelectedPlayer(member);
    setShowPlayerModal(true);
    setActivePlayerTab('stats');
    
    // Fetch league data and profile data for the player
    await Promise.all([
      fetchPlayerLeagueData(member.user_id),
      fetchPlayerProfile(member.user_id)
    ]);
  };

  const getRankedTftData = () => {
    return playerLeagueData.find(data => data.queueType === 'RANKED_TFT');
  };

  const getTurboTftData = () => {
    return playerLeagueData.find(data => data.queueType === 'RANKED_TFT_TURBO');
  };

  // Clear all filters
  const clearFilters = () => {
    setMeetingDayFilter("");
    setMinEloFilter(0);
    setMaxEloFilter(5000);
    setTimezoneFilter("");
  };

  return (
    <div className="relative w-full min-h-screen">
      {/* Hero Background Image - Only show on Groups tab */}
      <div className="absolute inset-0 overflow-hidden rounded-lg z-0 h-96">
        <div
          className="w-full h-full bg-cover bg-no-repeat opacity-60"
          style={{
            backgroundImage: 'url(/KO.png)',
            backgroundPosition: 'center 35%'
          }}
        />
        {/* Fade overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.15) 60%, rgba(255,255,255,0.5) 90%, rgba(255,255,255,1) 100%)'
          }}
        />
      </div>
      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 mt-40">
            </div>
          </div>

        
          {/* Filter & Sort Controls */}
          <div className="mb-4 mt-2 relative">
          </div>
        </div>
          
        {/* Search Bar */}
        <div className="mb-4">
          <div className="flex flex-row gap-2 items-center w-full">
            <input
              type="text"
              placeholder="Search by group name or player name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setActiveSearchQuery(searchQuery);
                  updateSearchInURL(searchQuery);
                }
              }}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#007460] focus:ring-2 focus:ring-[#007460]"
              onFocus={(e) => {
                e.target.style.borderColor = 'rgb(253, 186, 116)';
                e.target.style.boxShadow = '0 0 0 2px rgba(253, 186, 116, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '';
                e.target.style.boxShadow = '';
              }}
            />
            <button
              onClick={() => {
                setActiveSearchQuery(searchQuery);
                updateSearchInURL(searchQuery);
              }}
              className="p-2 rounded-lg bg-[#964B00] hover:bg-[#7c3a00] text-white flex items-center justify-center transition-colors font-semibold"
              style={{ minWidth: '40px', minHeight: '40px' }}
              aria-label="Search"
            >
              <FaSearch size={18} />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg shadow border border-gray-200 bg-white flex items-center justify-center transition-all duration-200 relative ${showFilters ? 'ring-2 ring-[#007460] border-[#007460]' : ''}`}
              style={{ color: showFilters ? '#007460' : '#222', minWidth: '40px', minHeight: '40px' }}
              aria-label="Filter & Sort"
            >
              <HiOutlineAdjustmentsHorizontal size={22} />
              {/* Filter count indicator */}
              {(() => {
                const activeFilters = [
                  meetingDayFilter !== "",
                  minEloFilter !== 0,
                  maxEloFilter !== 5000,
                  timezoneFilter !== ""
                ].filter(Boolean).length;
                
                return activeFilters > 0 ? (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {activeFilters}
                  </div>
                ) : null;
              })()}
            </button>
          </div>
        </div>
        
        {/* Loading and Error States */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading study groups...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-medium mb-2">Error Loading Groups</p>
            <p className="text-red-600 text-sm">{error}</p>
            <button 
              onClick={onRetry || (() => window.location.reload())}
              className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Groups Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studyGroups.map((group, index) => (
              <div key={group.id || index} ref={index === studyGroups.length - 1 ? lastGroupRef : null}>
                                                  <StudyGroupCard 
                  group={group}
                  memberCounts={memberCounts}
                  onTileClick={handleTileClick}
                />
              </div>
            ))}
            
            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading more groups...</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* End of list indicator - outside the grid */}
        {!loading && !error && !hasMore && studyGroups.length > 0 && (
          <div className="text-center py-8 mt-4 w-full absolute bottom-0 left-0">
            <p className="text-gray-500 text-sm">No more groups to load</p>
          </div>
        )}

        {/* No Results Message */}
        {!loading && !error && studyGroups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-2">No study groups found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
          </div>
        )}







        {/* Info Popup */}
        {/* Removed InfoPopup as info modal is not implemented */}
        
        {/* Combined Modal */}
        {showCombinedModal && selectedGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full h-[600px] overflow-y-auto flex flex-col relative">
              {/* Close button - absolute positioned */}
              <button
                onClick={() => setShowCombinedModal(false)}
                className="absolute top-4 right-4 z-10 p-0 bg-transparent border-none w-10 h-10 flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{ lineHeight: 0 }}
              >
                <SquareX className="w-10 h-10 text-black" />
              </button>
              
              {/* Profile Header */}
              <div className="relative">
                {/* Banner - starts at top */}
                <div className="h-32 bg-[#564ec7] relative">
                  {/* Group Icon */}
                  <div className="absolute -bottom-12 left-6">
                    <div className="relative">
                      <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden">
                        {selectedGroup.image_url ? (
                          <img
                            src={selectedGroup.image_url}
                            alt={`${selectedGroup.group_name} icon`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              // Show placeholder instead
                              const placeholder = target.parentElement?.querySelector('.group-placeholder') as HTMLElement;
                              if (placeholder) {
                                placeholder.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className={`group-placeholder w-full h-full flex items-center justify-center font-bold text-3xl ${selectedGroup.image_url ? 'hidden' : 'flex'}`}
                          style={{ 
                            backgroundColor: ['#564ec7', '#007760', '#de8741', '#ffa65f', '#ffc77e'][selectedGroup.id % 5],
                            color: getTextColor(['#564ec7', '#007760', '#de8741', '#ffa65f', '#ffc77e'][selectedGroup.id % 5])
                          }}
                        >
                          {selectedGroup.group_name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Group name and info */}
                <div className="pt-16 pb-4 px-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-1 text-left">{selectedGroup.group_name}</h3>
                  <p className="text-gray-500 text-sm text-left">Created: {new Date(selectedGroup.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              {/* Navigation Tabs */}
              <div className="px-6 border-b border-gray-200">
                <div className="flex space-x-6">
                  <button 
                    onClick={() => setActiveTab('members')}
                    className={`transition-colors pb-2 border-b-2 ${
                      activeTab === 'members' 
                        ? 'text-[#564ec7] border-[#564ec7]' 
                        : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-[#564ec7]'
                    }`}
                  >
                    Members
                  </button>
                  <button 
                    onClick={() => setActiveTab('info')}
                    className={`transition-colors pb-2 border-b-2 ${
                      activeTab === 'info' 
                        ? 'text-[#564ec7] border-[#564ec7]' 
                        : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-[#564ec7]'
                    }`}
                  >
                    Group Info
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 p-6">
                {/* Members Tab */}
                {activeTab === 'members' && (
                  <div className="space-y-4">
                    {membersLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="text-left">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#564ec7] mb-2"></div>
                          <p className="text-gray-500">Loading members...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedGroupMembers.map((member, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            {/* Member Icon */}
                            <ProfileIcon 
                              memberId={member.user_id || index}
                              summonerName={member.summoner_name}
                              iconId={member.icon_id}
                              size="md"
                              shape="rounded-full"
                            />
                            
                            {/* Member Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span 
                                  className="font-medium text-gray-800 truncate cursor-pointer hover:text-blue-600 transition-colors"
                                  onClick={() => handlePlayerClick(member)}
                                >
                                  {member.summoner_name}
                                </span>
                                {member.owner === 1 && (
                                  <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                            
                            {/* Rank */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-full border" style={{ backgroundColor: '#f8e0db', color: '#8b4513', borderColor: '#e6c7c0' }}>
                                {member.rank && getRankTier(member.rank) && (
                                  <img 
                                    src={getRankIconUrl(getRankTier(member.rank) === 'challenger' || getRankTier(member.rank) === 'grandmaster' ? getRankTier(member.rank) : getRankTier(member.rank) + '+')} 
                                    alt={getRankTier(member.rank)}
                                    className="w-4 h-4 object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                )}
                                <span className="text-sm">{member.rank || 'UNRANKED'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Group Info Tab */}
                {activeTab === 'info' && (
                  <div className="space-y-4 w-full">
                    {infoLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="text-left">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#564ec7] mb-2"></div>
                          <p className="text-gray-500">Loading group details...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 w-full">
                        <div className="w-full">
                          <h5 className="font-medium text-gray-800 mb-2 text-left text-xs">Description</h5>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                            <p className="text-gray-700 whitespace-pre-wrap text-left text-xs">
                              {groupInfo.description || "No description provided"}
                            </p>
                          </div>
                        </div>
                        <div className="w-full">
                          <h5 className="font-medium text-gray-800 mb-2 text-left text-xs">Application Instructions</h5>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                            <p className="text-gray-700 whitespace-pre-wrap text-left text-xs">
                              {groupInfo.instructions || "No application instructions provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Player Modal */}
        {showPlayerModal && selectedPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full h-[600px] overflow-y-auto flex flex-col relative">
              {/* Close button - absolute positioned */}
              <button
                onClick={() => {
                  setShowPlayerModal(false);
                  setSelectedPlayer(null);
                  setPlayerLeagueData([]);
                  setPlayerProfile(null);
                }}
                className="absolute top-4 right-4 z-10 p-0 bg-transparent border-none w-10 h-10 flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{ lineHeight: 0 }}
              >
                <SquareX className="w-10 h-10 text-black" />
              </button>
              
              {/* Profile Header */}
              <div className="relative">
                {/* Banner - starts at top */}
                <div className="h-32 bg-[#ff8889] relative">
                  {/* Profile Picture */}
                  <div className="absolute -bottom-12 left-6">
                    <div className="relative">
                      <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden">
                        {selectedPlayer.icon_id ? (
                          <img
                            src={`https://ddragon.leagueoflegends.com/cdn/14.14.1/img/profileicon/${selectedPlayer.icon_id}.png`}
                            alt={`${selectedPlayer.summoner_name} profile icon`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              // Show placeholder instead
                              const placeholder = target.parentElement?.querySelector('.profile-placeholder') as HTMLElement;
                              if (placeholder) {
                                placeholder.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className={`profile-placeholder w-full h-full flex items-center justify-center font-bold text-3xl ${selectedPlayer.icon_id ? 'hidden' : 'flex'}`}
                          style={{ 
                            backgroundColor: ['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][selectedPlayer.user_id % 5],
                            color: getTextColor(['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][selectedPlayer.user_id % 5])
                          }}
                        >
                          {selectedPlayer.summoner_name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Username and Tag */}
                <div className="pt-16 pb-4 px-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-1 text-left">{selectedPlayer.summoner_name}</h3>
                  <p className="text-gray-500 text-sm text-left">Group Member</p>
                </div>
              </div>
              
              {/* Navigation Tabs */}
              <div className="px-6 border-b border-gray-200">
                <div className="flex space-x-6">
                  <button 
                    onClick={() => setActivePlayerTab('about')}
                    className={`transition-colors pb-2 border-b-2 ${
                      activePlayerTab === 'about' 
                        ? 'text-[#00c9ac] border-[#00c9ac]' 
                        : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-[#00c9ac]'
                    }`}
                  >
                    About Me
                  </button>
                  <button 
                    onClick={() => setActivePlayerTab('stats')}
                    className={`transition-colors pb-2 border-b-2 ${
                      activePlayerTab === 'stats' 
                        ? 'text-[#00c9ac] border-[#00c9ac]' 
                        : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-[#00c9ac]'
                    }`}
                  >
                    TFT Stats
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 p-6">
                {/* TFT Stats Section */}
                {activePlayerTab === 'stats' && (
                  <div className="space-y-4">
                    {leagueDataLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                          <p className="text-gray-500">Loading league data...</p>
                        </div>
                      </div>
                    ) : leagueDataError ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600">{leagueDataError}</p>
                      </div>
                    ) : playerLeagueData.length > 0 ? (
                      <div className="space-y-4">
                        {/* Ranked TFT */}
                        {getRankedTftData() && (
                          <div className="bg-[#fff6ea] rounded-lg p-4 border border-[#e6d7c3]">
                            <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                              <div className="w-5 h-5 bg-amber-500 rounded-lg flex items-center justify-center">
                                <svg className="w-3 h-3 text-amber-900" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                              </div>
                              Ranked TFT
                            </h5>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center">
                                <p className="text-xs text-gray-600 mb-1">Rank</p>
                                <p className="font-bold text-gray-800 text-lg">{getRankedTftData()?.tier} {getRankedTftData()?.rank}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-600 mb-1">LP</p>
                                <p className="font-bold text-gray-800 text-lg">{getRankedTftData()?.leaguePoints}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-600 mb-1">Wins</p>
                                <p className="font-bold text-gray-800 text-lg">{getRankedTftData()?.wins}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-600 mb-1">Losses</p>
                                <p className="font-bold text-gray-800 text-lg">{getRankedTftData()?.losses}</p>
                              </div>
                            </div>
                            <div className="text-center mt-4 pt-4 border-t border-[#e6d7c3]">
                              <p className="text-xs text-gray-600 mb-1">Win Rate</p>
                              <p className="font-bold text-gray-800 text-xl">
                                {getRankedTftData() ? 
                                  `${((getRankedTftData()!.wins / (getRankedTftData()!.wins + getRankedTftData()!.losses)) * 100).toFixed(1)}%` : 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Turbo TFT */}
                        {getTurboTftData() && (
                          <div className="bg-[#fff6ea] rounded-lg p-4 border border-[#e6d7c3]">
                            <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                              <div className="w-5 h-5 bg-purple-500 rounded-lg flex items-center justify-center">
                                <svg className="w-3 h-3 text-purple-900" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                              Turbo TFT
                            </h5>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center">
                                <p className="text-xs text-gray-600 mb-1">Tier</p>
                                <p className="font-bold text-gray-800 text-lg">{getTurboTftData()?.ratedTier}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-600 mb-1">Rating</p>
                                <p className="font-bold text-gray-800 text-lg">{getTurboTftData()?.ratedRating}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-600 mb-1">Wins</p>
                                <p className="font-bold text-gray-800 text-lg">{getTurboTftData()?.wins}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-600 mb-1">Losses</p>
                                <p className="font-bold text-gray-800 text-lg">{getTurboTftData()?.losses}</p>
                              </div>
                            </div>
                            <div className="text-center mt-4 pt-4 border-t border-[#e6d7c3]">
                              <p className="text-xs text-gray-600 mb-1">Win Rate</p>
                              <p className="font-bold text-gray-800 text-xl">
                                {getTurboTftData() ? 
                                  `${((getTurboTftData()!.wins / (getTurboTftData()!.wins + getTurboTftData()!.losses)) * 100).toFixed(1)}%` : 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-[#fff6ea] border border-[#e6d7c3] rounded-lg p-4 text-center">
                        <p className="text-gray-600">No league data available</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* About Me Section */}
                {activePlayerTab === 'about' && (
                  <div className="space-y-4">
                    {profileLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                          <p className="text-gray-500">Loading profile data...</p>
                        </div>
                      </div>
                    ) : profileError ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600">{profileError}</p>
                      </div>
                    ) : playerProfile ? (
                      <div className="space-y-4">
                        {/* Description */}
                        <div className="w-full">
                          <h4 className="font-semibold text-gray-800 mb-3 text-left">Description</h4>
                          <div className="bg-[#fff6ea] rounded-lg p-4 border border-[#e6d7c3] w-full">
                            <p className="text-gray-700 whitespace-pre-wrap text-left">
                              {playerProfile.description || "No description provided"}
                            </p>
                          </div>
                        </div>

                        {/* Availability */}
                        {playerProfile.days && playerProfile.days.length > 0 && (
                          <div className="w-full">
                            <h4 className="font-semibold text-gray-800 mb-3 text-left">Availability</h4>
                            <div className="bg-[#fff6ea] rounded-lg p-4 border border-[#e6d7c3] w-full">
                              <div className="flex items-center gap-2 text-gray-700">
                                <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#ff8889' }} />
                                <span>{Array.isArray(playerProfile.days) ? playerProfile.days.join(", ") : playerProfile.days}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Time and Timezone */}
                        {playerProfile.time && (
                          <div className="w-full">
                            <h4 className="font-semibold text-gray-800 mb-3 text-left">Preferred Time</h4>
                            <div className="bg-[#fff6ea] rounded-lg p-4 border border-[#e6d7c3] w-full">
                              <div className="flex items-center gap-2 text-gray-700">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#00c9ac' }}>
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                <span>
                                  {playerProfile.time.charAt(0).toUpperCase() + playerProfile.time.slice(1)}
                                  {playerProfile.timezone && ` (${playerProfile.timezone})`}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-[#fff6ea] border border-[#e6d7c3] rounded-lg p-4 text-center">
                        <p className="text-gray-600">No profile data available</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fixed Filter Modal */}
        {showFilters && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-full max-w-xl animate-fadeIn relative" style={{ minWidth: '480px', maxWidth: '600px' }}>
              <button
                onClick={() => setShowFilters(false)}
                className="absolute top-4 right-4 p-0 bg-transparent border-none w-10 h-10 flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="Close"
                style={{ lineHeight: 0 }}
              >
                <SquareX className="w-10 h-10 text-black" />
              </button>
              <div className="mb-4 mt-6">
                <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5" style={{ color: '#ff8889' }} />
                  Meeting Days
                </h4>
                <div className="flex flex-wrap gap-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={meetingDayFilter === ''}
                      onChange={(e) => { if (e.target.checked) setMeetingDayFilter(''); }}
                      className="mr-1 accent-[#007460]"
                    />
                    <span className="text-sm text-gray-700 whitespace-nowrap">Any Meeting Day</span>
                  </label>
                  {meetingDays.map(day => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={meetingDayFilter === day}
                        onChange={(e) => { if (e.target.checked) setMeetingDayFilter(day); else setMeetingDayFilter(''); }}
                        className="mr-1 accent-[#007460]"
                      />
                      <span className="text-sm text-gray-700 whitespace-nowrap">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
              <hr className="my-4 border-gray-200" />
              <div className="mb-4">
                <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5" style={{ color: '#facc15' }} />
                  ELO Range
                </h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    step="100"
                    value={minEloFilter || ''}
                    onChange={e => setMinEloFilter(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-[#007460] focus:ring-2 focus:ring-[#007460]"
                    placeholder="0"
                  />
                  <span className="flex items-center text-gray-500">to</span>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    step="100"
                    value={maxEloFilter || ''}
                    onChange={e => setMaxEloFilter(e.target.value === '' ? 5000 : Number(e.target.value))}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-[#007460] focus:ring-2 focus:ring-[#007460]"
                    placeholder="5000"
                  />
                </div>
              </div>
              <hr className="my-4 border-gray-200" />
              <div className="mb-4">
                <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Globe className="w-5 h-5" style={{ color: '#00c9ac' }} />
                  Timezone
                </h4>
                <select
                  value={timezoneFilter}
                  onChange={e => setTimezoneFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-[#007460] focus:ring-2 focus:ring-[#007460]"
                >
                  <option value="">Any Timezone</option>
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
              <div className="flex justify-between mt-6">
                <button
                  onClick={clearFilters}
                  className="bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold shadow transition px-4 py-1.5 text-sm"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="bg-[#00c9ac] hover:bg-[#00b89a] text-white rounded-lg font-semibold shadow transition px-4 py-1.5 text-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Study Group Card Component
function StudyGroupCard({ 
  group, 
  memberCounts,
  onTileClick
}: {
  group: StudyGroup
  memberCounts?: MemberCounts
  onTileClick: (groupId: number) => void
}) {
  return (
    <div 
      className="border-2 rounded-lg p-4 hover:shadow-xl transition-all duration-200 shadow-md backdrop-blur-sm h-full flex flex-col cursor-pointer group relative" 
      style={{ backgroundColor: '#fff6ea', borderColor: '#e6d7c3' }}
      onClick={() => onTileClick(group.id)}
    >
      {/* Hover arrow */}
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ArrowRight className="w-5 h-5" style={{ color: '#00c9ac' }} />
      </div>
      {/* Content */}
      <div className="relative z-10 text-left">
      {/* Desktop layout */}
      <div className="hidden md:flex flex-col h-full text-left">
        {/* Group header with icon and name */}
        <div className="mb-3 text-left">
          <div className="flex items-center gap-3 mb-2">
            {/* Group Icon */}
            {group.image_url ? (
              <img
                src={group.image_url}
                alt={`${group.group_name} icon`}
                className="w-12 h-12 rounded-lg object-cover border-2 border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center border-2 border-gray-200 font-bold text-lg"
                style={{ 
                  backgroundColor: ['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][group.id % 5],
                  color: getTextColor(['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][group.id % 5])
                }}
              >
                {group.group_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-800 truncate">{group.group_name}</h3>
              <p className="text-xs text-gray-500">Created: {new Date(group.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        {/* Stats grid */}
        <div className="space-y-3 mb-4 flex-1">
          {/* Members and ELO in same row */}
          <div className="flex gap-2">
            <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
              <Users className="w-4 h-4" />
              <span>{memberCounts?.[group.id] || 0}</span>
            </div>
            
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-bold">{group.avg_elo ? group.avg_elo.toLocaleString() : 'N/A'}</span>
            </div>
          </div>
          
          {/* Meeting schedule */}
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Calendar className="w-4 h-4" style={{ color: '#ff8889' }} />
            <span className="font-medium truncate">{Array.isArray(group.meeting_schedule) ? group.meeting_schedule.join(", ") : group.meeting_schedule}</span>
          </div>
          
          {/* Time and timezone */}
          {group.time && (
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#00c9ac' }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="font-medium truncate">
                {group.time.charAt(0).toUpperCase() + group.time.slice(1)}
                {group.timezone && ` (${group.timezone})`}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile layout */}
      <div className="md:hidden text-left">
        {/* Group header with icon and name */}
        <div className="mb-3 text-left">
          <div className="flex items-center gap-3 mb-2">
            {/* Group Icon */}
            {group.image_url ? (
              <img
                src={group.image_url}
                alt={`${group.group_name} icon`}
                className="w-10 h-10 rounded-lg object-cover border-2 border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center border-2 border-gray-200 font-bold text-base"
                style={{ 
                  backgroundColor: ['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][group.id % 5],
                  color: getTextColor(['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][group.id % 5])
                }}
              >
                {group.group_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-800">{group.group_name}</h3>
              <p className="text-xs text-gray-500">Created: {new Date(group.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        {/* Group details */}
        <div className="space-y-3 text-left">
          <div className="flex gap-2">
            <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
              <Users className="w-4 h-4" />
              <span>Members: {memberCounts?.[group.id] || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold">{group.avg_elo ? group.avg_elo.toLocaleString() : 'N/A'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Calendar className="w-4 h-4" style={{ color: '#ff8889' }} />
            <span>{Array.isArray(group.meeting_schedule) ? group.meeting_schedule.join(", ") : group.meeting_schedule}</span>
          </div>
          
          {/* Time and timezone */}
          {group.time && (
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#00c9ac' }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>
                {group.time.charAt(0).toUpperCase() + group.time.slice(1)}
                {group.timezone && ` (${group.timezone})`}
              </span>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

// Function to get TFT rank icon URL
function getRankIconUrl(rank: string): string {
  const rankIcons: { [key: string]: string } = {
    'iron+': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Iron.png',
    'bronze+': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Bronze.png',
    'silver+': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Silver.png',
    'gold+': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Gold.png',
    'platinum+': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Platinum.png',
    'emerald+': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Emerald.png',
    'diamond+': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Diamond.png',
    'master+': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Master.png',
    'grandmaster+': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_GrandMaster.png',
    'challenger': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Challenger.png',
  };
  return rankIcons[rank] || '';
}

// Function to extract rank tier from rank string
function getRankTier(rank: string): string {
  if (!rank || rank === 'UNRANKED') return '';
  const firstWord = rank.split(' ')[0].toLowerCase();
  return firstWord;
}

// Function to get text color based on background color
function getTextColor(backgroundColor: string): string {
    // Light colors need dark text
    if (backgroundColor === '#ffc77e' || backgroundColor === '#ffa65f') {
        return '#333333'; // Dark gray for light backgrounds
    }
    return '#ffffff'; // White for dark backgrounds
}



// Profile Icon Component
function ProfileIcon({ 
  memberId, 
  summonerName, 
  iconId, 
  size = 'md',
  shape = 'rounded-lg'
}: { 
  memberId: number
  summonerName: string
  iconId?: number
  size?: 'sm' | 'md' | 'lg'
  shape?: 'rounded-lg' | 'rounded-full'
}) {
  const [profileIconUrl, setProfileIconUrl] = useState<string | null>(null)
  const [iconError, setIconError] = useState(false)
  const [loading, setLoading] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  }

  const fetchProfileIcon = async () => {
    if (!iconId) {
      setIconError(true)
      return
    }

    setLoading(true)
    try {
      const version = await import('../services/riotService').then(module => 
        module.riotService.getCurrentVersion()
      )
      const iconUrl = import('../services/riotService').then(module => 
        module.riotService.getProfileIconUrl(iconId, version)
      )
      setProfileIconUrl(await iconUrl)
      setIconError(false)
    } catch (error) {
      console.error('Error fetching profile icon:', error)
      setIconError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (iconId && !iconError) {
      fetchProfileIcon()
    }
  }, [iconId])

  // If we have a valid icon URL and no error, show the actual icon
  if (profileIconUrl && !iconError && !loading) {
    return (
      <img
        src={profileIconUrl}
        alt={`${summonerName} profile icon`}
        className={`${sizeClasses[size]} ${shape} object-cover border-2 border-gray-200`}
        onError={() => setIconError(true)}
      />
    )
  }

  // Otherwise, show the colored placeholder
  return (
    <div 
      className={`${sizeClasses[size]} ${shape} flex items-center justify-center border-2 border-gray-200 font-bold`}
      style={{ 
        backgroundColor: ['#564ec7', '#007760', '#de8741', '#ffa65f', '#ffc77e'][memberId % 5],
        color: getTextColor(['#564ec7', '#007760', '#de8741', '#ffa65f', '#ffc77e'][memberId % 5])
      }}
    >
      {summonerName.charAt(0).toUpperCase()}
    </div>
  )
}



 