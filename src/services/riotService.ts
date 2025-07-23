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

export const riotService = {
  async connectRiotAccount(gameName: string, tagLine: string, userId: number, region: string): Promise<RiotAccountResponse> {
    const response = await fetch('/api/riot-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameName, // camelCase
        tagLine,  // camelCase
        userId,   // Add userId
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
    try {
      const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json')
      const versions = await response.json()
      return versions[0] // Return the latest version
    } catch (error) {
      console.error('Error fetching version:', error)
      return '15.12.1' // Fallback version
    }
  },

  async getSummonerData(puuid: string, region: string): Promise<SummonerData> {
    const response = await fetch(`/api/summoner/${puuid}?region=${region}`)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch summoner data')
    }

    return response.json()
  },

  getProfileIconUrl(profileIconId: number, version: string): string {
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${profileIconId}.png`
  }
} 