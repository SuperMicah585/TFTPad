import { useState, useEffect } from 'react'
import { Users, Globe, Calendar, ArrowRight, Zap, SquareX, Clock } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { freeAgentService, type FreeAgent, type FreeAgentFilters } from '../services/freeAgentService'
import { studyGroupService } from '../services/studyGroupService'
import { studyGroupInviteService } from '../services/studyGroupInviteService'
import { useAuth } from '../contexts/AuthContext'
import { riotService } from '../services/riotService'
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";
import { FaSearch } from "react-icons/fa";
import { LoadingSpinner } from './auth/LoadingSpinner'



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





// Custom Sort Dropdown Component
function SortDropdown({ 
    sortBy, 
    sortOrder, 
    onSortByChange, 
    onSortOrderChange 
}: { 
    sortBy: 'created_at' | 'elo'; 
    sortOrder: 'asc' | 'desc'; 
    onSortByChange: (sortBy: 'created_at' | 'elo') => void; 
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
            case 'elo': return 'ELO Rating';
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
                className="bg-white border-2 border-gray-300 text-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 hover:border-gray-400 transition-colors font-medium text-sm min-w-40 flex items-center justify-between shadow-lg"
            >
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    <span>{getSortByLabel(sortBy)} {getSortOrderIcon(sortOrder)}</span>
                </div>
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-48">
                    <div className="p-2">
                        <div className="text-xs font-semibold text-gray-600 mb-2 px-2">Sort By</div>
                        <div className="space-y-1">
                            <button
                                onClick={() => {
                                    onSortByChange('created_at');
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100 ${
                                    sortBy === 'created_at' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                            >
                                Date Created
                            </button>
                            <button
                                onClick={() => {
                                    onSortByChange('elo');
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100 ${
                                    sortBy === 'elo' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                            >
                                ELO Rating
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
                                    className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100 ${
                                        sortOrder === 'desc' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                    }`}
                                >
                                    ↓ Descending
                                </button>
                                <button
                                    onClick={() => {
                                        onSortOrderChange('asc');
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100 ${
                                        sortOrder === 'asc' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                    }`}
                                >
                                    ↑ Ascending
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
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





interface FreeAgentsTabProps {
  minRankFilter?: string;
  setMinRankFilter?: (filter: string) => void;
  maxRankFilter?: string;
  setMaxRankFilter?: (filter: string) => void;
  availabilityDaysFilter?: string[];
  setAvailabilityDaysFilter?: (filter: string[] | ((prev: string[]) => string[])) => void;
  availabilityTimeFilter?: string;
  setAvailabilityTimeFilter?: (filter: string) => void;
  availabilityTimezoneFilter?: string;
  setAvailabilityTimezoneFilter?: (filter: string) => void;
  regionFilter?: string;
  setRegionFilter?: (filter: string) => void;
}

export function FreeAgentsTab({
  minRankFilter: propMinRankFilter,
  setMinRankFilter: propSetMinRankFilter,
  maxRankFilter: propMaxRankFilter,
  setMaxRankFilter: propSetMaxRankFilter,
  availabilityDaysFilter: propAvailabilityDaysFilter,
  setAvailabilityDaysFilter: propSetAvailabilityDaysFilter,
  availabilityTimeFilter: propAvailabilityTimeFilter,
  setAvailabilityTimeFilter: propSetAvailabilityTimeFilter,
  availabilityTimezoneFilter: propAvailabilityTimezoneFilter,
  setAvailabilityTimezoneFilter: propSetAvailabilityTimezoneFilter,
  regionFilter: propRegionFilter,
  setRegionFilter: propSetRegionFilter,
}: FreeAgentsTabProps = {}) {
  const { userId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

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





  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  // Use props if provided, otherwise use local state
  const [localMinRankFilter, setLocalMinRankFilter] = useState("iron+");
  const [localMaxRankFilter, setLocalMaxRankFilter] = useState("challenger");
  const [localAvailabilityDaysFilter, setLocalAvailabilityDaysFilter] = useState<string[]>([]);
  const [localAvailabilityTimeFilter, setLocalAvailabilityTimeFilter] = useState("");
  const [localAvailabilityTimezoneFilter, setLocalAvailabilityTimezoneFilter] = useState("");

  const minRankFilter = propMinRankFilter ?? localMinRankFilter;
  const setMinRankFilter = propSetMinRankFilter ?? setLocalMinRankFilter;
  const maxRankFilter = propMaxRankFilter ?? localMaxRankFilter;
  const setMaxRankFilter = propSetMaxRankFilter ?? setLocalMaxRankFilter;
  const availabilityDaysFilter = propAvailabilityDaysFilter ?? localAvailabilityDaysFilter;
  const setAvailabilityDaysFilter = propSetAvailabilityDaysFilter ?? setLocalAvailabilityDaysFilter;
  const availabilityTimeFilter = propAvailabilityTimeFilter ?? localAvailabilityTimeFilter;
  const setAvailabilityTimeFilter = propSetAvailabilityTimeFilter ?? setLocalAvailabilityTimeFilter;
  const availabilityTimezoneFilter = propAvailabilityTimezoneFilter ?? localAvailabilityTimezoneFilter;
  const setAvailabilityTimezoneFilter = propSetAvailabilityTimezoneFilter ?? setLocalAvailabilityTimezoneFilter;
  
  const [localRegionFilter, setLocalRegionFilter] = useState("");
  const regionFilter = propRegionFilter ?? localRegionFilter;
  const setRegionFilter = propSetRegionFilter ?? setLocalRegionFilter;

  // Sort state
  const [sortBy, setSortBy] = useState<'created_at' | 'elo'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
    const urlQuery = searchParams.get('free_agents_q');
    if (urlQuery) {
      setSearchQuery(urlQuery);
      setActiveSearchQuery(urlQuery);
    }
  }, [searchParams]);

  // Update URL when search changes
  const updateSearchInURL = (query: string) => {
    if (query) {
      setSearchParams({ free_agents_q: query });
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
      sort_by: sortBy,
      sort_order: sortOrder
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
    setSortBy('created_at');
    setSortOrder('desc');
  };

  // Single effect to handle all data fetching - initial load and filter changes
  useEffect(() => {
    if (hasInitialized) {
      applyFilters();
    }
  }, [hasInitialized, activeSearchQuery, minRankFilter, maxRankFilter, availabilityDaysFilter, availabilityTimeFilter, availabilityTimezoneFilter, regionFilter, sortBy, sortOrder]);

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
              </div>

            </div>
          </div>

          {/* Filter Controls */}
          <div className="mb-4 mt-2 relative">
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="flex flex-col items-center mb-2">
      
            </div>
            <div className="space-y-3">
              {/* Sort and Filter Controls */}
              <div className="flex flex-row gap-2 items-center w-full">
                <SortDropdown
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortByChange={setSortBy}
                  onSortOrderChange={setSortOrder}
                />
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
              
              {/* Search Input */}
              <div className="flex flex-row gap-2 items-center w-full">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      setActiveSearchQuery(searchQuery);
                      updateSearchInURL(searchQuery);
                    }
                  }}
                  className="flex-1 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#007460] focus:ring-2 focus:ring-[#007460] text-sm"
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
          </div>

          {loading ? (
            <div className="text-center flex-1 flex flex-col items-center justify-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Free Agents</h3>
              <p className="text-gray-600">Please wait while we fetch available players...</p>
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
            <div className="text-center flex-1 flex flex-col items-center justify-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Free Agents Found</h3>
              <p className="text-gray-600">No players match your current filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
              {freeAgents.map((agent: FreeAgent) => (
                <FreeAgentCard 
                  key={agent.id} 
                  agent={agent} 
                />
              ))}
            </div>
          )}

          {freeAgents.length > 0 && (
            <div className="text-center mt-8 mb-4">
              {pagination && pagination.has_next && (
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
                      <LoadingSpinner size="sm" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              )}
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
                className="p-0 bg-transparent border-none w-10 h-10 flex items-center justify-center group hover:bg-transparent"
                style={{ lineHeight: 0 }}
              >
                <SquareX className="w-10 h-10 text-black group-hover:opacity-80 transition-opacity" />
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


      {!loading && !error && !hasMore && freeAgents.length > 0 && (
        <div className="text-center py-8 mt-8 w-full">
          <p className="text-gray-500 text-sm">No more players to load</p>
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
                    <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">{day}</span>
                  </label>
                ))}
              </div>
            </div>
            <hr className="my-4 border-gray-200" />
            <div className="mb-4">
              <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm sm:text-base">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#facc15' }} />
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
              <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm sm:text-base">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#00c9ac' }} />
                Timezone
              </h4>
              <select
                value={availabilityTimezoneFilter}
                onChange={e => setAvailabilityTimezoneFilter(e.target.value)}
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
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm sm:text-base">
                  <Clock className="w-4 h-4" style={{ color: '#00c9ac' }} />
                  Time Preference
                </h4>
                <select
                  value={availabilityTimeFilter}
                  onChange={e => setAvailabilityTimeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-[#007460] focus:ring-2 focus:ring-[#007460] text-sm"
                >
                  <option value="">Any Time</option>
                  <option value="mornings">Mornings</option>
                  <option value="afternoons">Afternoons</option>
                  <option value="evenings">Evenings</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
              <div>
                <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm sm:text-base">
                  <Globe className="w-4 h-4 text-blue-500" />
                  Region
                </h4>
                <select
                  value={regionFilter}
                  onChange={e => setRegionFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-[#007460] focus:ring-2 focus:ring-[#007460] text-sm"
                >
                  <option value="">All Regions</option>
                  {availableRegions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
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
    </>
  )
}

// Free Agent Card Component
function FreeAgentCard({ 
  agent
}: { 
  agent: FreeAgent
}) {
  const navigate = useNavigate();
  
  return (
    <div 
      className="border-2 rounded-lg p-4 hover:shadow-xl transition-all duration-200 shadow-md backdrop-blur-sm flex flex-col cursor-pointer group relative h-full bg-gray-50 border-gray-200" 
      onClick={() => navigate(`/study-groups/free-agents/${agent.id}`)}
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