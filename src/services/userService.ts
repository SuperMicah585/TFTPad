import { api } from './apiUtils'

interface User {
  id: number
  description: string
  available: number
  days: string[]
  time?: string
  timezone?: string
  created_at: string
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

  async getUserRiotAccount(userId: number): Promise<RiotAccount | null> {
    try {
      const data = await api.get<RiotAccount>(`/api/user-riot-account/${userId}`)
      return data
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      console.error('Error fetching Riot account:', error)
      return null
    }
  },

  async getUserProfile(userId: number): Promise<User> {
    const data = await api.get<User>(`/api/users/${userId}`)
    return data
  },

  async updateUserProfile(userId: number, updates: { description?: string; available?: number; days?: string[]; time?: string; timezone?: string }): Promise<User> {
    const data = await api.put<User>(`/api/users/${userId}`, updates)
    return data
  },

  async deleteUserRiotAccount(userId: number): Promise<void> {
    await api.delete(`/api/user-riot-account/${userId}`)
  },

  async updateUserRiotAccountRank(userId: number): Promise<{ rank: string }> {
    const data = await api.post<{ rank: string }>(`/api/user-riot-account/${userId}/update-rank`)
    return data
  },

  async updateUserRiotAccountIcon(userId: number): Promise<{ icon_id: number }> {
    const data = await api.post<{ icon_id: number }>(`/api/user-riot-account/${userId}/update-icon`)
    return data
  },

  async deleteUserAccount(userId: number): Promise<{ message: string }> {
    const data = await api.delete<{ message: string }>(`/api/users/${userId}/delete-account`)
    return data
  }
} 