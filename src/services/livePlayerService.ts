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
  private async rankToElo(rankStr: string, leaguePoints: number): Promise<number> {
    // This function replicates the server-side rank_to_elo logic
    if (!rankStr) return 0;
    
    const parts = rankStr.split(' ');
    if (parts.length < 2) return 0;
    
    const tier = parts[0].toLowerCase();
    const rank = parts[1];
    
    let baseElo = 0;
    
    // Convert tier to base ELO
    switch (tier) {
      case 'iron':
        baseElo = 0;
        break;
      case 'bronze':
        baseElo = 400;
        break;
      case 'silver':
        baseElo = 800;
        break;
      case 'gold':
        baseElo = 1200;
        break;
      case 'platinum':
        baseElo = 1600;
        break;
      case 'emerald':
        baseElo = 2000;
        break;
      case 'diamond':
        baseElo = 2400;
        break;
      case 'master':
        baseElo = 2800;
        break;
      case 'grandmaster':
        baseElo = 3000;
        break;
      case 'challenger':
        baseElo = 3200;
        break;
      default:
        return 0;
    }
    
    // Convert rank to tier number (I=1, II=2, III=3, IV=4)
    let tierNumber = 0;
    switch (rank) {
      case 'I':
        tierNumber = 1;
        break;
      case 'II':
        tierNumber = 2;
        break;
      case 'III':
        tierNumber = 3;
        break;
      case 'IV':
        tierNumber = 4;
        break;
      default:
        tierNumber = 1;
    }
    
    // Calculate ELO based on tier and league points
    if (tier === 'master' || tier === 'grandmaster' || tier === 'challenger') {
      return baseElo + leaguePoints;
    } else {
      return baseElo + (tierNumber - 4) * 100 + leaguePoints;
    }
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
          const rankStr = `${rankedData.tier} ${rankedData.rank}`;
          const elo = await this.rankToElo(rankStr, rankedData.leaguePoints);
          
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