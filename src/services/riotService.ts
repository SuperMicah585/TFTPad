export interface RiotAccountResponse {
  success: boolean
  message: string
  data: {
    puuid: string
    riot_id: string
    game_name: string
    tag_line: string
  }
}

export interface RiotAccountError {
  error: string
  message?: string
}

export interface SummonerData {
  id: string
  accountId: string
  puuid: string
  name: string
  profileIconId: number
  revisionDate: number
  summonerLevel: number
}

const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';

// Cache for the current version
let versionCache: { version: string; timestamp: number } | null = null;
const VERSION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const riotService = {
  async connectRiotAccount(gameName: string, tagLine: string, region: string): Promise<RiotAccountResponse> {
    const response = await fetch(`${API_BASE_URL}/api/riot-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameName, // camelCase
        tagLine,  // camelCase
        region    // Add region
      })
    })

    if (!response.ok) {
      const errorData: RiotAccountError = await response.json()
      throw new Error(errorData.error || 'Failed to connect Riot account')
    }

    return response.json()
  },

  async getCurrentVersion(): Promise<string> {
    // Check if we have a valid cached version
    const now = Date.now();
    if (versionCache && (now - versionCache.timestamp) < VERSION_CACHE_DURATION) {
      return versionCache.version;
    }

    try {
      const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json')
      const versions = await response.json()
      const latestVersion = versions[0]; // Return the latest version
      
      // Cache the version
      versionCache = {
        version: latestVersion,
        timestamp: now
      };
      
      return latestVersion;
    } catch (error) {
      console.error('Error fetching version:', error)
      // Return cached version if available, otherwise fallback
      return versionCache?.version || '15.12.1';
    }
  },

  // Function to clear the version cache (useful for testing or manual refresh)
  clearVersionCache(): void {
    versionCache = null;
  },

  // Function to get cached version without fetching (for synchronous access)
  getCachedVersion(): string | null {
    if (versionCache && (Date.now() - versionCache.timestamp) < VERSION_CACHE_DURATION) {
      return versionCache.version;
    }
    return null;
  },

  // Debug function to check cache status (for development/testing)
  getCacheStatus(): { hasCache: boolean; version: string | null; age: number | null } {
    if (!versionCache) {
      return { hasCache: false, version: null, age: null };
    }
    const age = Date.now() - versionCache.timestamp;
    return {
      hasCache: age < VERSION_CACHE_DURATION,
      version: versionCache.version,
      age: age
    };
  },

  async getSummonerData(puuid: string, region: string): Promise<SummonerData> {
    const response = await fetch(`${API_BASE_URL}/api/summoner/${puuid}?region=${region}`)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch summoner data')
    }

    return response.json()
  },

  getProfileIconUrl(profileIconId: number, version: string): string {
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${profileIconId}.png`
  },

  // Get all available Riot accounts
  async getAllRiotAccounts(): Promise<{ accounts: Array<{ riot_id: string, summoner_name: string, rank: string, region: string, created_at: string }> }> {
    const response = await fetch(`${API_BASE_URL}/api/riot-accounts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to get Riot accounts')
    }

    return response.json()
  }
} 