import { useState, useEffect } from 'react'

import { useSearchParams } from 'react-router-dom'
import { Footer } from './Footer'
import { GroupsTab } from './GroupsTab'
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

// Groups Page Component
export function GroupsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
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


  // Real data state with caching
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);

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

  // Placeholder state for count-first loading
  const [placeholderCount, setPlaceholderCount] = useState(0);
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [isCountLoading, setIsCountLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);

  


  // Available meeting days for filtering


  // Sort state - only ELO sorting for groups
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Track previous sort values to detect changes
  const [prevSortOrder, setPrevSortOrder] = useState<'asc' | 'desc'>('desc');



  // Initialize search from URL on component mount
  useEffect(() => {
    const urlQuery = searchParams.get('groups_q');
    if (urlQuery) {
      setSearchQuery(urlQuery);
      setActiveSearchQuery(urlQuery);
    }
  }, [searchParams]);

  // Mark as initialized after component mounts
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
    }
  }, []);

          // Fetch groups when filters change
  useEffect(() => {
    if (!hasInitialized) return;
    
    const fetchStudyGroups = async (isRetry: boolean = false) => {
      const isCacheValid = lastFetched && (Date.now() - lastFetched < CACHE_DURATION);
      const hasActiveFilters = activeSearchQuery || debouncedMinEloFilter !== 0 || debouncedMaxEloFilter !== 5000;
      const hasSortingChanged = sortOrder !== prevSortOrder;
      
      if (isCacheValid && studyGroups.length > 0 && !hasActiveFilters && !hasSortingChanged && !filtersCleared && !isRetry) {
        return;
      }
      
      // Start count loading phase
      setIsCountLoading(true);
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
          sort_by: 'avg_elo',
          sort_order: sortOrder
        };

        const response = await studyGroupService.getStudyGroups(params);
        
        // Get total count from pagination metadata
        const totalCount = response.pagination.total_items;
        
        // Set placeholder count and show placeholders
        setPlaceholderCount(Math.min(totalCount, 10)); // Show max 10 placeholders for first page
        setShowPlaceholders(true);
        setIsCountLoading(false);
        
        // Start data loading phase
        setIsDataLoading(true);
        
        // Simulate a small delay to show placeholders briefly
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setStudyGroups(response.groups);
        setHasMore(response.pagination.has_next);
        setLastFetched(Date.now());
        
        setPrevSortOrder(sortOrder);
        setRetryCount(0);
        setFiltersCleared(false); // Reset filters cleared flag
        
        // Hide placeholders and finish loading
        setShowPlaceholders(false);
        setIsDataLoading(false);

      } catch (err) {
        console.error('Failed to fetch groups:', err);
        
        if (retryCount < MAX_RETRIES && !isRetry) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => fetchStudyGroups(true), 2000);
          return;
        }
        
        setError('Failed to load groups. Please try again later.');
        setRetryCount(0);
        setIsCountLoading(false);
        setIsDataLoading(false);
        setShowPlaceholders(false);
      }
    };

    if (hasInitialized) {
      fetchStudyGroups();
    }
  }, [activeSearchQuery, debouncedMinEloFilter, debouncedMaxEloFilter, sortOrder, hasInitialized, filtersCleared]);

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
        sort_by: 'avg_elo',
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
  }, []);

  // Update URL when search changes
  const updateSearchInURL = (query: string) => {
    if (query) {
      setSearchParams({ groups_q: query });
    } else {
      setSearchParams({});
    }
  };

  // Retry function for manual retry
  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    setHasInitialized(false);
    setLastFetched(null);
    const fetchInitialData = async () => {
      try {
        setError(null);
        
        const params = {
          page: 1,
          limit: 10,
          sort_by: 'avg_elo',
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
                loading={isCountLoading || isDataLoading}
                error={error}
                memberCounts={memberCounts}
                loadMoreGroups={loadMoreGroups}
                hasMore={hasMore}
                loadingMore={loadingMore}
                onRetry={handleRetry}

                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                placeholderCount={placeholderCount}
                showPlaceholders={showPlaceholders}
                isCountLoading={isCountLoading}
              />

            </div>
            
            <Footer />
          </div>
        </div>
      </div>
    </>
  )
}
