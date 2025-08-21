// import React from 'react'; // Not used
import { useOptimizedTeamStats } from '../hooks/useOptimizedTeamStats';
import { LoadingSpinner } from './auth/LoadingSpinner';

interface OptimizedTeamStatsExampleProps {
  groupId: number;
  startDate: string;
  includeLiveData?: boolean;
}

export function OptimizedTeamStatsExample({ 
  groupId, 
  startDate, 
  includeLiveData = false 
}: OptimizedTeamStatsExampleProps) {
  const {
    events,
    memberNames,
    liveData,
    // members, // Not used
    isLoading,
    isLiveDataLoading,
    error,
    liveDataError,
    refresh,
    refreshLiveData,
    clearCache,
    cacheStats
  } = useOptimizedTeamStats({
    groupId,
    startDate,
    includeLiveData,
    autoRefresh: includeLiveData, // Auto-refresh live data if included
    refreshInterval: 2 * 60 * 1000 // 2 minutes
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="md" className="mx-auto mb-2" />
        <p className="text-gray-500">Loading team stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600 mb-2">{error}</p>
        <button 
          onClick={refresh}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cache Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-2">Cache Information</h3>
        <div className="text-sm text-gray-600">
          <p>Cache size: {cacheStats.size}</p>
          <p>Cached keys: {cacheStats.keys.length}</p>
        </div>
        <div className="mt-2 space-x-2">
          <button 
            onClick={refresh}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
          <button 
            onClick={clearCache}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
          >
            Clear Cache
          </button>
        </div>
      </div>

      {/* Live Data Section */}
      {includeLiveData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-blue-800">Live Data</h3>
            {isLiveDataLoading && <LoadingSpinner size="sm" />}
          </div>
          
          {liveDataError && (
            <p className="text-red-600 text-sm mb-2">{liveDataError}</p>
          )}
          
          <div className="space-y-2">
            {Object.entries(liveData).map(([summonerName, data]) => (
              <div key={summonerName} className="bg-white rounded p-2 text-sm">
                <p className="font-medium">{summonerName}</p>
                <p className="text-gray-600">
                  {data.tier} {data.rank} {data.leaguePoints}LP - ELO: {data.elo}
                </p>
                <p className="text-gray-500">
                  Wins: {data.wins} | Losses: {data.losses}
                </p>
              </div>
            ))}
          </div>
          
          <button 
            onClick={refreshLiveData}
            className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Live Data
          </button>
        </div>
      )}

      {/* Team Stats Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-800 mb-2">Team Stats Summary</h3>
        <div className="text-sm text-green-700">
          <p>Total events: {events.length}</p>
          <p>Members: {Object.keys(memberNames).length}</p>
          <p>Live data entries: {Object.keys(liveData).length}</p>
        </div>
      </div>

      {/* Member Names */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">Member Names</h3>
        <div className="text-sm text-yellow-700">
          {Object.entries(memberNames).map(([riotId, name]) => (
            <div key={riotId} className="mb-1">
              <span className="font-medium">{name}</span>
              <span className="text-yellow-600"> ({riotId})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
