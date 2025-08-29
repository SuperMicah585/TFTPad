import { useState, useEffect, useCallback, useRef } from 'react';

import { matchHistoryService } from '../services/matchHistoryService';
import type { MatchHistoryEntry as ApiMatchHistoryEntry } from '../services/matchHistoryService';

// Local interface for the component's simplified data structure
interface MatchHistoryEntry {
  matchId: string;
  timestamp: number;
  placement: number;
  gameLength: number;
  champions: string[];
}

// Global cache to prevent multiple components from loading the same riot account's data
const globalLoadingCache = new Set<string>();
const globalDataCache = new Map<string, MatchHistoryEntry[]>();

interface PlacementHistoryProps {
  riotId: string;
  className?: string;
}

// Placement colors based on placement (1st = gold, 2nd = silver, etc.)
const getPlacementColor = (placement: number): string => {
  switch (placement) {
    case 1: return 'bg-yellow-400'; // Gold
    case 2: return 'bg-gray-300';   // Silver
    case 3: return 'bg-amber-600';  // Bronze
    case 4: return 'bg-green-500';  // Green
    case 5: return 'bg-blue-500';   // Blue
    case 6: return 'bg-purple-500'; // Purple
    case 7: return 'bg-red-500';    // Red
    case 8: return 'bg-gray-600';   // Dark gray
    default: return 'bg-gray-400';  // Default gray
  }
};

