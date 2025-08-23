import { api } from './apiUtils';

export interface MatchHistoryEntry {
  matchId: string;
  gameCreation: number;
  gameLength: number;
  placement: number;
  playerName: string;
  champions: {
    name: string;
    stars: number;
    items: string[];
  }[];
  traits: {
    name: string;
    num_units: number;
    tier_current: number;
    tier_total: number;
  }[];
}

export interface MatchHistoryResponse {
  matches: MatchHistoryEntry[];
}

class MatchHistoryService {
  private baseUrl = '/api';

  async getMatchHistory(puuid: string, region: string = 'americas'): Promise<MatchHistoryEntry[]> {
    try {
      const response = await api.get<MatchHistoryResponse>(
        `${this.baseUrl}/match-history/${puuid}?region=${region}`
      );
      
      if (response && response.matches) {
        return response.matches;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching match history:', error);
      throw error;
    }
  }

  async getMatchData(matchId: string): Promise<any> {
    try {
      const response = await api.get(`${this.baseUrl}/match/${matchId}`);
      return response;
    } catch (error) {
      console.error('Error fetching match data:', error);
      throw error;
    }
  }
}

export const matchHistoryService = new MatchHistoryService();
