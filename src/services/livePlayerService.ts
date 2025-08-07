const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';

export interface LivePlayerData {
  riot_id: string;
  summoner_name: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  elo: number;
  created_at: string;
}

export interface LivePlayerStats {
  [summonerName: string]: LivePlayerData;
}

class LivePlayerService {
  private async rankToElo(rankStr: string): Promise<number> {
    // This function replicates the server-side rank_to_elo logic
    if (!rankStr || rankStr === 'UNRANKED') return 0;
    
    rankStr = rankStr.toUpperCase();
    
    // Handle TURBO ranks
    if (rankStr.startsWith('TURBO ')) {
      const turboRank = rankStr.replace('TURBO ', '');
      if (turboRank === 'UNRANKED') return 0;
      if (turboRank === 'IRON') return 200;
      if (turboRank === 'BRONZE') return 600;
      if (turboRank === 'SILVER') return 1000;
      if (turboRank === 'GOLD') return 1400;
      if (turboRank === 'PLATINUM') return 1800;
      if (turboRank === 'EMERALD') return 2200;
      if (turboRank === 'DIAMOND') return 2600;
      return 0;
    }
    
    // Handle regular ranks
    const getDivisionValue = (rankStr: string, baseElo: number): number => {
      if (rankStr.includes(' IV')) return baseElo + 0;
      if (rankStr.includes(' III')) return baseElo + 100;
      if (rankStr.includes(' II')) return baseElo + 200;
      if (rankStr.includes(' I')) return baseElo + 300;
      return baseElo;
    };
    
    const addLpToElo = (rankStr: string, baseElo: number): number => {
      let lp = 0;
      if (rankStr.includes('LP')) {
        try {
          const lpPart = rankStr.split('LP')[0].trim();
          lp = parseInt(lpPart.split(' ').pop() || '0');
        } catch {
          lp = 0;
        }
      }
      return baseElo + lp;
    };
    
    if (rankStr.includes('IRON')) {
      const baseElo = getDivisionValue(rankStr, 0);
      return addLpToElo(rankStr, baseElo);
    } else if (rankStr.includes('BRONZE')) {
      const baseElo = getDivisionValue(rankStr, 400);
      return addLpToElo(rankStr, baseElo);
    } else if (rankStr.includes('SILVER')) {
      const baseElo = getDivisionValue(rankStr, 800);
      return addLpToElo(rankStr, baseElo);
    } else if (rankStr.includes('GOLD')) {
      const baseElo = getDivisionValue(rankStr, 1200);
      return addLpToElo(rankStr, baseElo);
    } else if (rankStr.includes('PLATINUM')) {
      const baseElo = getDivisionValue(rankStr, 1600);
      return addLpToElo(rankStr, baseElo);
    } else if (rankStr.includes('EMERALD')) {
      const baseElo = getDivisionValue(rankStr, 2000);
      return addLpToElo(rankStr, baseElo);
    } else if (rankStr.includes('DIAMOND')) {
      const baseElo = getDivisionValue(rankStr, 2400);
      return addLpToElo(rankStr, baseElo);
    } else if (rankStr.includes('MASTER') || rankStr.includes('GRANDMASTER') || rankStr.includes('CHALLENGER')) {
      const baseElo = 2800;
      return addLpToElo(rankStr, baseElo);
    }
    
    return 0;
  }

  async getLivePlayerStats(groupId: number): Promise<LivePlayerStats> {
    try {
      console.log('🚀 Fetching live player stats for group:', groupId);
      
      // First, get all members of the group
      const membersResponse = await fetch(`${API_BASE_URL}/api/study-groups/${groupId}/users`);
      if (!membersResponse.ok) {
        throw new Error('Failed to fetch group members');
      }
      
      const membersData = await membersResponse.json();
      const members = membersData.study_group_users || membersData;
      console.log('👥 Group members:', members);
      
      const liveStats: LivePlayerStats = {};
      
      // Fetch live data for each member
      for (const member of members) {
        if (!member.user_id) {
          console.warn('⚠️ Member has no user_id:', member);
          continue;
        }
        
        try {
          // Get user's riot account
          const riotAccountResponse = await fetch(`${API_BASE_URL}/api/user-riot-account/${member.user_id}`);
          if (!riotAccountResponse.ok) {
            console.warn(`⚠️ Failed to get riot account for user ${member.user_id}`);
            continue;
          }
          
          const riotAccount = await riotAccountResponse.json();
          if (!riotAccount || !riotAccount.riot_id) {
            console.warn(`⚠️ No riot account found for user ${member.user_id}`);
            continue;
          }
          
          // Fetch league data
          const leagueResponse = await fetch(`${API_BASE_URL}/api/tft-league/${riotAccount.riot_id}?user_id=${member.user_id}`);
          if (!leagueResponse.ok) {
            console.warn(`⚠️ Failed to get league data for user ${member.user_id}`);
            continue;
          }
          
          const leagueData = await leagueResponse.json();
          console.log(`📊 League data for ${member.summoner_name}:`, leagueData);
          
          // Find Ranked TFT data (not Turbo)
          const rankedData = leagueData.find((entry: any) => entry.queueType === 'RANKED_TFT');
          if (!rankedData) {
            console.warn(`⚠️ No ranked TFT data found for ${member.summoner_name}`);
            continue;
          }
          
          // Convert rank to ELO
          const rankStr = `${rankedData.tier} ${rankedData.rank} ${rankedData.leaguePoints}LP`;
          const elo = await this.rankToElo(rankStr);
          
          // Create live data point
          const liveData: LivePlayerData = {
            riot_id: riotAccount.riot_id,
            summoner_name: member.summoner_name,
            tier: rankedData.tier,
            rank: rankedData.rank,
            leaguePoints: rankedData.leaguePoints,
            wins: rankedData.wins,
            losses: rankedData.losses,
            elo: elo,
            created_at: new Date().toISOString() // Current timestamp for live data
          };
          
          liveStats[member.summoner_name] = liveData;
          console.log(`✅ Live stats for ${member.summoner_name}:`, liveData);
          
        } catch (error) {
          console.error(`❌ Error fetching live data for ${member.summoner_name}:`, error);
        }
      }
      
      console.log('🎯 Final live stats:', liveStats);
      return liveStats;
      
    } catch (error) {
      console.error('❌ Error fetching live player stats:', error);
      throw error;
    }
  }
}

export const livePlayerService = new LivePlayerService(); 