export function PlacementHistory({ riotId, className = '' }: PlacementHistoryProps) {
  const [matches, setMatches] = useState<MatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const hasLoadedRef = useRef<Set<string>>(new Set());
  const instanceId = useRef(Math.random().toString(36).substr(2, 9));
  
  console.log('🎨 PlacementHistory: Component rendered - riotId:', riotId, 'instanceId:', instanceId.current);

  // Fetch match history with retry logic
  const fetchMatchHistoryWithRetry = useCallback(async (puuid: string, region: string = 'americas'): Promise<ApiMatchHistoryEntry[]> => {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 PlacementHistory: Attempt ${attempt} to fetch match history for puuid: ${puuid}`);
        const matches = await matchHistoryService.getMatchHistory(puuid, region);
        console.log(`✅ PlacementHistory: Successfully fetched ${matches.length} matches on attempt ${attempt}`);
        return matches;
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ PlacementHistory: Attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Failed to fetch match history after all retries');
  }, []);

  const loadMatchHistory = useCallback(async () => {
    // Check global cache first
    if (globalDataCache.has(riotId)) {
      console.log('📦 PlacementHistory: Using cached data for riotId:', riotId, 'instanceId:', instanceId.current);
      setMatches(globalDataCache.get(riotId)!);
      hasLoadedRef.current.add(riotId);
      return;
    }
    
    if (!riotId || loadingRef.current || hasLoadedRef.current.has(riotId) || globalLoadingCache.has(riotId)) {
      console.log('🚫 PlacementHistory: Skipping load - riotId:', riotId, 'loadingRef.current:', loadingRef.current, 'hasLoaded:', hasLoadedRef.current.has(riotId), 'globalLoading:', globalLoadingCache.has(riotId), 'instanceId:', instanceId.current);
      return;
    }
    
    console.log('🔄 PlacementHistory: Starting API call for riotId:', riotId, 'instanceId:', instanceId.current);
    loadingRef.current = true;
    globalLoadingCache.add(riotId);
    setLoading(true);
    setError(null);
    
    // Add a small delay to handle React Strict Mode double-invocation
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Double-check after the delay to prevent race conditions
    if (hasLoadedRef.current.has(riotId) || globalDataCache.has(riotId)) {
      console.log('🚫 PlacementHistory: Skipping load after delay - riotId already loaded:', riotId, 'instanceId:', instanceId.current);
      setLoading(false);
      loadingRef.current = false;
      globalLoadingCache.delete(riotId);
      return;
    }

    try {
      // Fetch match history with retry logic using the provided riotId
      // For now, assume NA region - this could be enhanced to accept region as a prop
      const matchHistory = await fetchMatchHistoryWithRetry(riotId, 'na1');
      
      // Take only the last 20 matches and transform to the expected format
      const last20Matches = matchHistory.slice(0, 20).map(match => ({
        matchId: match.matchId,
        timestamp: match.gameCreation,
        placement: match.placement,
        gameLength: match.gameLength,
        champions: match.champions.map(champ => champ.name)
      }));
      setMatches(last20Matches);
      hasLoadedRef.current.add(riotId);
      globalDataCache.set(riotId, last20Matches);
      globalLoadingCache.delete(riotId);
      console.log('✅ PlacementHistory: Successfully loaded', last20Matches.length, 'matches for riotId:', riotId, 'instanceId:', instanceId.current);
    } catch (err) {
      console.error('❌ PlacementHistory: Error loading match history:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load match history';
      
      // Provide user-friendly error messages
      if (errorMessage.includes('429')) {
        setError('Rate limit exceeded. Please try again in a few minutes.');
      } else if (errorMessage.includes('404')) {
        setError('No match history found for this account.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
      globalLoadingCache.delete(riotId);
    }
  }, [riotId]); // Removed fetchMatchHistoryWithRetry dependency since it's stable

  // Track previous riotId to detect changes
  const prevRiotIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    console.log('🎯 PlacementHistory: useEffect triggered - riotId:', riotId, 'instanceId:', instanceId.current);
    
    // If riotId changed, clear the hasLoaded set for the previous riotId
    if (prevRiotIdRef.current !== null && prevRiotIdRef.current !== riotId) {
      console.log('🔄 PlacementHistory: RiotId changed, clearing hasLoaded for previous riotId:', prevRiotIdRef.current, 'instanceId:', instanceId.current);
      hasLoadedRef.current.delete(prevRiotIdRef.current);
    }
    
    prevRiotIdRef.current = riotId;
    
    // Early return if already loaded or loading
    if (!riotId || hasLoadedRef.current.has(riotId) || loadingRef.current) {
      console.log('🚫 PlacementHistory: useEffect early return - riotId:', riotId, 'hasLoaded:', hasLoadedRef.current.has(riotId), 'loading:', loadingRef.current, 'instanceId:', instanceId.current);
      return;
    }
    
    if (riotId) {
      loadMatchHistory();
    }
    
    // Cleanup function to reset loading state when component unmounts or riotId changes
    return () => {
      console.log('🧹 PlacementHistory: Cleanup - resetting loadingRef, instanceId:', instanceId.current);
      loadingRef.current = false;
    };
  }, [riotId, loadMatchHistory]);

  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 border border-gray-200 ${className}`}>
        <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-xs">
          <div className="w-5 h-5 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          Last 20 Games
        </h5>
        
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: 20 }, (_, index) => (
            <div
              key={`loading-${index}`}
              className="w-6 h-6 bg-gray-200 rounded animate-pulse flex items-center justify-center"
            >
              <div className="w-2 h-2 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-2 border-t border-gray-200 text-center">
          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
          <div className="w-12 h-6 bg-gray-200 rounded animate-pulse mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 border border-gray-200 ${className}`}>
        <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-xs">
          <div className="w-5 h-5 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          Last 20 Games
        </h5>
        <div className="text-center py-4">
          <p className="text-red-600 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 border border-gray-200 ${className}`}>
        <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-xs">
          <div className="w-5 h-5 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          Last 20 Games
        </h5>
        <div className="text-center py-4">
          <p className="text-gray-600 text-xs">No match history available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 rounded-lg p-4 border border-gray-200 ${className}`}>
      <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-xs">
        <div className="w-5 h-5 bg-blue-500 rounded-lg flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        Last 20 Games
      </h5>
      
      <div className="grid grid-cols-10 gap-1">
        {matches.map((match, index) => (
          <div
            key={match.matchId}
            className={`w-6 h-6 ${getPlacementColor(match.placement)} rounded flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-110 transition-transform`}
            title={`Game ${index + 1}: ${match.placement}${getOrdinalSuffix(match.placement)} place`}
          >
            {match.placement}
          </div>
        ))}
        
        {/* Fill remaining slots with empty squares if less than 20 games */}
        {Array.from({ length: Math.max(0, 20 - matches.length) }, (_, index) => (
          <div
            key={`empty-${index}`}
            className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs"
          >
            -
          </div>
        ))}
      </div>
      
      {matches.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-600 mb-1">Average Placement</p>
          <p className="font-bold text-gray-800 text-lg">
            {(matches.reduce((sum, match) => sum + match.placement, 0) / matches.length).toFixed(1)}
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to get ordinal suffix
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
}
