import { Star, TrendingUp, TrendingDown } from 'lucide-react';
import { LoadingSpinner } from './auth/LoadingSpinner';
import type { RankAuditEvent } from '../services/teamStatsService';
import type { LivePlayerData } from '../services/livePlayerService';

interface TeamStatsSummaryProps {
  teamStatsData: RankAuditEvent[];
  teamStatsLoading: boolean;
  teamStatsError: string | null;
  memberNames: { [riotId: string]: string };
  liveData: { [summonerName: string]: LivePlayerData };
  liveDataLoading: boolean;
  className?: string;
}

export function TeamStatsSummary({
  teamStatsData,
  teamStatsLoading,
  teamStatsError,
  memberNames,
  liveData,
  liveDataLoading,
  className = ''
}: TeamStatsSummaryProps) {
  // Calculate current team stats
  const calculateCurrentTeamStats = () => {
    const hasHistoricData = teamStatsData && teamStatsData.length > 0;
    const hasLiveData = liveData && Object.keys(liveData).length > 0;
    
    if (!hasHistoricData && !hasLiveData) {
      return null;
    }

    // Get the most recent data point for each member
    const memberLatestData: { [summonerName: string]: any } = {};
    
    // Group data by member (only if historic data exists)
    const groupedData: { [summonerName: string]: RankAuditEvent[] } = {};
    if (hasHistoricData) {
      teamStatsData.forEach(event => {
        const summonerName = memberNames[event.riot_id] || event.riot_id;
        if (!groupedData[summonerName]) {
          groupedData[summonerName] = [];
        }
        groupedData[summonerName].push(event);
      });
    }

    // Get latest data for each member (only if historic data exists)
    if (hasHistoricData) {
      Object.keys(groupedData).forEach(summonerName => {
        const events = groupedData[summonerName];
        const latestEvent = events.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        memberLatestData[summonerName] = latestEvent;
      });
    }

    // Add live data if available (this will override historical data or be the only data)
    if (hasLiveData) {
      Object.keys(liveData).forEach(summonerName => {
        memberLatestData[summonerName] = liveData[summonerName];
      });
    }

    // Calculate totals
    const members = Object.values(memberLatestData);
    if (members.length === 0) return null;

    const totalElo = members.reduce((sum, member) => sum + (member.elo || 0), 0);
    const averageElo = Math.round(totalElo / members.length);
    
    // Prioritize live data for wins and losses
    const totalWins = members.reduce((sum, member) => {
      // Use live data wins if available, otherwise use historical data
      return sum + (member.wins || 0);
    }, 0);
    
    const totalLosses = members.reduce((sum, member) => {
      // Use live data losses if available, otherwise use historical data
      return sum + (member.losses || 0);
    }, 0);
    
    const winRate = totalWins + totalLosses > 0 
      ? ((totalWins / (totalWins + totalLosses)) * 100).toFixed(1)
      : '0.0';

    // Calculate member count from the total study group members
    const totalMemberCount = Object.keys(memberNames).length;

    return {
      averageElo,
      totalWins,
      totalLosses,
      winRate,
      memberCount: totalMemberCount
    };
  };

  const currentStats = calculateCurrentTeamStats();

  if (teamStatsLoading || liveDataLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="md" className="mx-auto mb-2" />
            <p className="text-gray-500">Loading team stats...</p>
          </div>
        </div>
      </div>
    );
  }

  if (teamStatsError) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">
            {teamStatsError.includes('500') || teamStatsError.includes('INTERNAL SERVER ERROR') 
              ? "Not enough data available yet. Team stats will appear once members have played games after the group was created."
              : teamStatsError}
          </p>
        </div>
      </div>
    );
  }

  if (!currentStats) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">No team stats data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Team Stats Summary */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-xs">
          <div className="w-5 h-5 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-3 h-3 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          Team Summary
        </h5>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-xs text-gray-600">ELO</p>
            </div>
            <p className="font-bold text-gray-800 text-lg">{currentStats.averageElo}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-3 h-3 text-yellow-600" fill="currentColor" />
              <p className="text-xs text-gray-600">Members</p>
            </div>
            <p className="font-bold text-gray-800 text-lg">{currentStats.memberCount}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <p className="text-xs text-gray-600">Wins</p>
            </div>
            <p className="font-bold text-gray-800 text-lg">{currentStats.totalWins}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="w-3 h-3 text-red-600" />
              <p className="text-xs text-gray-600">Losses</p>
            </div>
            <p className="font-bold text-gray-800 text-lg">{currentStats.totalLosses}</p>
          </div>
        </div>
        <div className="text-center mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Win Rate</p>
          <p className="font-bold text-gray-800 text-xl">
            {currentStats.winRate}%
          </p>
        </div>
      </div>
    </div>
  );
} 