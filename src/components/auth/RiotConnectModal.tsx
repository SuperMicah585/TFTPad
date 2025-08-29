import { useState } from 'react'
import { SquareX } from 'lucide-react'
import { riotService } from '../../services/riotService'

interface RiotConnectModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onSuccess?: () => void
}

export function RiotConnectModal({ isOpen, onClose, userId, onSuccess }: RiotConnectModalProps) {
  const [riotId, setRiotId] = useState('')
  const [region, setRegion] = useState('americas')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Parse the Riot ID format (Username#TAG)
      const parts: string[] = riotId.split('#')
      if (parts.length !== 2) {
        throw new Error('Invalid Riot ID format. Please use: Username#TAG')
      }
      const gameName = parts[0].trim()
      const tagLine = parts[1].trim()
      if (!gameName || !tagLine) {
        throw new Error('Game name and tag line cannot be empty')
      }
      
      // Convert userId to number for the API call
      const numericUserId = parseInt(userId, 10)
      if (isNaN(numericUserId)) {
        throw new Error('Invalid user ID')
      }
      
      const result = await riotService.connectRiotAccount(gameName, tagLine, numericUserId, region)
      setSuccess(`Successfully connected to ${result.data.riot_id}!`)
      
      // Dispatch custom event to notify other components about account update
      window.dispatchEvent(new CustomEvent('riotAccountUpdated'))
      
      // Call onSuccess callback to refresh parent data
      if (onSuccess) {
        onSuccess()
      }
      
      setTimeout(() => {
        setRiotId('')
        setSuccess(null)
        onClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Riot account')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={loading}
        >
          <SquareX size={24} />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect Riot Account</h2>
          <p className="text-gray-600">Add a Riot account to track for free agent functionality</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mx-6 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div>
            <label htmlFor="riotId" className="block text-sm font-medium text-gray-700 mb-2">
              Riot ID
            </label>
            <input
              type="text"
              id="riotId"
              value={riotId}
              onChange={(e) => setRiotId(e.target.value)}
              placeholder="Username#TAG"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Format: Username#TAG (e.g., PlayerName#NA1)</p>
          </div>

          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
              Region
            </label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
              disabled={loading}
            >
              <option value="americas">Americas</option>
              <option value="europe">Europe</option>
              <option value="asia">Asia</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!riotId || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connecting...' : 'Connect Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 