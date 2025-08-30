import { useState } from 'react'
import { SquareX } from 'lucide-react'
import { riotService } from '../../services/riotService'

interface RiotConnectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function RiotConnectModal({ isOpen, onClose, onSuccess }: RiotConnectModalProps) {
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
      
      const result = await riotService.connectRiotAccount(gameName, tagLine, region)
      setSuccess(`Successfully added ${result.data.riot_id} as a free agent!`)
      
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
      // Enhanced error handling for specific cases
      if (err instanceof Error) {
        const errorMessage = err.message
        
        // Handle specific error cases
        if (errorMessage.includes('already exists')) {
          setError('This Riot account is already connected to another user. Please use a different account.')
        } else if (errorMessage.includes('Invalid Riot ID')) {
          setError('Invalid Riot ID or region. Please check your Riot ID and region selection.')
        } else if (errorMessage.includes('Network error')) {
          setError('Network connection error. Please check your internet connection and try again.')
        } else if (errorMessage.includes('Riot API request failed')) {
          setError('Unable to verify Riot account. Please check your Riot ID and region, or try again later.')
        } else if (errorMessage.includes('Invalid Riot ID format')) {
          setError('Please use the correct format: Username#TAG (e.g., PlayerName#NA1)')
        } else if (errorMessage.includes('Game name and tag line cannot be empty')) {
          setError('Please enter both the username and tag line.')
        } else {
          setError(errorMessage || 'Failed to add player. Please try again.')
        }
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setRiotId('')
      setError(null)
      setSuccess(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md relative">
        {/* Close Button - styled to match other modals */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-0 bg-transparent border-none w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center group hover:bg-transparent"
          style={{ lineHeight: 0 }}
          disabled={loading}
        >
          <SquareX className="w-6 h-6 sm:w-10 sm:h-10 text-black group-hover:opacity-80 transition-opacity" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Add Player</h2>
          <p className="text-gray-600">Add a player to the free agents list</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mx-6 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm font-medium">{error}</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
              onClick={handleClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!riotId || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding Player...' : 'Add Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 