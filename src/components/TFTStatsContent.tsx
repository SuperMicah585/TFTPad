
import { Award, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { PlayerEloChart } from './PlayerEloChart';
import { LoadingSpinner } from './auth/LoadingSpinner';
import type { PlayerRankAuditEvent } from '../services/playerStatsService';

interface TFTStatsContentProps {
  leagueDataLoading: boolean;
  leagueDataError: string | null;
  playerLeagueData: any[];
  playerStatsLoading: boolean;
  playerStatsError: string | null;
  playerStatsData: PlayerRankAuditEvent[];
  getRankedTftData: () => any;
  getTurboTftData: () => any;
  className?: string;
}

export function TFTStatsContent({
  leagueDataLoading,
  leagueDataError,
  playerLeagueData,
  playerStatsLoading,
  playerStatsError,
  playerStatsData,
  getRankedTftData,
  getTurboTftData,
  className = ''
}: TFTStatsContentProps) {
  if (leagueDataLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <LoadingSpinner size="md" className="mx-auto mb-2" />
            <p className="text-gray-500">Loading league data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (leagueDataError) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{leagueDataError}</p>
        </div>
      </div>
    );
  }

  if (playerLeagueData.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-[#fff6ea] border border-[#e6d7c3] rounded-lg p-4 text-center">
          <p className="text-gray-600">No league data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Ranked TFT */}
      {getRankedTftData() && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-xs">
            <div className="w-5 h-5 bg-amber-500 rounded-lg flex items-center justify-center">
              <svg className="w-3 h-3 text-amber-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            Ranked TFT
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Award className="w-3 h-3 text-amber-600" />
                <p className="text-xs text-gray-600">Rank</p>
              </div>
              <p className="font-bold text-gray-800 text-sm sm:text-lg">{getRankedTftData()?.tier} {getRankedTftData()?.rank}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-3 h-3 text-yellow-600" fill="currentColor" />
                <p className="text-xs text-gray-600">LP</p>
              </div>
              <p className="font-bold text-gray-800 text-sm sm:text-lg">{getRankedTftData()?.leaguePoints}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <p className="text-xs text-gray-600">Wins</p>
              </div>
              <p className="font-bold text-gray-800 text-sm sm:text-lg">{getRankedTftData()?.wins}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingDown className="w-3 h-3 text-red-600" />
                <p className="text-xs text-gray-600">Losses</p>
              </div>
              <p className="font-bold text-gray-800 text-sm sm:text-lg">{getRankedTftData()?.losses}</p>
            </div>
          </div>
          <div className="text-center mt-4 pt-4 border-t border-gray-200">
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
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-xs">
            <div className="w-5 h-5 bg-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-3 h-3 text-purple-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            Turbo TFT
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Award className="w-3 h-3 text-amber-600" />
                <p className="text-xs text-gray-600">Tier</p>
              </div>
              <p className="font-bold text-gray-800 text-sm sm:text-lg">{getTurboTftData()?.ratedTier}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-3 h-3 text-yellow-600" fill="currentColor" />
                <p className="text-xs text-gray-600">Rating</p>
              </div>
              <p className="font-bold text-gray-800 text-sm sm:text-lg">{getTurboTftData()?.ratedRating}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <p className="text-xs text-gray-600">Wins</p>
              </div>
              <p className="font-bold text-gray-800 text-sm sm:text-lg">{getTurboTftData()?.wins}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingDown className="w-3 h-3 text-red-600" />
                <p className="text-xs text-gray-600">Losses</p>
              </div>
              <p className="font-bold text-gray-800 text-sm sm:text-lg">{getTurboTftData()?.losses}</p>
            </div>
          </div>
          <div className="text-center mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Win Rate</p>
            <p className="font-bold text-gray-800 text-xl">
              {getTurboTftData() ? 
                `${((getTurboTftData()!.wins / (getTurboTftData()!.wins + getTurboTftData()!.losses)) * 100).toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Player ELO Chart */}
      {playerStatsLoading ? (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="md" className="mx-auto mb-2" />
            <p className="text-gray-500">Loading ELO progression...</p>
          </div>
        </div>
      ) : playerStatsError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">{playerStatsError}</p>
        </div>
      ) : (playerStatsData.length > 0 || getRankedTftData()) ? (
        <PlayerEloChart 
          data={playerStatsData}
          liveData={getRankedTftData()}
          height={500}
          className="w-full"
        />
      ) : null}
    </div>
  );
} 