import { useState, useEffect } from 'react'
import { Users, Globe, Calendar, ArrowRight, Zap, SquareX } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { freeAgentService, type FreeAgent, type FreeAgentFilters } from '../services/freeAgentService'
import { studyGroupService } from '../services/studyGroupService'
import { studyGroupInviteService } from '../services/studyGroupInviteService'
import { useAuth } from '../contexts/AuthContext'
import { riotService } from '../services/riotService'
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";
import { FaSearch } from "react-icons/fa";

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





// Custom Rank Range Dropdown Component
function RankRangeDropdown({ 
    minRank, 
    maxRank, 
    onMinRankChange, 
    onMaxRankChange, 
    rankOptions 
}: { 
    minRank: string; 
    maxRank: string; 
    onMinRankChange: (rank: string) => void; 
    onMaxRankChange: (rank: string) => void; 
    rankOptions: string[]; 
}) {
    const [isMinOpen, setIsMinOpen] = useState(false);
    const [isMaxOpen, setIsMaxOpen] = useState(false);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.rank-dropdown')) {
                setIsMinOpen(false);
                setIsMaxOpen(false);
            }
        };

        if (isMinOpen || isMaxOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMinOpen, isMaxOpen]);

    return (
        <div className="flex items-center gap-2">
            {/* Min Rank Dropdown */}
            <div className="relative rank-dropdown">
                <button
                    onClick={() => {
                        setIsMinOpen(!isMinOpen);
                        setIsMaxOpen(false);
                    }}
                    className="bg-white border-2 border-gray-300 text-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 hover:border-gray-400 transition-colors font-medium text-sm min-w-32 flex items-center justify-between shadow-lg"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                            <img 
                                src={getRankIconUrl(minRank)} 
                                alt={minRank}
                                className="w-5 h-5 object-contain"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                        </div>
                        <span className="truncate text-xs">{minRank.charAt(0).toUpperCase() + minRank.slice(1)}</span>
                    </div>
                    <svg className="w-3 h-3 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                
                {isMinOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-300 rounded-lg z-[9999] max-h-60 overflow-y-auto shadow-xl min-w-32">
                        {rankOptions.map(rank => (
                            <button
                                key={rank}
                                onClick={() => {
                                    onMinRankChange(rank);
                                    setIsMinOpen(false);
                                }}
                                className="w-full px-3 py-2 text-left text-gray-800 hover:bg-gray-100 flex items-center gap-2 border-b border-gray-200 last:border-b-0 transition-colors"
                                style={{ backgroundColor: rank === minRank ? '#f3f4f6' : '#ffffff' }}
                            >
                                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                    <img 
                                        src={getRankIconUrl(rank)} 
                                        alt={rank}
                                        className="w-5 h-5 object-contain"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                        }}
                                    />
                                </div>
                                <span className="truncate text-xs">{rank.charAt(0).toUpperCase() + rank.slice(1)}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <span className="text-gray-600 text-sm">to</span>

            {/* Max Rank Dropdown */}
            <div className="relative rank-dropdown">
                <button
                    onClick={() => {
                        setIsMaxOpen(!isMaxOpen);
                        setIsMinOpen(false);
                    }}
                    className="bg-white border-2 border-gray-300 text-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 hover:border-gray-400 transition-colors font-medium text-sm min-w-32 flex items-center justify-between shadow-lg"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                            <img 
                                src={getRankIconUrl(maxRank)} 
                                alt={maxRank}
                                className="w-5 h-5 object-contain"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                        </div>
                        <span className="truncate text-xs">{maxRank.charAt(0).toUpperCase() + maxRank.slice(1)}</span>
                    </div>
                    <svg className="w-3 h-3 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                
                {isMaxOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-300 rounded-lg z-[9999] max-h-60 overflow-y-auto shadow-xl min-w-32">
                        {rankOptions.map(rank => (
                            <button
                                key={rank}
                                onClick={() => {
                                    onMaxRankChange(rank);
                                    setIsMaxOpen(false);
                                }}
                                className="w-full px-3 py-2 text-left text-gray-800 hover:bg-gray-100 flex items-center gap-2 border-b border-gray-200 last:border-b-0 transition-colors"
                                style={{ backgroundColor: rank === maxRank ? '#f3f4f6' : '#ffffff' }}
                            >
                                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                    <img 
                                        src={getRankIconUrl(rank)} 
                                        alt={rank}
                                        className="w-5 h-5 object-contain"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                        }}
                                    />
                                </div>
                                <span className="truncate text-xs">{rank.charAt(0).toUpperCase() + rank.slice(1)}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
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
  agentId, 
  summonerName, 
  iconId, 
  size = 'md',
  shape = 'rounded-lg'
}: { 
  agentId: number
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
      setProfileIconUrl(iconUrl)
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
        backgroundColor: ['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][agentId % 5],
        color: getTextColor(['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][agentId % 5])
      }}
    >
      {summonerName.charAt(0).toUpperCase()}
    </div>
  )
}

interface NewPostData {
  looking_for: string;
  availability: string[];
  experience: string;
  message: string;
}

const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';

export function FreeAgentsTab() {
  const { userId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [newPostData, setNewPostData] = useState<NewPostData>({
    looking_for: "",
    availability: [] as string[],
    experience: "",
    message: ""
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<FreeAgent | null>(null);
  const [inviteMessage, setInviteMessage] = useState("");
  const [selectedStudyGroupId, setSelectedStudyGroupId] = useState<number | null>(null);
  const [userStudyGroups, setUserStudyGroups] = useState<any[]>([]);
  const [freeAgents, setFreeAgents] = useState<FreeAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [pagination, setPagination] = useState<{
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_prev: boolean;
  } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Modal state for agent details
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedAgentForDetails, setSelectedAgentForDetails] = useState<FreeAgent | null>(null);
  const [leagueData, setLeagueData] = useState<any[]>([]);
  const [leagueDataLoading, setLeagueDataLoading] = useState(false);
  const [leagueDataError, setLeagueDataError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'stats'>('stats');
  const [hasInitialized, setHasInitialized] = useState(false);


  const [showFilters, setShowFilters] = useState(false);

  // Player modal state

  // Fetch free agents data with filters
  const fetchFreeAgents = async (filters?: FreeAgentFilters, retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      const response = await freeAgentService.getFreeAgents(filters);
      setFreeAgents(response.free_agents);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error fetching free agents:', err);
      
      // Retry on connection errors
      if (retryCount < 2 && err instanceof Error && 
          (err.message.includes('Resource temporarily unavailable') || 
           err.message.includes('connection') || 
           err.message.includes('network'))) {
        console.log(`Retrying free agents fetch (${retryCount + 1}/2)...`);
        setTimeout(() => fetchFreeAgents(filters, retryCount + 1), 1000);
        return;
      }
      
      setError('Failed to load free agents');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's study groups for the dropdown
  const fetchUserStudyGroups = async () => {
    if (!userId) return;
    
    try {
      const userGroups = await studyGroupService.getUserStudyGroupsByUser(userId);
      setUserStudyGroups(userGroups);
    } catch (error) {
      console.error('Error fetching user study groups:', error);
    }
  };

  // Combined initial data fetch - only run once when userId is available
  useEffect(() => {
    if (userId && !hasInitialized) {
      // Only fetch user study groups here, free agents are handled by the filter effect
      fetchUserStudyGroups();
    }
  }, [userId, hasInitialized]); // Only depend on userId and initialization state

  const handleCreatePost = () => {
    // Mock function - in real app this would save to database
    console.log("Creating new post:", newPostData);
    // Add the new post to the freeAgents array
    const newPost: FreeAgent = {
      id: freeAgents.length + 1,
      summoner_name: "Moisturizar", // mock current user
      elo: 2450, // mock current user ELO
      rank: "Diamond I", // mock current user rank
      looking_for: newPostData.looking_for + ". " + newPostData.message,
      availability: newPostData.availability,
      experience: newPostData.experience,
      created_date: new Date().toISOString().split('T')[0],
      region: "Unknown",
      date_updated: new Date().toISOString()
    };
    setFreeAgents(prev => [newPost, ...prev]); // Add to beginning of array
    setShowCreatePostModal(false);
    setNewPostData({ looking_for: "", availability: [], experience: "", message: "" });
  };

  const handleAvailabilityChange = (day: string) => {
    setNewPostData(prev => ({
      ...prev,
      availability: prev.availability.includes(day)
        ? prev.availability.filter(d => d !== day)
        : [...prev.availability, day]
    }));
  };

  const handleSendInvite = async () => {
    if (!userId || !selectedAgent || !selectedStudyGroupId) {
      alert('Please select a study group to invite to');
      return;
    }

    try {
      setInviteLoading(true);
      
      // The agent's ID is the user ID
      const agentUserId = selectedAgent.id;
      
      await studyGroupInviteService.createInvite({
        user_one: userId,
        user_two: agentUserId,
        study_group_id: selectedStudyGroupId,
        message: inviteMessage
      });

      alert('Invitation sent successfully!');
      setShowInviteModal(false);
      setSelectedAgent(null);
      setInviteMessage("");
      setSelectedStudyGroupId(null);
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  // Fetch agent's TFT league data
  const fetchAgentLeagueData = async (agentId: number) => {
    setLeagueDataLoading(true);
    setLeagueDataError(null);
    
    try {
      // Get the agent's Riot account to get their puuid
      const agentRiotAccount = await fetch(`${API_BASE_URL}/api/user-riot-account/${agentId}`).then(res => res.json());
      
      if (agentRiotAccount.error) {
        setLeagueDataError('No Riot account found for this player');
        setLeagueData([]);
        return;
      }
      
      // Fetch TFT league data using the same API as Profile tab
      const leagueResponse = await fetch(`${API_BASE_URL}/api/tft-league/${agentRiotAccount.riot_id}?user_id=${agentId}`);
      const leagueData = await leagueResponse.json();
      
      if (leagueResponse.ok) {
        setLeagueData(leagueData);
      } else {
        setLeagueDataError('Failed to load TFT league data');
        setLeagueData([]);
      }
    } catch (error) {
      console.error('Error fetching agent league data:', error);
      setLeagueDataError('Failed to load TFT league data');
      setLeagueData([]);
    } finally {
      setLeagueDataLoading(false);
    }
  };

  const getRankedTftData = () => {
    return leagueData.find((entry: any) => entry.queueType === 'RANKED_TFT');
  };

  const getTurboTftData = () => {
    return leagueData.find((entry: any) => entry.queueType === 'RANKED_TFT_TURBO');
  };



  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [minRankFilter, setMinRankFilter] = useState("iron+");
  const [maxRankFilter, setMaxRankFilter] = useState("challenger");
  const [availabilityDaysFilter, setAvailabilityDaysFilter] = useState<string[]>([]);
  const [availabilityTimeFilter, setAvailabilityTimeFilter] = useState("");
  const [availabilityTimezoneFilter, setAvailabilityTimezoneFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");

  // Rank options for dropdown
  const rankOptions = [
    'iron+', 'bronze+', 'silver+', 'gold+', 'platinum+', 'emerald+', 'diamond+', 'master+', 'grandmaster+', 'challenger'
  ];

  // Available days for filtering
  const availableDays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Flexible'
  ];

  // Available regions for filtering
  const availableRegions = [
    'BR1', 'EUN1', 'EUW1', 'LA1', 'LA2', 'NA1', 'OC1', 'RU1', 'TR1', 'ME1', 'JP1', 'KR', 'SEA', 'TW2', 'VN2'
  ];



  // Initialize search from URL on component mount
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery) {
      setSearchQuery(urlQuery);
      setActiveSearchQuery(urlQuery);
    }
  }, [searchParams]);

  // Update URL when search changes
  const updateSearchInURL = (query: string) => {
    if (query) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  };

  // Apply filters and fetch data
  const applyFilters = async () => {
    const filters: FreeAgentFilters = {
      page: 1,
      limit: 50,
      search: activeSearchQuery || undefined,
      minRank: minRankFilter,
      maxRank: maxRankFilter,
      availabilityDays: availabilityDaysFilter.length > 0 ? availabilityDaysFilter[0] : undefined,
      availabilityTime: availabilityTimeFilter || undefined,
      availabilityTimezone: availabilityTimezoneFilter || undefined,
      region: regionFilter || undefined,
      sort_by: 'created_at',
      sort_order: 'desc'
    };
    
    await fetchFreeAgents(filters);
  };

  // Clear all filters
  const clearFilters = () => {
    setMinRankFilter("iron+");
    setMaxRankFilter("challenger");
    setAvailabilityDaysFilter([]);
    setAvailabilityTimeFilter("");
    setAvailabilityTimezoneFilter("");
    setRegionFilter("");
  };

  // Single effect to handle all data fetching - initial load and filter changes
  useEffect(() => {
    if (hasInitialized) {
      applyFilters();
    }
  }, [hasInitialized, activeSearchQuery, minRankFilter, maxRankFilter, availabilityDaysFilter, availabilityTimeFilter, availabilityTimezoneFilter, regionFilter]);

  // Mark as initialized after first load - allow non-logged in users to browse
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  // Initial data fetch - only fetch user study groups when logged in, free agents are handled by the filter effect
  useEffect(() => {
    if (userId) {
      fetchUserStudyGroups();
    }
  }, [userId]);

  // Add this near the top of FreeAgentsTab, after pagination is defined:
  const hasMore = pagination ? pagination.has_next : false;

  return (
    <>
      <div className="relative w-full min-h-screen">
        {/* Hero Background Image - Only show on Free Agents tab */}
        <div className="absolute inset-0 overflow-hidden rounded-lg z-0 h-96">
          <div
            className="w-full h-full bg-cover bg-no-repeat opacity-60"
            style={{
                              backgroundImage: 'url(/samira.png)',
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
                <h1 className="text-3xl font-bold text-gray-800">Free Agents</h1>
              </div>
              {userId && (
                <button
                  onClick={() => setShowCreatePostModal(true)}
                  className="bg-[#964B00] hover:bg-[#7c3a00] text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Create Post
                </button>
              )}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="mb-4 mt-2 relative">
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="flex flex-col items-center mb-2">
      
            </div>
            <div className="flex flex-row gap-2 items-center w-full">
              <input
                type="text"
                placeholder="Search by name, interests, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setActiveSearchQuery(searchQuery);
                    updateSearchInURL(searchQuery);
                  }
                }}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#007460] focus:ring-2 focus:ring-[#007460]"
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
                aria-label="Filter Options"
              >
                <HiOutlineAdjustmentsHorizontal size={22} />
                {/* Filter count indicator */}
                {(() => {
                  const activeFilters = [
                    minRankFilter !== "iron+",
                    maxRankFilter !== "challenger", 
                    availabilityDaysFilter.length > 0,
                    availabilityTimeFilter !== "",
                    availabilityTimezoneFilter !== "",
                    regionFilter !== ""
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

          {loading ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center flex-1 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-orange-800 mb-2">Loading Free Agents</h3>
              <p className="text-orange-700">Please wait while we fetch available players...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center flex-1 flex flex-col items-center justify-center">
              <Users className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Free Agents</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={() => fetchFreeAgents()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : freeAgents.length === 0 ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center flex-1 flex flex-col items-center justify-center">
              <Users className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-orange-800 mb-2">No Free Agents Found</h3>
              <p className="text-orange-700">No players match your current filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
              {freeAgents.map((agent: FreeAgent) => (
                <FreeAgentCard 
                  key={agent.id} 
                  agent={agent} 
                  onTileClick={(agent) => {
                    setSelectedAgentForDetails(agent);
                    setShowAgentModal(true);
                    fetchAgentLeagueData(agent.id);
                  }} 
                />
              ))}
            </div>
          )}

          {freeAgents.length > 0 && (
            <div className="text-center mt-8 mb-4">
              {pagination && pagination.has_next ? (
                <button
                  onClick={async () => {
                    const nextPage = pagination.current_page + 1;
                    const filters: FreeAgentFilters = {
                      page: nextPage,
                      limit: 50,
                      search: activeSearchQuery || undefined,
                      minRank: minRankFilter,
                      maxRank: maxRankFilter,
                      availabilityDays: availabilityDaysFilter.length > 0 ? availabilityDaysFilter[0] : undefined,
                      availabilityTime: availabilityTimeFilter || undefined,
                      availabilityTimezone: availabilityTimezoneFilter || undefined,
                      region: regionFilter || undefined,
                      sort_by: 'created_at',
                      sort_order: 'desc'
                    };
                    
                    try {
                      setLoadingMore(true);
                      const response = await freeAgentService.getFreeAgents(filters);
                      setFreeAgents(prev => [...prev, ...response.free_agents]);
                      setPagination(response.pagination);
                    } catch (err) {
                      console.error('Error loading more free agents:', err);
                    } finally {
                      setLoadingMore(false);
                    }
                  }}
                  disabled={loadingMore}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              ) : (
                <p className="text-gray-500 text-sm">No more players to load</p>
              )}
            </div>
          )}

          {/* Create Post Modal */}
          {showCreatePostModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
              <div className="bg-white rounded-lg p-6 w-[600px] max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">Create Free Agent Post</h3>
                  <button
                    onClick={() => setShowCreatePostModal(false)}
                    className="p-0 bg-transparent border-none w-10 h-10 flex items-center justify-center hover:opacity-80 transition-opacity"
                    style={{ lineHeight: 0 }}
                  >
                    <SquareX className="w-10 h-10 text-black" />
                  </button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleCreatePost(); }} className="space-y-4">
                  <div>
                    <label htmlFor="lookingFor" className="block text-sm font-medium text-gray-700 mb-2">
                      What are you looking for? *
                    </label>
                    <input
                      type="text"
                      id="lookingFor"
                      value={newPostData.looking_for}
                      onChange={(e) => setNewPostData({...newPostData, looking_for: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-400"
                      placeholder="e.g., Tournament preparation, competitive play"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Availability *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newPostData.availability.includes("Monday")}
                          onChange={() => handleAvailabilityChange("Monday")}
                          className="mr-2"
                        />
                        Monday
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newPostData.availability.includes("Tuesday")}
                          onChange={() => handleAvailabilityChange("Tuesday")}
                          className="mr-2"
                        />
                        Tuesday
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newPostData.availability.includes("Wednesday")}
                          onChange={() => handleAvailabilityChange("Wednesday")}
                          className="mr-2"
                        />
                        Wednesday
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newPostData.availability.includes("Thursday")}
                          onChange={() => handleAvailabilityChange("Thursday")}
                          className="mr-2"
                        />
                        Thursday
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newPostData.availability.includes("Friday")}
                          onChange={() => handleAvailabilityChange("Friday")}
                          className="mr-2"
                        />
                        Friday
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newPostData.availability.includes("Saturday")}
                          onChange={() => handleAvailabilityChange("Saturday")}
                          className="mr-2"
                        />
                        Saturday
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newPostData.availability.includes("Sunday")}
                          onChange={() => handleAvailabilityChange("Sunday")}
                          className="mr-2"
                        />
                        Sunday
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newPostData.availability.includes("Flexible")}
                          onChange={() => handleAvailabilityChange("Flexible")}
                          className="mr-2"
                        />
                        Flexible
                      </label>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                      Peak Rating *
                    </label>
                    <select
                      id="experience"
                      value={newPostData.experience}
                      onChange={(e) => setNewPostData({...newPostData, experience: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-400"
                    >
                      <option value="" disabled>Select peak rating</option>
                      <option value="Iron">Iron</option>
                      <option value="Bronze">Bronze</option>
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                      <option value="Platinum">Platinum</option>
                      <option value="Diamond">Diamond</option>
                      <option value="Master">Master</option>
                      <option value="Grandmaster">Grandmaster</option>
                      <option value="Challenger">Challenger</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Message *
                    </label>
                    <textarea
                      id="message"
                      value={newPostData.message}
                      onChange={(e) => setNewPostData({...newPostData, message: e.target.value})}
                      rows={4}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-400 resize-vertical"
                      placeholder="Tell potential groups about yourself and what you're looking for..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreatePostModal(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      style={{ backgroundColor: '#964B00' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#7c3a00';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#964B00';
                      }}
                    >
                      Create Post
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Invitation Modal at top level */}
      {showInviteModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Send Invitation</h3>
              <button
                onClick={() => { 
                  setShowInviteModal(false); 
                  setSelectedAgent(null); 
                  setInviteMessage(""); 
                  setSelectedStudyGroupId(null);
                }}
                              >
                  <SquareX className="w-10 h-10 text-black" />
                </button>
            </div>
            <div className="space-y-4">
              <div className="bg-[#00c9ac]/10 border border-[#00c9ac]/20 rounded-lg p-4">
                <h4 className="font-semibold text-[#00c9ac] mb-2">Inviting {selectedAgent.summoner_name}</h4>
                <p className="text-[#00c9ac] text-sm">Send a personalized message to invite them to your group.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Study Group *
                </label>
                <select
                  value={selectedStudyGroupId || ''}
                  onChange={(e) => setSelectedStudyGroupId(Number(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
                  required
                >
                  <option value="">Choose a study group...</option>
                  {userStudyGroups.map((userGroup) => (
                    <option key={userGroup.study_group?.id} value={userGroup.study_group?.id}>
                      {userGroup.study_group?.group_name || 'Unknown Group'}
                    </option>
                  ))}
                </select>
                {userStudyGroups.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    You need to be a member of at least one study group to send invitations.
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invitation Message
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 resize-vertical"
                  placeholder="Write a personalized message explaining why you'd like them to join your group..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { 
                    setShowInviteModal(false); 
                    setSelectedAgent(null); 
                    setInviteMessage(""); 
                    setSelectedStudyGroupId(null);
                  }}
                  className="flex-1 bg-[#ff8889] hover:bg-[#ff8889]/80 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  disabled={inviteLoading}
                >
                  Cancel
                </button>
                {userId && (
                  <button
                    onClick={handleSendInvite}
                    disabled={!selectedStudyGroupId || inviteLoading}
                    className="flex-1 bg-[#00c9ac] hover:bg-[#00c9ac]/80 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {inviteLoading ? 'Sending...' : 'Send Invitation'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Details Modal - Discord Style */}
      {showAgentModal && selectedAgentForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full h-[600px] overflow-y-auto flex flex-col relative">
            {/* Close button - absolute positioned */}
            <button
              onClick={() => {
                setShowAgentModal(false);
                setSelectedAgentForDetails(null);
                setLeagueData([]);
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
                      {selectedAgentForDetails.icon_id ? (
                        <img
                          src={`https://ddragon.leagueoflegends.com/cdn/14.14.1/img/profileicon/${selectedAgentForDetails.icon_id}.png`}
                          alt={`${selectedAgentForDetails.summoner_name} profile icon`}
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
                        className={`profile-placeholder w-full h-full flex items-center justify-center font-bold text-3xl ${selectedAgentForDetails.icon_id ? 'hidden' : 'flex'}`}
                        style={{ 
                          backgroundColor: ['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][selectedAgentForDetails.id % 5],
                          color: getTextColor(['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][selectedAgentForDetails.id % 5])
                        }}
                      >
                        {selectedAgentForDetails.summoner_name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Username and Tag */}
              <div className="pt-16 pb-4 px-6">
                <h3 className="text-xl font-bold text-gray-800 mb-1 text-left">{selectedAgentForDetails.summoner_name}</h3>
                <p className="text-gray-500 text-sm text-left">{selectedAgentForDetails.region}</p>
                
                {/* Message button */}
                {userId && (
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setSelectedAgent(selectedAgentForDetails);
                        setShowAgentModal(false);
                        setShowInviteModal(true);
                      }}
                      className="bg-[#00c9ac] hover:bg-[#00b89a] text-white px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM9 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      Send Invitation
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="px-6 border-b border-gray-200">
              <div className="flex space-x-6">
                <button 
                  onClick={() => setActiveTab('about')}
                  className={`transition-colors pb-2 border-b-2 ${
                    activeTab === 'about' 
                      ? 'text-[#00c9ac] border-[#00c9ac]' 
                      : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-[#00c9ac]'
                  }`}
                >
                  About Me
                </button>
                <button 
                  onClick={() => setActiveTab('stats')}
                  className={`transition-colors pb-2 border-b-2 ${
                    activeTab === 'stats' 
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
              {activeTab === 'stats' && (
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
                ) : leagueData.length > 0 ? (
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
              {activeTab === 'about' && (
                <div className="space-y-4">
                  {/* Description */}
                  <div className="w-full">
                    <h4 className="font-semibold text-gray-800 mb-3 text-left">Description</h4>
                    <div className="bg-[#fff6ea] rounded-lg p-4 border border-[#e6d7c3] w-full">
                      <p className="text-gray-700 whitespace-pre-wrap text-left">
                        {selectedAgentForDetails.looking_for || "No description provided"}
                      </p>
                    </div>
                  </div>

                  {/* Availability */}
                  {selectedAgentForDetails.availability && selectedAgentForDetails.availability.length > 0 && (
                    <div className="w-full">
                      <h4 className="font-semibold text-gray-800 mb-3 text-left">Availability</h4>
                      <div className="bg-[#fff6ea] rounded-lg p-4 border border-[#e6d7c3] w-full">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#ff8889' }} />
                          <span>{Array.isArray(selectedAgentForDetails.availability) ? selectedAgentForDetails.availability.join(", ") : selectedAgentForDetails.availability}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Time and Timezone */}
                  {selectedAgentForDetails.time && (
                    <div className="w-full">
                      <h4 className="font-semibold text-gray-800 mb-3 text-left">Preferred Time</h4>
                      <div className="bg-[#fff6ea] rounded-lg p-4 border border-[#e6d7c3] w-full">
                        <div className="flex items-center gap-2 text-gray-700">
                          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#00c9ac' }}>
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span>
                            {selectedAgentForDetails.time.charAt(0).toUpperCase() + selectedAgentForDetails.time.slice(1)}
                            {selectedAgentForDetails.timezone && ` (${selectedAgentForDetails.timezone})`}
                          </span>
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
      {!loading && !error && !hasMore && freeAgents.length > 0 && (
        <div className="text-center py-8 mt-4 w-full absolute bottom-0 left-0">
          <p className="text-gray-500 text-sm">No more players to load</p>
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
                {availableDays.map(day => (
                  <label key={day} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={availabilityDaysFilter.includes(day)}
                      onChange={(e) => {
                        if (e.target.checked) setAvailabilityDaysFilter(prev => [...prev, day]);
                        else setAvailabilityDaysFilter(prev => prev.filter(d => d !== day));
                      }}
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
                Rank Range
              </h4>
              <RankRangeDropdown
                minRank={minRankFilter}
                maxRank={maxRankFilter}
                onMinRankChange={setMinRankFilter}
                onMaxRankChange={setMaxRankFilter}
                rankOptions={rankOptions}
              />
            </div>
            <hr className="my-4 border-gray-200" />
            <div className="mb-4">
              <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Globe className="w-5 h-5" style={{ color: '#00c9ac' }} />
                Timezone
              </h4>
              <select
                value={availabilityTimezoneFilter}
                onChange={e => setAvailabilityTimezoneFilter(e.target.value)}
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
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-bold text-gray-700 mb-2">Time Preference</h4>
                <select
                  value={availabilityTimeFilter}
                  onChange={e => setAvailabilityTimeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-[#007460] focus:ring-2 focus:ring-[#007460]"
                >
                  <option value="">Any Time</option>
                  <option value="mornings">Mornings</option>
                  <option value="afternoons">Afternoons</option>
                  <option value="evenings">Evenings</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
              <div>
                <h4 className="font-bold text-gray-700 mb-2">Region</h4>
                <select
                  value={regionFilter}
                  onChange={e => setRegionFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-[#007460] focus:ring-2 focus:ring-[#007460]"
                >
                  <option value="">All Regions</option>
                  {availableRegions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
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
    </>
  )
}

// Free Agent Card Component
function FreeAgentCard({ 
  agent, 
  onTileClick 
}: { 
  agent: FreeAgent, 
  onTileClick: (agent: FreeAgent) => void 
}) {
  return (
    <div 
      className="border-2 rounded-lg p-4 hover:shadow-xl transition-all duration-200 shadow-md backdrop-blur-sm flex flex-col cursor-pointer group relative h-full" 
      style={{ backgroundColor: '#fff6ea', borderColor: '#e6d7c3' }}
      onClick={() => onTileClick(agent)}
    >
      {/* Hover arrow */}
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ArrowRight className="w-5 h-5" style={{ color: '#00c9ac' }} />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-left w-full flex-1 flex flex-col">
        {/* Desktop layout */}
        <div className="hidden md:flex flex-col text-left w-full h-full">
          {/* Player header with icon and name */}
          <div className="mb-3 text-left w-full">
            <div className="flex items-center gap-3 mb-2">
              {/* Player Icon */}
              <ProfileIcon 
                agentId={agent.id}
                summonerName={agent.summoner_name}
                iconId={agent.icon_id}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-800 truncate">{agent.summoner_name}</h3>
              </div>
            </div>
          </div>
          
          {/* Rank and update date on same line */}
          <div className="mb-3 flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
              {getRankTier(agent.rank) && (
                <img 
                  src={getRankIconUrl(getRankTier(agent.rank) === 'challenger' || getRankTier(agent.rank) === 'grandmaster' ? getRankTier(agent.rank) : getRankTier(agent.rank) + '+')} 
                  alt={getRankTier(agent.rank)}
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
              <span>{agent.rank || 'UNRANKED'}</span>
            </div>
            {agent.date_updated && (
              <p className="text-xs text-gray-500">Updated {new Date(agent.date_updated).toLocaleDateString()}</p>
            )}
          </div>
          
          {/* Availability - same style as group tiles */}
          <div className="space-y-3 w-full mb-4 flex-1">
            <div className="flex items-center gap-2 text-gray-600 text-sm w-full">
              <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#ff8889' }} />
              <span className="font-medium truncate flex-1">
                {Array.isArray(agent.availability) ? agent.availability.join(", ") : agent.availability}
              </span>
            </div>
            
            {/* Time (if available) */}
            {agent.time && (
              <div className="flex items-center gap-2 text-gray-600 text-sm w-full">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#00c9ac' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="font-medium truncate flex-1">
                  {agent.time.charAt(0).toUpperCase() + agent.time.slice(1)}
                  {agent.timezone && ` (${agent.timezone})`}
                </span>
              </div>
            )}
            
            {/* Region */}
            <div className="flex items-center gap-2 text-gray-600 text-sm w-full">
              <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="font-medium truncate flex-1">{agent.region}</span>
            </div>
          </div>
        </div>
        
        {/* Mobile layout */}
        <div className="md:hidden text-left w-full flex-1">
          {/* Player header with icon and name */}
          <div className="mb-3 text-left w-full">
            <div className="flex items-center gap-3 mb-2">
              {/* Player Icon */}
              <ProfileIcon 
                agentId={agent.id}
                summonerName={agent.summoner_name}
                iconId={agent.icon_id}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-800">{agent.summoner_name}</h3>
              </div>
            </div>
          </div>
          
          {/* Rank and update date on same line */}
          <div className="mb-3 flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
              {getRankTier(agent.rank) && (
                <img 
                  src={getRankIconUrl(getRankTier(agent.rank) === 'challenger' || getRankTier(agent.rank) === 'grandmaster' ? getRankTier(agent.rank) : getRankTier(agent.rank) + '+')} 
                  alt={getRankTier(agent.rank)}
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
              <span>{agent.rank || 'UNRANKED'}</span>
            </div>
            {agent.date_updated && (
              <p className="text-xs text-gray-500">Updated {new Date(agent.date_updated).toLocaleDateString()}</p>
            )}
          </div>
          
          {/* Availability and region */}
          <div className="space-y-3 text-left w-full">
            <div className="flex items-center gap-2 text-gray-600 text-sm w-full">
              <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#ff8889' }} />
              <span className="truncate flex-1">
                {Array.isArray(agent.availability) ? agent.availability.join(", ") : agent.availability}
              </span>
            </div>
            
            {/* Time (if available) */}
            {agent.time && (
              <div className="flex items-center gap-2 text-gray-600 text-sm w-full">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#00c9ac' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="truncate flex-1">
                  {agent.time.charAt(0).toUpperCase() + agent.time.slice(1)}
                  {agent.timezone && ` (${agent.timezone})`}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-gray-600 text-sm w-full">
              <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="truncate flex-1">{agent.region}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 