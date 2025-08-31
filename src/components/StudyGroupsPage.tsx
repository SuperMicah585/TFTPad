import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom'
import { Footer } from './Footer'
import { GroupsTab } from './GroupsTab'
import { MyGroupsTab } from './MyGroupsTab'
import { FreeAgentsTab } from './FreeAgentsTab'
import { studyGroupService, type StudyGroup, type User, type UserStudyGroup } from '../services/studyGroupService';
import { useAuth } from '../contexts/AuthContext';

import { SupabaseLoginModal } from './auth/SupabaseLoginModal';

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

// Groups Page Component
export function StudyGroupsPage() {
  const { userId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active tab from URL path
  const pathSegments = location.pathname.split('/');
  const currentTab = pathSegments[pathSegments.length - 1] as 'groups' | 'my-groups' | 'players';
  const [activeTab, setActiveTab] = useState<'groups' | 'my-groups' | 'players'>(currentTab || 'groups')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('')
  const [minEloFilter, setMinEloFilter] = useState<number>(0);
  const [maxEloFilter, setMaxEloFilter] = useState<number>(5000);
  
  // Debounced ELO filters to prevent excessive API calls
  const debouncedMinEloFilter = useDebounce(minEloFilter, 1000);
  const debouncedMaxEloFilter = useDebounce(maxEloFilter, 1000);
  
  // Track when filters are cleared to force immediate re-fetch
  const [filtersCleared, setFiltersCleared] = useState<boolean>(false);
  
  // Wrapper functions for setting ELO filters
  const handleSetMinEloFilter = (value: number) => {
    setMinEloFilter(value);
    // If setting to 0 (clearing), mark as cleared
    if (value === 0) {
      setFiltersCleared(true);
    }
  };
  
  const handleSetMaxEloFilter = (value: number) => {
    setMaxEloFilter(value);
    // If setting to 5000 (clearing), mark as cleared
    if (value === 5000) {
      setFiltersCleared(true);
    }
  };
  
  // Function to clear all filters at once
  const clearAllFilters = () => {
    setMinEloFilter(0);
    setMaxEloFilter(5000);
    setFiltersCleared(true);
  };

  // Free Agents filter state
  const [minRankFilter, setMinRankFilter] = useState<string>("IRON");
  const [maxRankFilter, setMaxRankFilter] = useState<string>("CHALLENGER");
  const [regionFilter, setRegionFilter] = useState<string>("");

  // Real data state with caching
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userStudyGroups, setUserStudyGroups] = useState<UserStudyGroup[]>([]);
  const [memberCounts, setMemberCounts] = useState<{ [groupId: number]: number }>({});
  
  // Cache state
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;
  const [hasInitialized, setHasInitialized] = useState(false);
  


  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  




  // Login modal state
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Sort state - default to ELO descending for groups
  const [sortBy] = useState<'created_at' | 'avg_elo'>('avg_elo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Track previous sort values to detect changes
  const [prevSortBy, setPrevSortBy] = useState<'created_at' | 'avg_elo'>('avg_elo');
  const [prevSortOrder, setPrevSortOrder] = useState<'asc' | 'desc'>('desc');
  




  // Initialize search from URL on component mount
  useEffect(() => {
    const urlQuery = searchParams.get('groups_q');
    if (urlQuery) {
      setSearchQuery(urlQuery);
      setActiveSearchQuery(urlQuery);
      // The filter effect will automatically trigger when activeSearchQuery changes
    }
  }, [searchParams]);

  // Sync active tab with URL changes
  useEffect(() => {
    const pathSegments = location.pathname.split('/');
    const currentTab = pathSegments[pathSegments.length - 1] as 'groups' | 'my-groups' | 'players';
    
    if (currentTab && ['groups', 'my-groups', 'players'].includes(currentTab)) {
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

          // Fetch groups when filters change (but only after initialization)
  useEffect(() => {
    if (!hasInitialized) return; // Don't run until after initial load
    
    const fetchStudyGroups = async (isRetry: boolean = false) => {
      // Check if we have valid cached data and no filters are applied
      const isCacheValid = lastFetched && (Date.now() - lastFetched < CACHE_DURATION);
      const hasActiveFilters = activeSearchQuery || debouncedMinEloFilter !== 0 || debouncedMaxEloFilter !== 5000;
      
      // Check if sorting has actually changed from previous values
      const hasSortingChanged = sortBy !== prevSortBy || sortOrder !== prevSortOrder;
      
  
      
      // Always fetch if any filter is applied, if sorting has changed, or if filters were just cleared
      // This ensures we get fresh data whenever filters change, even if they're empty
      if (isCacheValid && studyGroups.length > 0 && !hasActiveFilters && !hasSortingChanged && !filtersCleared && !isRetry) {
        return;
      }
      
      
      
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      setHasMore(true);
      
      try {
        const params = {
          page: 1,
          limit: 10,
          search: activeSearchQuery || undefined,
          minEloFilter: debouncedMinEloFilter,
          maxEloFilter: debouncedMaxEloFilter,
          sort_by: sortBy,
          sort_order: sortOrder
        };

    

        const response = await studyGroupService.getStudyGroups(params);
        
        setStudyGroups(response.groups);
        setHasMore(response.pagination.has_next);
        setLastFetched(Date.now());
        
        // Update previous sort values after successful fetch
        setPrevSortBy(sortBy);
        setPrevSortOrder(sortOrder);

        setRetryCount(0); // Reset retry count on success
        setFiltersCleared(false); // Reset filters cleared flag
        

      } catch (err) {
        console.error('Failed to fetch groups:', err);
        
        // Try to retry if we haven't exceeded max retries
        if (retryCount < MAX_RETRIES && !isRetry) {
  
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
  }, [activeSearchQuery, debouncedMinEloFilter, debouncedMaxEloFilter, sortBy, sortOrder, hasInitialized, filtersCleared]);

  // Load more groups when scrolling
  const loadMoreGroups = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    try {
      const params = {
        page: currentPage + 1,
        limit: 10,
        search: activeSearchQuery || undefined,
        minEloFilter: debouncedMinEloFilter,
        maxEloFilter: debouncedMaxEloFilter,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      const response = await studyGroupService.getStudyGroups(params);
      
      setStudyGroups(prev => [...prev, ...response.groups]);
      setCurrentPage(prev => prev + 1);
      setHasMore(response.pagination.has_next);
    } catch (err) {
      console.error('Failed to load more groups:', err);
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

  // Update URL when search changes
  const updateSearchInURL = (query: string) => {
    if (query) {
      setSearchParams({ groups_q: query });
    } else {
      setSearchParams({});
    }
  };



  // Redirect non-logged-in users away from my-groups tab if they navigate directly to the URL
  useEffect(() => {
    if (activeTab === 'my-groups' && !userId) {
      setActiveTab('groups');
              navigate('/groups');
      setShowLoginModal(true);
    }
  }, [activeTab, userId, navigate]);

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
        console.error('Failed to fetch groups on retry:', err);
        setError('Failed to load groups. Please try again later.');
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
              <pattern id="notebook-lines-groups" x="0" y="0" width="100%" height="24" patternUnits="userSpaceOnUse">
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
              <rect width="100%" height="100%" fill="url(#notebook-lines-groups)" />
            </svg>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Main Content Container */}
          <div className="container mx-auto px-4 py-6 relative z-10 max-w-7xl">


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
                    minEloFilter={minEloFilter}
                    setMinEloFilter={handleSetMinEloFilter}
                    maxEloFilter={maxEloFilter}
                    setMaxEloFilter={handleSetMaxEloFilter}
                    onClearFilters={clearAllFilters}
                    loading={loading}
                    error={error}
                    memberCounts={memberCounts}
                    loadMoreGroups={loadMoreGroups}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onRetry={handleRetry}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                  />

                </>
              )}
              {activeTab === 'my-groups' && userId && <MyGroupsTab />}
              {activeTab === 'my-groups' && !userId && (
                <div className="p-8 text-center">
                  <div className="text-gray-500 mb-4">
                    <Users className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Login Required</h3>
                    <p className="text-gray-600">You need to be logged in to view your groups.</p>
                  </div>
                </div>
              )}
                              {activeTab === 'players' && (
                <FreeAgentsTab
                  minRankFilter={minRankFilter}
                  setMinRankFilter={setMinRankFilter}
                  maxRankFilter={maxRankFilter}
                  setMaxRankFilter={setMaxRankFilter}
                  regionFilter={regionFilter}
                  setRegionFilter={setRegionFilter}
                />
              )}
            </div>
            
            <Footer />
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      <SupabaseLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  )
} 