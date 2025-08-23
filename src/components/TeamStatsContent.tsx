
import { TeamStatsChart } from './TeamStatsChart';
import { TeamAverageChart } from './TeamAverageChart';
import { TeamStatsSummary } from './TeamStatsSummary';
import { LoadingSpinner } from './auth/LoadingSpinner';
import type { RankAuditEvent } from '../services/teamStatsService';
import type { LivePlayerData } from '../services/livePlayerService';

interface TeamStatsContentProps {
  teamStatsData: RankAuditEvent[];
  teamStatsLoading: boolean;
  teamStatsError: string | null;
  memberNames: { [riotId: string]: string };
  liveData: { [summonerName: string]: LivePlayerData };
  liveDataLoading: boolean;
  className?: string;
}

export function TeamStatsContent({
  teamStatsData,
  teamStatsLoading,
  teamStatsError,
  memberNames,
  liveData,
  liveDataLoading,
  className = ''
}: TeamStatsContentProps) {
  if (teamStatsLoading) {
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

  // Check if we have any data (historic or live)
  const hasHistoricData = teamStatsData && teamStatsData.length > 0;
  const hasLiveData = liveData && Object.keys(liveData).length > 0;

  if (!hasHistoricData && !hasLiveData) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">No team stats data available</p>
        </div>
      </div>
    );
  }

  // Calculate chart data for Team Summary (same logic as Team Average Performance chart)
  const calculateChartData = () => {
    if (!hasHistoricData) return null;

    // Group data by summoner name
    const groupedData: { [summonerName: string]: RankAuditEvent[] } = {};
    teamStatsData.forEach(event => {
      const summonerName = memberNames[event.riot_id] || event.riot_id;
      if (!groupedData[summonerName]) {
        groupedData[summonerName] = [];
      }
      groupedData[summonerName].push(event);
    });

    // Create member chart data
    const memberChartData = Object.keys(groupedData).map((summonerName) => {
      const events = groupedData[summonerName];
      
      // Start with historical data
      let chartPoints = events
        .filter(event => {
          if (!event.created_at) return false;
          const date = new Date(event.created_at);
          return !isNaN(date.getTime()) && date.getTime() > 0;
        })
        .map(event => ({
          x: event.created_at.split('T')[0],
          y: event.elo,
          date: event.created_at,
          timestamp: new Date(event.created_at).getTime(),
          wins: event.wins,
          losses: event.losses,
          isLive: false
        }))
        .sort((a, b) => a.timestamp - b.timestamp); // Sort chronologically (backend handles filtering)
      
      // Only include series that have data points
      if (chartPoints.length === 0) {
        return null;
      }
      
      return {
        id: summonerName,
        data: chartPoints
      };
    }).filter(series => series !== null);

    // Get all unique dates from all members
    const allDates = new Set<string>();
    memberChartData.forEach(series => {
      series.data.forEach(point => {
        allDates.add(point.x as string);
      });
    });

    // Sort dates chronologically
    const sortedDates = Array.from(allDates).sort();
    
    if (sortedDates.length === 0) return null;

    // Note: mostRecentDate is no longer used since we're getting latest data from each member

    // Calculate data using the most recent entry from each member
    const membersLatestData = memberChartData
      .map(series => {
        // Get the most recent data point for this member
        const sortedData = series.data.sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());
        return sortedData[sortedData.length - 1];
      })
      .filter(point => point !== undefined);

    if (membersLatestData.length === 0) return null;

    const totalElo = membersLatestData.reduce((sum, point) => sum + (point?.y as number), 0);
    const averageElo = Math.round(totalElo / membersLatestData.length);

    const totalWins = membersLatestData.reduce((sum, point) => {
      return sum + ((point as any).wins || 0);
    }, 0);
    
    const totalLosses = membersLatestData.reduce((sum, point) => {
      return sum + ((point as any).losses || 0);
    }, 0);

    return {
      totalWins,
      totalLosses,
      averageElo,
      memberCount: membersLatestData.length
    };
  };

  const chartData = calculateChartData();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Team Stats Summary */}
      <TeamStatsSummary
        teamStatsData={teamStatsData}
        teamStatsLoading={teamStatsLoading}
        teamStatsError={teamStatsError}
        memberNames={memberNames}
        liveData={liveData}
        liveDataLoading={liveDataLoading}
        chartData={chartData}
        className="w-full"
      />

      {/* Individual Progression Chart */}
      <TeamStatsChart 
        data={teamStatsData}
        memberNames={memberNames}
        liveData={liveData}
        height={400}
        className="w-full"
      />

      {/* Team Average Chart */}
      <TeamAverageChart 
        data={teamStatsData}
        memberNames={memberNames}
        liveData={liveData}
        height={400}
        className="w-full"
      />
    </div>
  );
} 