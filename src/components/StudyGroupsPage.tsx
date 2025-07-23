import { useState, useEffect } from 'react'
import { HelpCircle } from 'lucide-react'
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom'
import { Footer } from './Footer'
import { GroupsTab } from './GroupsTab'
import { MyGroupsTab } from './MyGroupsTab'
import { FreeAgentsTab } from './FreeAgentsTab'
import { studyGroupService, type StudyGroup, type User, type UserStudyGroup } from '../services/studyGroupService';

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Study Groups Page Component
export function StudyGroupsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active tab from URL path
  const pathSegments = location.pathname.split('/');
  const currentTab = pathSegments[pathSegments.length - 1] as 'groups' | 'my-groups' | 'free-agents';
  const [activeTab, setActiveTab] = useState<'groups' | 'my-groups' | 'free-agents'>(currentTab || 'groups')
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<{ summoner_name: string, elo: number, owner: number }[]>([])
  const [showMembersPopup, setShowMembersPopup] = useState(false)
  const [membersLoading, setMembersLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('')
  const [meetingDayFilter, setMeetingDayFilter] = useState<string>('');
  const [minEloFilter, setMinEloFilter] = useState<number>(0);
  const [maxEloFilter, setMaxEloFilter] = useState<number>(5000);
  
  // Debounced ELO filters to prevent excessive API calls
  const debouncedMinEloFilter = useDebounce(minEloFilter, 1000);
  const debouncedMaxEloFilter = useDebounce(maxEloFilter, 1000);
  const [timezoneFilter, setTimezoneFilter] = useState<string>('');

  // Real data state with caching
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userStudyGroups, setUserStudyGroups] = useState<UserStudyGroup[]>([]);
  const [memberCounts, setMemberCounts] = useState<{ [groupId: number]: number }>({});
  
  // Cache state
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;
  const [hasInitialized, setHasInitialized] = useState(false);
  


  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // State for info modal (open/close, loading, description, instructions, groupId)
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [infoLoading, setInfoLoading] = useState(false)
  const [infoDescription, setInfoDescription] = useState('')
  const [infoInstructions, setInfoInstructions] = useState('')

  // Available meeting days for filtering (matching free agents page)
  const meetingDays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Flexible'
  ];

  // Function to fetch group info and open modal
  const handleOpenInfoModal = async (groupId: number) => {
    setShowInfoPopup(true)
    setInfoLoading(true)
    setInfoDescription('')
    setInfoInstructions('')
    try {
      // Replace with your actual API call
      const groupDetails = await studyGroupService.getStudyGroup(groupId)
      setInfoDescription(groupDetails.description || '')
      setInfoInstructions(groupDetails.application_instructions || '')
    } catch (err) {
      setInfoDescription('Error loading group description.')
      setInfoInstructions('Error loading application instructions.')
    } finally {
      setInfoLoading(false)
    }
  }

  // Initialize search from URL on component mount
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery) {
      setSearchQuery(urlQuery);
      setActiveSearchQuery(urlQuery);
      // The filter effect will automatically trigger when activeSearchQuery changes
    }
  }, [searchParams]);

  // Sync active tab with URL changes
  useEffect(() => {
    const pathSegments = location.pathname.split('/');
    const currentTab = pathSegments[pathSegments.length - 1] as 'groups' | 'my-groups' | 'free-agents';
    
    if (currentTab && ['groups', 'my-groups', 'free-agents'].includes(currentTab)) {
      setActiveTab(currentTab);
    } else {
      // Default to groups if no valid tab in URL
      setActiveTab('groups');
    }
  }, [location.pathname]);

  // Mark as initialized after component mounts
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
    }
  }, []); // Empty dependency array - only run once on mount

  // Fetch study groups when filters change (but only after initialization)
  useEffect(() => {
    if (!hasInitialized) return; // Don't run until after initial load
    
    const fetchStudyGroups = async (isRetry: boolean = false) => {
      // Check if we have valid cached data and no filters are applied
      const isCacheValid = lastFetched && (Date.now() - lastFetched < CACHE_DURATION);
      const hasActiveFilters = activeSearchQuery || meetingDayFilter || debouncedMinEloFilter > 0 || debouncedMaxEloFilter < 5000 || timezoneFilter;
      
  
      
      // Always fetch if any filter is applied
      // This ensures we get fresh data whenever filters change, even if they're empty
      if (isCacheValid && studyGroups.length > 0 && !hasActiveFilters && !isRetry) {
        console.log('Using cached data, skipping fetch');
        return;
      }
      
      // Debug logging
      console.log('Fetching study groups with filters:', {
        activeSearchQuery,
        meetingDayFilter,
        debouncedMinEloFilter,
        debouncedMaxEloFilter,
        timezoneFilter,
        hasActiveFilters,
        isCacheValid
      });
      
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      setHasMore(true);
      
      try {
        const params = {
          page: 1,
          limit: 10,
          search: activeSearchQuery || undefined,
          meeting_days: meetingDayFilter || undefined,
          minEloFilter: debouncedMinEloFilter > 0 ? debouncedMinEloFilter : undefined,
          maxEloFilter: debouncedMaxEloFilter < 5000 ? debouncedMaxEloFilter : undefined,
          timezone: timezoneFilter || undefined,
          sort_by: 'created_at',
          sort_order: 'desc' as const
        };

    

        const response = await studyGroupService.getStudyGroups(params);
        
        setStudyGroups(response.groups);
        setHasMore(response.pagination.has_next);
        setLastFetched(Date.now());

        setRetryCount(0); // Reset retry count on success
        

      } catch (err) {
        console.error('Failed to fetch study groups:', err);
        
        // Try to retry if we haven't exceeded max retries
        if (retryCount < MAX_RETRIES && !isRetry) {
          console.log(`Retrying fetch (${retryCount + 1}/${MAX_RETRIES})...`);
          setRetryCount(prev => prev + 1);
          // Wait a bit before retrying
          setTimeout(() => fetchStudyGroups(true), 2000);
          return;
        }
        
        setError('Failed to load study groups. Please try again later.');
        setRetryCount(0); // Reset retry count
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have initialized (to prevent double fetching on mount)
    if (hasInitialized) {
      fetchStudyGroups();
    }
  }, [activeSearchQuery, meetingDayFilter, debouncedMinEloFilter, debouncedMaxEloFilter, timezoneFilter, hasInitialized]);

  // Load more groups when scrolling
  const loadMoreGroups = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    try {
      const params = {
        page: currentPage + 1,
        limit: 10,
        search: activeSearchQuery || undefined,
        meeting_days: meetingDayFilter || undefined,
        minEloFilter: debouncedMinEloFilter > 0 ? debouncedMinEloFilter : undefined,
        maxEloFilter: debouncedMaxEloFilter < 5000 ? debouncedMaxEloFilter : undefined,
        timezone: timezoneFilter || undefined,
        sort_by: 'created_at',
        sort_order: 'desc' as const
      };

      const response = await studyGroupService.getStudyGroups(params);
      
      setStudyGroups(prev => [...prev, ...response.groups]);
      setCurrentPage(prev => prev + 1);
      setHasMore(response.pagination.has_next);
    } catch (err) {
      console.error('Failed to load more study groups:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Fetch users and user-study-group relationships on mount
  useEffect(() => {
    const fetchUserData = async () => {
      // Check if we have valid cached data
      const isCacheValid = lastFetched && (Date.now() - lastFetched < CACHE_DURATION);
      if (isCacheValid && users.length > 0 && userStudyGroups.length > 0) {
        return;
      }
      
      try {
        const [usersData, userStudyGroupsData] = await Promise.all([
          studyGroupService.getUsers(),
          studyGroupService.getUserStudyGroups()
        ]);
        setUsers(usersData);
        setUserStudyGroups(userStudyGroupsData);
        // Calculate member counts for each study group
        const counts: { [groupId: number]: number } = {};
        userStudyGroupsData.forEach(relationship => {
          const groupId = relationship.study_group_id;
          counts[groupId] = (counts[groupId] || 0) + 1;
        });
        setMemberCounts(counts);
        setLastFetched(Date.now());
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      }
    };
    fetchUserData();
  }, []); // Only run on mount

  // Function to fetch members for a specific study group
  const fetchGroupMembers = async (groupId: number) => {
    // Show modal immediately with loading state
    setSelectedGroupMembers([]);
    setShowMembersPopup(true);
    setMembersLoading(true);
    
    try {
      const groupUsers = await studyGroupService.getStudyGroupUsers(groupId);
      const members = groupUsers.map(relationship => ({
        summoner_name: relationship.summoner_name || 'Unknown User',
        elo: relationship.elo || 0, // Use actual ELO from backend
        rank: relationship.rank || 'UNRANKED', // Use actual rank from backend
        owner: relationship.owner, // Include owner field to identify captain
        icon_id: relationship.icon_id, // Include icon_id for profile images
        user_id: relationship.user_id // Include user_id for profile icon generation
      }));
      

      setSelectedGroupMembers(members);
    } catch (err) {
      console.error('Failed to fetch group members:', err);
      setSelectedGroupMembers([{ summoner_name: 'Error loading members', elo: 0, owner: 0 }]);
    } finally {
      setMembersLoading(false);
    }
  };

  // Update URL when search changes
  const updateSearchInURL = (query: string) => {
    if (query) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  };

  const handleTabChange = (tab: 'groups' | 'my-groups' | 'free-agents') => {
    setActiveTab(tab);
    // Navigate to the sub-route
    navigate(`/study-groups/${tab}`);
  };

  // Retry function for manual retry
  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    setHasInitialized(false);
    // Force a fresh fetch by clearing the cache
    setLastFetched(null);
    // Trigger a new initial fetch
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = {
          page: 1,
          limit: 10,
          sort_by: 'created_at',
          sort_order: 'desc' as const
        };
        
        const response = await studyGroupService.getStudyGroups(params);
        setStudyGroups(response.groups);
        setHasMore(response.pagination.has_next);
        setLastFetched(Date.now());
        setHasInitialized(true);
        setRetryCount(0);
      } catch (err) {
        console.error('Failed to fetch study groups on retry:', err);
        setError('Failed to load study groups. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  };

  return (
    <>
      <div className="min-h-screen bg-white text-gray-800 relative flex flex-col">
        {/* Notebook Lines Background - Full Viewport */}
        <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#F0F3F0' }}>
          <div className="absolute inset-0 opacity-15 dark:opacity-20">
            <svg width="100%" height="100%">
              <pattern id="notebook-lines-study-groups" x="0" y="0" width="100%" height="24" patternUnits="userSpaceOnUse">
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
              <rect width="100%" height="100%" fill="url(#notebook-lines-study-groups)" />
            </svg>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Main Content Container */}
          <div className="container mx-auto px-4 py-6 relative z-10 max-w-7xl">
            {/* Tab Navigation - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
              <div className="flex-1 relative group">
                <button
                  onClick={() => handleTabChange('groups')}
                  className={`w-full py-3 sm:py-2 px-4 rounded-md font-medium transition-colors focus:outline-none border-2 border-transparent text-sm sm:text-base ${
                    activeTab === 'groups'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.border = '2px solid rgb(253, 186, 116)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                >
                  Groups
                </button>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block">
                  <HelpCircle size={16} className="text-gray-400" />
                </div>
                {/* Groups Tab Tooltip - Hidden on mobile */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999] hidden sm:block">
                  <div className="text-center">Browse and join study groups</div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
              
              <div className="flex-1 relative group">
                <button
                  onClick={() => handleTabChange('free-agents')}
                  className={`w-full py-3 sm:py-2 px-4 rounded-md font-medium transition-colors focus:outline-none border-2 border-transparent text-sm sm:text-base ${
                    activeTab === 'free-agents'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.border = '2px solid rgb(253, 186, 116)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                >
                  Free Agents
                </button>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block">
                  <HelpCircle size={16} className="text-gray-400" />
                </div>
                {/* Free Agents Tab Tooltip - Hidden on mobile */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999] hidden sm:block">
                  <div className="text-center">Find players looking for groups</div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
              
              <div className="flex-1 relative group">
                <button
                  onClick={() => handleTabChange('my-groups')}
                  className={`w-full py-3 sm:py-2 px-4 rounded-md font-medium transition-colors focus:outline-none border-2 border-transparent text-sm sm:text-base ${
                    activeTab === 'my-groups'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.border = '2px solid rgb(253, 186, 116)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                >
                  My Groups
                </button>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block">
                  <HelpCircle size={16} className="text-gray-400" />
                </div>
                {/* My Groups Tab Tooltip - Hidden on mobile */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999] hidden sm:block">
                  <div className="text-center">Manage groups you're part of</div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full overflow-hidden">
              {activeTab === 'groups' && (
                <>
                  <GroupsTab
                    studyGroups={studyGroups}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    setActiveSearchQuery={setActiveSearchQuery}
                    updateSearchInURL={updateSearchInURL}
                    meetingDayFilter={meetingDayFilter}
                    setMeetingDayFilter={setMeetingDayFilter}
                    minEloFilter={minEloFilter}
                    setMinEloFilter={setMinEloFilter}
                    maxEloFilter={maxEloFilter}
                    setMaxEloFilter={setMaxEloFilter}
                    timezoneFilter={timezoneFilter}
                    setTimezoneFilter={setTimezoneFilter}
                    meetingDays={meetingDays}
                    showMembersPopup={showMembersPopup}
                    setShowMembersPopup={setShowMembersPopup}
                    selectedGroupMembers={selectedGroupMembers}
                    membersLoading={membersLoading}
                    loading={loading}
                    error={error}
                    memberCounts={memberCounts}
                    fetchGroupMembers={fetchGroupMembers}
                    loadMoreGroups={loadMoreGroups}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onRetry={handleRetry}
                    handleOpenInfoModal={handleOpenInfoModal}
                  />
                  {showInfoPopup && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                      <div className="bg-white rounded-lg p-6 max-w-lg w-full h-96 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">Group Information</h3>
                          <button
                            onClick={() => setShowInfoPopup(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          {infoLoading ? (
                            <div className="flex justify-center items-center py-8">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                <p className="text-gray-600">Loading group details...</p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium text-gray-800 mb-2">Description</h4>
                                <p className="text-gray-700 text-sm">{infoDescription}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-800 mb-2">Application Instructions</h4>
                                <p className="text-gray-700 text-sm">{infoInstructions}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              {activeTab === 'my-groups' && <MyGroupsTab />}
              {activeTab === 'free-agents' && <FreeAgentsTab />}
            </div>
            
            <Footer />
          </div>
        </div>
      </div>
    </>
  )
} 