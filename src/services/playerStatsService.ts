const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';

export interface PlayerRankAuditEvent {
  id: number;
  created_at: string;
  elo: number;
  wins: number;
  losses: number;
  riot_id: string;
}

export interface PlayerStatsData {
  events: PlayerRankAuditEvent[];
}

export const playerStatsService = {
  async getPlayerStats(riotId: string): Promise<PlayerStatsData> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/player-stats/${riotId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch player stats: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching player stats:', error);
      throw error;
    }
  }
};

 