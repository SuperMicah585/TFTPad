import { api } from './apiUtils'

interface User {
  id: number
  email: string
  created_at: string
  // Profile fields that might be stored elsewhere or provided by backend
  description?: string
  available?: number
  days?: string[]
  time?: string
  timezone?: string
}



interface RiotAccount {
  id: number
  user_id: number
  riot_id: string  // This is actually the PUUID
  summoner_name: string
  region: string
  rank?: string
  icon_id?: number
  created_at: string
  date_updated?: string
}



export const userService = {

  async getRiotAccountByPuuid(puuid: string): Promise<RiotAccount | null> {
    try {
      const response = await api.get<RiotAccount>(`/api/riot-account/${puuid}`)
      return response
    } catch (error) {
      console.error('Error fetching Riot account by PUUID:', error)
      return null
    }
  },

  async getRiotAccountBySummoner(summonerName: string): Promise<RiotAccount | null> {
    try {
      // URL-encode the summoner name to handle special characters like #
      const encodedSummonerName = encodeURIComponent(summonerName)
      const response = await api.get<RiotAccount>(`/api/riot-account/summoner/${encodedSummonerName}`)
      return response
    } catch (error) {
      console.error('Error fetching Riot account by summoner name:', error)
      return null
    }
  },

  // Backward compatibility method - now returns null since we don't need user-riot-account endpoint
  async getUserRiotAccount(_userId: number): Promise<RiotAccount | null> {
    // This method is no longer needed since users don't need Riot accounts for basic functionality
    // Return null to indicate no Riot account is connected
    return null
  },

  async getUserProfile(userId: number): Promise<User> {
    const data = await api.get<User>(`/api/users/${userId}`)
    return data
  },

  async updateUserProfile(userId: number, updates: { description?: string; available?: number; days?: string[]; time?: string; timezone?: string }): Promise<User> {
    const data = await api.put<User>(`/api/users/${userId}`, updates)
    return data
  },

  async deleteRiotAccountByPuuid(puuid: string): Promise<void> {
    await api.delete(`/api/riot-account/${puuid}`)
  },

  async updateRiotAccountRankByPuuid(puuid: string): Promise<{ rank: string }> {
    const data = await api.post<{ rank: string }>(`/api/riot-account/${puuid}/update-rank`)
    return data
  },

  async updateRiotAccountIconByPuuid(puuid: string): Promise<{ icon_id: number }> {
    const data = await api.post<{ icon_id: number }>(`/api/riot-account/${puuid}/update-icon`)
    return data
  },

  // Backward compatibility methods - these are no longer needed since users don't need Riot accounts
  async deleteUserRiotAccount(_userId: number): Promise<void> {
    // Users don't need Riot accounts for basic functionality
    throw new Error('Riot account operations not available - users don\'t need Riot accounts')
  },

  async updateUserRiotAccountRank(_userId: number): Promise<{ rank: string }> {
    // Users don't need Riot accounts for basic functionality
    throw new Error('Riot account operations not available - users don\'t need Riot accounts')
  },

  async updateUserRiotAccountIcon(_userId: number): Promise<{ icon_id: number }> {
    // Users don't need Riot accounts for basic functionality
    throw new Error('Riot account operations not available - users don\'t need Riot accounts')
  },

  async deleteUserAccount(userId: number): Promise<{ message: string }> {
    const data = await api.delete<{ message: string }>(`/api/users/${userId}/delete-account`)
    return data
  }
} 