
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

  if (!teamStatsData || teamStatsData.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">No team stats data available</p>
        </div>
      </div>
    );
  }

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