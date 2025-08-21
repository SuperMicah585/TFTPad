import { useRef, useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Zap, Crown, Calendar, Globe, SquareX, ChevronsLeft, FileText, HelpCircle } from 'lucide-react'

import { userService } from '../services/userService'
import type { StudyGroup } from '../services/studyGroupService'
import { teamStatsService } from '../services/teamStatsService'

import { riotService } from '../services/riotService'
import { TeamStatsContent } from './TeamStatsContent'
import { TFTStatsContent } from './TFTStatsContent'
import { playerStatsService } from '../services/playerStatsService'
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";
import { FaSearch } from "react-icons/fa";
import { LoadingSpinner } from './auth/LoadingSpinner'

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

// Custom Sort Dropdown Component
function SortDropdown({ 
    sortBy, 
    sortOrder, 
    onSortByChange, 
    onSortOrderChange 
}: { 
    sortBy: 'created_at' | 'avg_elo'; 
    sortOrder: 'asc' | 'desc'; 
    onSortByChange: (sortBy: 'created_at' | 'avg_elo') => void; 
    onSortOrderChange: (sortOrder: 'asc' | 'desc') => void; 
}) {
    const [isOpen, setIsOpen] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.sort-dropdown')) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const getSortByLabel = (sortBy: string) => {
        switch (sortBy) {
            case 'created_at': return 'Date Created';
            case 'avg_elo': return 'Average ELO';
            default: return 'Date Created';
        }
    };

    const getSortOrderIcon = (order: string) => {
        return order === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="relative sort-dropdown">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white border-2 border-gray-300 text-gray-800 rounded-lg px-2 sm:px-3 py-2 focus:outline-none focus:border-blue-500 hover:border-gray-400 transition-colors font-medium text-xs sm:text-sm min-w-32 sm:min-w-40 flex items-center justify-between shadow-lg"
            >
                <div className="flex items-center gap-1 sm:gap-2">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    <span className="truncate">{getSortByLabel(sortBy)} {getSortOrderIcon(sortOrder)}</span>
                </div>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-40 sm:min-w-48 max-w-64">
                    <div className="p-2">
                        <div className="text-xs font-semibold text-gray-600 mb-2 px-2">Sort By</div>
                        <div className="space-y-1">
                            <button
                                onClick={() => {
                                    onSortByChange('created_at');
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-2 py-1 rounded text-xs sm:text-sm hover:bg-gray-100 ${
                                    sortBy === 'created_at' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                            >
                                Date Created
                            </button>
                            <button
                                onClick={() => {
                                    onSortByChange('avg_elo');
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-2 py-1 rounded text-xs sm:text-sm hover:bg-gray-100 ${
                                    sortBy === 'avg_elo' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                            >
                                Average ELO
                            </button>
                        </div>
                        <div className="border-t border-gray-200 mt-2 pt-2">
                            <div className="text-xs font-semibold text-gray-600 mb-2 px-2">Order</div>
                            <div className="space-y-1">
                                <button
                                    onClick={() => {
                                        onSortOrderChange('desc');
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-2 py-1 rounded text-xs sm:text-sm hover:bg-gray-100 ${
                                        sortOrder === 'desc' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                    }`}
                                >
                                    Descending ↓
                                </button>
                                <button
                                    onClick={() => {
                                        onSortOrderChange('asc');
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-2 py-1 rounded text-xs sm:text-sm hover:bg-gray-100 ${
                                        sortOrder === 'asc' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                    }`}
                                >
                                    Ascending ↑
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

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
  loadMoreGroups,
  hasMore,
  loadingMore,
  onRetry,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  placeholderCount,
  showPlaceholders,
  isCountLoading
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
  selectedGroupMembers?: GroupMember[]
  membersLoading?: boolean
  loading?: boolean
  error?: string | null
  memberCounts?: MemberCounts
  loadMoreGroups?: () => Promise<void>
  hasMore?: boolean
  loadingMore?: boolean
  onRetry?: () => void
  handleOpenInfoModal: (groupId: number) => void
  sortBy?: 'created_at' | 'avg_elo'
  setSortBy?: (sortBy: 'created_at' | 'avg_elo') => void
  sortOrder?: 'asc' | 'desc'
  setSortOrder?: (sortOrder: 'asc' | 'desc') => void
  placeholderCount?: number
  showPlaceholders?: boolean
  isCountLoading?: boolean
}) {
  const navigate = useNavigate();
  
  // New state for combined modal
  const [showCombinedModal, setShowCombinedModal] = useState(false);
  const [selectedGroup] = useState<StudyGroup | null>(null);
  const [groupInfo] = useState({ description: '', instructions: '' });
  const [infoLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'info' | 'team-stats'>('members');
  const [showFilters, setShowFilters] = useState(false);
  
  // Sort state - use props from parent component

  
  // Player modal state
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [clickedMemberId, setClickedMemberId] = useState<number | null>(null);
  const [playerLeagueData, setPlayerLeagueData] = useState<any[]>([]);
  const [leagueDataLoading, setLeagueDataLoading] = useState(false);
  const [leagueDataError, setLeagueDataError] = useState<string | null>(null);
  const [activePlayerTab, setActivePlayerTab] = useState<'about' | 'stats'>('stats');
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Player stats state
  const [playerStatsData, setPlayerStatsData] = useState<any[]>([]);
  const [playerStatsLoading, setPlayerStatsLoading] = useState(false);
  const [playerStatsError, setPlayerStatsError] = useState<string | null>(null);
  
  // Team stats state
  const [teamStatsData, setTeamStatsData] = useState<any[]>([]);
  const [teamStatsLoading, setTeamStatsLoading] = useState(false);
  const [teamStatsError, setTeamStatsError] = useState<string | null>(null);
  const [memberNames, setMemberNames] = useState<{ [riotId: string]: string }>({});
  const [liveData, setLiveData] = useState<{ [summonerName: string]: any }>({});
  const [liveDataLoading] = useState(false);

  // Profile icon state for selected player
  const [selectedPlayerIconUrl, setSelectedPlayerIconUrl] = useState<string>('');
  const [selectedPlayerIconError, setSelectedPlayerIconError] = useState(false);
  const [selectedPlayerIconLoading, setSelectedPlayerIconLoading] = useState(false);
  
  // Auto-fetch team stats when group changes and team-stats tab is active
  useEffect(() => {
    if (selectedGroup && activeTab === 'team-stats' && teamStatsData.length === 0) {
  
      fetchTeamStats(selectedGroup.id, selectedGroup.created_at);
    }
  }, [selectedGroup, activeTab, teamStatsData.length]);

  // Fetch selected player icon when selectedPlayer changes
  useEffect(() => {
    if (selectedPlayer?.icon_id) {
      fetchSelectedPlayerIcon();
    }
  }, [selectedPlayer?.icon_id]);
  
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

  // Handler for tile click - navigates to group detail page
  const handleTileClick = (groupId: number) => {
    navigate(`/study-groups/groups/${groupId}`);
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

  const fetchTeamStats = async (groupId: number, startDate: string) => {
    try {
      setTeamStatsLoading(true);
      setTeamStatsError(null);
      
  
      
      // Get member stats for the group
      const memberStats = await teamStatsService.getMemberStats(groupId, startDate);
      
      
      
      // Handle the new combined API response format
      let allEvents: any[] = [];
      let names: { [riotId: string]: string } = {};
      let liveDataFromAPI: any = {};
      
      if (memberStats && memberStats.events && Array.isArray(memberStats.events)) {
        // New combined format: {"events": [...], "memberNames": {...}, "liveData": {...}}
        allEvents = memberStats.events;

        
        // Get member names from API response if available
        if (memberStats.memberNames && typeof memberStats.memberNames === 'object') {
          names = memberStats.memberNames as unknown as { [riotId: string]: string };
  
        }
        
        // Get live data from API response if available
        if (memberStats.liveData && typeof memberStats.liveData === 'object') {
          liveDataFromAPI = memberStats.liveData as unknown as { [summonerName: string]: any };
  
        }
      } else if (memberStats && typeof memberStats === 'object' && Object.keys(memberStats).length > 0) {
        // Old format: {summonerName: [events]}
        allEvents = Object.values(memberStats).flat();

        
        // Create member names mapping from the API response
        Object.keys(memberStats).forEach(summonerName => {
          names[summonerName] = summonerName;
        });
      } else {
        // No data available

        allEvents = [];
      }
      
      
      
      setTeamStatsData(allEvents);
      setMemberNames(names);
      setLiveData(liveDataFromAPI);
      
      
      
    } catch (error) {
      console.error('❌ Error fetching team stats:', error);
              setTeamStatsError('Not enough historic data to graph');
      setTeamStatsData([]);
      setMemberNames({});
    } finally {
      setTeamStatsLoading(false);
    }
  };

  const handlePlayerClick = async (member: any) => {
    if (!member.user_id) {
      console.error('No user_id found for member:', member);
      return;
    }
    
    setSelectedPlayer(member);
    setClickedMemberId(member.user_id);
    setShowPlayerModal(true);
    setActivePlayerTab('stats');
    
    // Get the riot account for this user to fetch player stats
    let riotId = null;
    try {
      const riotAccount = await userService.getUserRiotAccount(member.user_id);
      riotId = riotAccount?.riot_id;
    } catch (error) {
      console.error('Error fetching riot account for player stats:', error);
    }
    
    // Fetch league data, profile data, and player stats for the player
    await Promise.all([
      fetchPlayerLeagueData(member.user_id),
      fetchPlayerProfile(member.user_id),
      ...(riotId ? [fetchPlayerStats(riotId)] : [])
    ]);
  };

  const getRankedTftData = () => {
    return playerLeagueData.find(data => data.queueType === 'RANKED_TFT');
  };

  const getTurboTftData = () => {
    return playerLeagueData.find(data => data.queueType === 'RANKED_TFT_TURBO');
  };

  const fetchSelectedPlayerIcon = async () => {
    if (!selectedPlayer?.icon_id) return;
    
    setSelectedPlayerIconLoading(true);
    setSelectedPlayerIconError(false);
    
    try {
      const version = await riotService.getCurrentVersion();
      const iconUrl = riotService.getProfileIconUrl(selectedPlayer.icon_id, version);
      setSelectedPlayerIconUrl(iconUrl);
    } catch (error) {
      console.error('Error fetching selected player icon:', error);
      setSelectedPlayerIconError(true);
    } finally {
      setSelectedPlayerIconLoading(false);
    }
  };

  const fetchPlayerStats = async (riotId: string) => {
    try {
      setPlayerStatsLoading(true);
      setPlayerStatsError(null);
      
      const stats = await playerStatsService.getPlayerStats(riotId);
      setPlayerStatsData(stats.events);
    } catch (error) {
      console.error('Error fetching player stats:', error);
      setPlayerStatsError('Failed to load player stats');
      setPlayerStatsData([]);
    } finally {
      setPlayerStatsLoading(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setMeetingDayFilter("");
    setMinEloFilter(0);
    setMaxEloFilter(5000);
    setTimezoneFilter("");
    if (setSortBy) setSortBy('created_at');
    if (setSortOrder) setSortOrder('desc');
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
        <div className="mb-4 space-y-3">
          {/* Sort and Filter Controls */}
          <div className="flex flex-row gap-2 items-center w-full">
            <SortDropdown
              sortBy={sortBy || 'created_at'}
              sortOrder={sortOrder || 'desc'}
              onSortByChange={setSortBy || (() => {})}
              onSortOrderChange={setSortOrder || (() => {})}
            />
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
          
          {/* Search Input */}
          <div className="flex flex-row gap-2 items-center w-full">
            <input
              type="text"
              placeholder="Search groups or players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setActiveSearchQuery(searchQuery);
                  updateSearchInURL(searchQuery);
                }
              }}
              className="flex-1 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#007460] focus:ring-2 focus:ring-[#007460] text-sm"
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
              <FaSearch size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>
        
        {/* Error State */}
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
        {isCountLoading ? (
          // Show loading spinner while getting count
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-gray-600">Loading groups...</p>
            </div>
          </div>
        ) : error ? (
          // Error state handled above
          null
        ) : showPlaceholders || loading ? (
          // Show placeholders based on count
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: placeholderCount || 6 }, (_, index) => (
              <PlaceholderStudyGroupCard key={`placeholder-${index}`} />
            ))}
          </div>
        ) : (
          // Show actual groups
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
                  <LoadingSpinner size="md" className="mx-auto mb-2" />
                  <p className="text-gray-600">Loading more groups...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Results Message */}
        {!isCountLoading && !loading && !error && !showPlaceholders && studyGroups.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Study Groups Found</h3>
            <p className="text-gray-600 mb-4">No groups match your current filters.</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
          </div>
        )}







        {/* Info Popup */}
        {/* Removed InfoPopup as info modal is not implemented */}
        
        {/* Combined Modal */}
        {showCombinedModal && selectedGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full h-[600px] overflow-y-auto flex flex-col relative">
              {/* Close button - absolute positioned */}
              <button
                onClick={() => setShowCombinedModal(false)}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-0 bg-transparent border-none w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center group hover:bg-transparent"
                style={{ lineHeight: 0 }}
              >
                <SquareX className="w-6 h-6 sm:w-10 sm:h-10 text-black group-hover:opacity-80 transition-opacity" />
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
              <div className="px-4 sm:px-6 border-b border-gray-200">
                <div className="flex space-x-2 sm:space-x-6 overflow-x-auto">
                  <button 
                    onClick={() => setActiveTab('members')}
                    className={`transition-colors pb-2 border-b-2 whitespace-nowrap text-sm sm:text-base ${
                      activeTab === 'members' 
                        ? 'text-[#564ec7] border-[#564ec7]' 
                        : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-[#564ec7]'
                    }`}
                  >
                    Members
                  </button>
                  <button 
                    onClick={() => setActiveTab('info')}
                    className={`transition-colors pb-2 border-b-2 whitespace-nowrap text-sm sm:text-base ${
                      activeTab === 'info' 
                        ? 'text-[#564ec7] border-[#564ec7]' 
                        : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-[#564ec7]'
                    }`}
                  >
                    Group Info
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTab('team-stats');
                      if (selectedGroup) {
                        fetchTeamStats(selectedGroup.id, selectedGroup.created_at);
                      }
                    }}
                    className={`transition-colors pb-2 border-b-2 whitespace-nowrap text-sm sm:text-base ${
                      activeTab === 'team-stats' 
                        ? 'text-[#564ec7] border-[#564ec7]' 
                        : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-[#564ec7]'
                    }`}
                  >
                    Team Stats
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 p-4 sm:p-6">
                {/* Members Tab */}
                {activeTab === 'members' && (
                  <div className="space-y-4">
                    {membersLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="text-center">
                          <LoadingSpinner size="md" className="mx-auto mb-2" />
                          <p className="text-gray-500">Loading members...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedGroupMembers?.map((member, index) => (
                          <div 
                            key={index} 
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
                              clickedMemberId === member.user_id 
                                ? 'bg-blue-50 border-blue-300 shadow-md scale-[1.02]' 
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
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
                                  className={`font-medium truncate cursor-pointer transition-all duration-300 ${
                                    clickedMemberId === member.user_id 
                                      ? 'text-blue-600 scale-105' 
                                      : 'text-gray-800 hover:text-blue-600'
                                  }`}
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
                        <div className="text-center">
                          <LoadingSpinner size="md" className="mx-auto mb-2" />
                          <p className="text-gray-500">Loading group details...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 w-full">
                        <div className="w-full">
                          <h5 className="font-medium text-gray-800 mb-2 text-left flex items-center gap-2">
                            <FileText className="w-4 h-4 text-green-600" />
                            Description
                          </h5>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                            <p className="text-gray-700 whitespace-pre-wrap text-left text-xs">
                              {groupInfo.description || "No description provided"}
                            </p>
                          </div>
                        </div>
                        <div className="w-full">
                          <h5 className="font-medium text-gray-800 mb-2 text-left flex items-center gap-2">
                            <FileText className="w-4 h-4 text-orange-600" />
                            Application Instructions
                          </h5>
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
                
                {/* Team Stats Tab */}
                {activeTab === 'team-stats' && (
                  <div className="space-y-4 w-full">
                    {teamStatsLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="text-center">
                          <LoadingSpinner size="md" className="mx-auto mb-2" />
                          <p className="text-gray-500">Loading team stats...</p>
                        </div>
                      </div>
                    ) : (
                      <TeamStatsContent
                        teamStatsData={teamStatsData}
                        teamStatsLoading={teamStatsLoading}
                        teamStatsError={teamStatsError}
                        memberNames={memberNames}
                        liveData={liveData}
                        liveDataLoading={liveDataLoading}
                        className="w-full"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Player Modal */}
        {showPlayerModal && selectedPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full h-[600px] overflow-y-auto flex flex-col relative">
              {/* Close button - absolute positioned */}
              <button
                onClick={() => {
                  setShowPlayerModal(false);
                  setSelectedPlayer(null);
                  setClickedMemberId(null);
                  setPlayerLeagueData([]);
                  setPlayerProfile(null);
                }}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-0 bg-transparent border-none w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center group hover:bg-transparent"
                style={{ lineHeight: 0 }}
              >
                <ChevronsLeft className="w-6 h-6 sm:w-10 sm:h-10 text-black group-hover:opacity-80 transition-opacity" />
              </button>
              
              {/* Profile Header */}
              <div className="relative">
                {/* Banner - starts at top */}
                <div className="h-32 bg-[#ff8889] relative">
                  {/* Profile Picture */}
                  <div className="absolute -bottom-12 left-6">
                    <div className="relative">
                      <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden">
                        {selectedPlayerIconUrl && !selectedPlayerIconError && !selectedPlayerIconLoading ? (
                          <img
                            src={selectedPlayerIconUrl}
                            alt={`${selectedPlayer.summoner_name} profile icon`}
                            className="w-full h-full object-cover"
                            onError={() => setSelectedPlayerIconError(true)}
                          />
                        ) : null}
                        <div 
                          className={`profile-placeholder w-full h-full flex items-center justify-center font-bold text-3xl ${(selectedPlayerIconUrl && !selectedPlayerIconError && !selectedPlayerIconLoading) ? 'hidden' : 'flex'}`}
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
              <div className="px-4 sm:px-6 border-b border-gray-200">
                <div className="flex space-x-2 sm:space-x-6 overflow-x-auto">
                  <button 
                    onClick={() => setActivePlayerTab('about')}
                    className={`transition-colors pb-2 border-b-2 whitespace-nowrap text-sm sm:text-base ${
                      activePlayerTab === 'about' 
                        ? 'text-[#00c9ac] border-[#00c9ac]' 
                        : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-[#00c9ac]'
                    }`}
                  >
                    About Me
                  </button>
                  <button 
                    onClick={() => setActivePlayerTab('stats')}
                    className={`transition-colors pb-2 border-b-2 whitespace-nowrap text-sm sm:text-base ${
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
              <div className="flex-1 p-4 sm:p-6">
                {/* TFT Stats Section */}
                {activePlayerTab === 'stats' && (
                  <TFTStatsContent
                    leagueDataLoading={leagueDataLoading}
                    leagueDataError={leagueDataError}
                    playerLeagueData={playerLeagueData}
                    playerStatsLoading={playerStatsLoading}
                    playerStatsError={playerStatsError}
                    playerStatsData={playerStatsData}
                    getRankedTftData={getRankedTftData}
                    getTurboTftData={getTurboTftData}
                    className="w-full"
                    userId={selectedPlayer?.user_id}
                  />
                )}
                
                {/* About Me Section */}
                {activePlayerTab === 'about' && (
                  <div className="space-y-4">
                    {profileLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="text-center">
                          <LoadingSpinner size="md" className="mx-auto mb-2" />
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
                          <h4 className="font-semibold text-gray-800 mb-3 text-left flex items-center gap-2">
                            <FileText className="w-4 h-4 text-green-600" />
                            Description
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                            <p className="text-gray-700 whitespace-pre-wrap text-left text-xs">
                              {playerProfile.description || "No description provided"}
                            </p>
                          </div>
                        </div>

                        {/* Availability */}
                        {playerProfile.days && playerProfile.days.length > 0 && (
                          <div className="w-full">
                            <h4 className="font-semibold text-gray-800 mb-3 text-left flex items-center gap-2">
                              <Calendar className="w-4 h-4" style={{ color: '#ff8889' }} />
                              Availability
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                                                          <div className="text-gray-700 text-xs text-left">
                              <span>{Array.isArray(playerProfile.days) ? playerProfile.days.join(", ") : playerProfile.days}</span>
                            </div>
                            </div>
                          </div>
                        )}

                        {/* Time and Timezone */}
                        {(playerProfile.time || playerProfile.timezone) && (
                          <div className="w-full">
                            <h4 className="font-semibold text-gray-800 mb-3 text-left flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#00c9ac' }}>
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              Preferred Time
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                                                          <div className="text-gray-700 text-xs text-left">
                              {playerProfile.time ? (
                                <span>
                                  {playerProfile.time.charAt(0).toUpperCase() + playerProfile.time.slice(1)}
                                  {playerProfile.timezone && ` (${playerProfile.timezone})`}
                                </span>
                              ) : (
                                <span>
                                  Timezone: {playerProfile.timezone}
                                </span>
                              )}
                            </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                        <p className="text-gray-600">No profile data available</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile-Friendly Filter Modal */}
        {showFilters && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-6 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl animate-fadeIn relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowFilters(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-0 bg-transparent border-none w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center group hover:bg-transparent"
                aria-label="Close"
                style={{ lineHeight: 0 }}
              >
                <SquareX className="w-6 h-6 sm:w-10 sm:h-10 text-black group-hover:opacity-80 transition-opacity" />
              </button>
              <div className="mb-4 mt-2 sm:mt-6">
                <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm sm:text-base">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#ff8889' }} />
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
                    <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">Any Meeting Day</span>
                  </label>
                  {meetingDays.map(day => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={meetingDayFilter === day}
                        onChange={(e) => { if (e.target.checked) setMeetingDayFilter(day); else setMeetingDayFilter(''); }}
                        className="mr-1 accent-[#007460]"
                      />
                      <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
              <hr className="my-4 border-gray-200" />
              <div className="mb-4">
                <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm sm:text-base">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#facc15' }} />
                  ELO Range
                </h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    step="100"
                    value={minEloFilter || ''}
                    onChange={e => setMinEloFilter(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-[#007460] focus:ring-2 focus:ring-[#007460] text-sm"
                    placeholder="0"
                  />
                  <span className="flex items-center justify-center text-gray-500 text-sm sm:hidden">to</span>
                  <span className="hidden sm:flex items-center text-gray-500 text-sm">to</span>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    step="100"
                    value={maxEloFilter || ''}
                    onChange={e => setMaxEloFilter(e.target.value === '' ? 5000 : Number(e.target.value))}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-[#007460] focus:ring-2 focus:ring-[#007460] text-sm"
                    placeholder="5000"
                  />
                </div>
              </div>
              <hr className="my-4 border-gray-200" />
              <div className="mb-4">
                <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm sm:text-base">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#00c9ac' }} />
                  Timezone
                </h4>
                <select
                  value={timezoneFilter}
                  onChange={e => setTimezoneFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-[#007460] focus:ring-2 focus:ring-[#007460] text-sm"
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
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-between mt-6">
                <button
                  onClick={clearFilters}
                  className="bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold shadow transition px-4 py-2 sm:py-1.5 text-sm order-2 sm:order-1"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="bg-[#00c9ac] hover:bg-[#00b89a] text-white rounded-lg font-semibold shadow transition px-4 py-2 sm:py-1.5 text-sm order-1 sm:order-2"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* End of list indicator - at the very bottom of the page */}
        {!loading && !error && !hasMore && studyGroups.length > 0 && (
          <div className="text-center py-8 mt-8 w-full">
            <p className="text-gray-500 text-sm">No more groups to load</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Placeholder Study Group Card Component
function PlaceholderStudyGroupCard() {
  return (
    <div className="relative w-full">
      <div className="relative bg-white rounded-xl shadow-lg overflow-hidden h-80 animate-pulse">
        {/* Image Section - Fixed height */}
        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl">
          {/* Placeholder for group image */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-300 mx-auto mb-2 border-4 border-white/40"></div>
              <div className="w-8 h-8 bg-gray-300 rounded mx-auto"></div>
            </div>
          </div>
        </div>

        {/* Information Section - Fixed height */}
        <div className="p-4 h-32 flex flex-col justify-between">
          {/* Title and Date */}
          <div className="flex-1">
            {/* Group Title */}
            <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
            
            {/* Created Date */}
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
          
          {/* Stats Row */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-12"></div>
            </div>
          </div>
        </div>
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
      className="relative w-full"
      onClick={() => onTileClick(group.id)}
    >
      <div className="relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden h-80">
        {/* Image Section - Fixed height */}
        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl overflow-hidden">
          {group.image_url ? (
            /* Display uploaded image */
            <img
              src={group.image_url}
              alt={`${group.group_name} group`}
              className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          {/* Placeholder for group image - shown when no image or image fails to load */}
          <div className={`absolute inset-0 flex items-center justify-center ${group.image_url ? 'hidden' : ''}`}>
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-white/20"
                style={{ 
                  backgroundColor: ['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][group.id % 5],
                  color: getTextColor(['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][group.id % 5])
                }}
              >
                <span className="text-2xl font-bold">{group.group_name.charAt(0).toUpperCase()}</span>
              </div>
              <svg
                className="w-8 h-8 text-white opacity-80 mx-auto"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Information Section - Fixed height */}
        <div className="p-4 h-32 flex flex-col justify-between">
          {/* Title and Date */}
          <div className="flex-1">
            {/* Group Title */}
            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
              {group.group_name}
            </h3>
            
            {/* Created Date */}
            <p className="text-xs text-gray-500">
              Created: {new Date(group.created_at).toLocaleDateString()}
            </p>
          </div>
          
          {/* Stats Row */}
          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
              <span className="font-medium text-blue-600 truncate">
                {memberCounts?.[group.id] || 0} {memberCounts?.[group.id] === 1 ? 'Member' : 'Members'}
              </span>
            </div>
            <div className="flex items-center gap-1 group relative">
              <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-yellow-600 truncate">
                {group.avg_elo ? group.avg_elo.toLocaleString() : 'N/A'} ELO
              </span>
              <HelpCircle 
                className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help transition-colors" 
                onMouseEnter={(e) => {
                  const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                  if (tooltip) tooltip.classList.remove('hidden');
                }}
                onMouseLeave={(e) => {
                  const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                  if (tooltip) tooltip.classList.add('hidden');
                }}
              />
              {/* ELO Info Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 hidden max-w-xs">
                <div className="text-center">
                  <div className="font-semibold mb-1">ELO Conversion</div>
                  <div className="space-y-1 text-left">
                    <div>Iron: 0-399</div>
                    <div>Bronze: 400-799</div>
                    <div>Silver: 800-1199</div>
                    <div>Gold: 1200-1599</div>
                    <div>Platinum: 1600-1999</div>
                    <div>Emerald: 2000-2399</div>
                    <div>Diamond: 2400-2799</div>
                    <div>Master+: 2800+</div>
                  </div>
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
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
      const version = await riotService.getCurrentVersion()
      const iconUrl = riotService.getProfileIconUrl(iconId, version)
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



 