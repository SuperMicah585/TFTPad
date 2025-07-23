import { useState } from 'react'
import { X } from 'lucide-react'
import { riotService } from '../../services/riotService'

interface RiotConnectModalProps {
  isOpen: boolean
  onClose: () => void
  userId: number
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
      const result = await riotService.connectRiotAccount(gameName, tagLine, userId, region)
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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full px-8 py-8 transition-all duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
          aria-label="Close"
        >
          <X size={28} />
        </button>
        {/* Riot icon and title */}
        <div className="flex flex-col items-center mb-6">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2">
            <rect width="48" height="48" rx="12" fill="#E84057"/>
            <path d="M14 34L34 14M14 14h20v20H14V14z" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-1">Connect Riot Account</h2>
          <p className="text-gray-500 text-sm">Link your Riot Games account to unlock personalized features.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="region" className="block text-sm font-semibold text-gray-700 mb-2">
              Region
            </label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition"
              required
            >
              <option value="americas">Americas</option>
              <option value="asia">Asia</option>
              <option value="europe">Europe</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="riot-id" className="block text-sm font-semibold text-gray-700 mb-2">
              Riot ID
            </label>
            <input
              type="text"
              id="riot-id"
              value={riotId}
              onChange={(e) => setRiotId(e.target.value)}
              placeholder="moisturizar#NA1"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition"
              required
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1">Format: <span className="font-mono">Username#TAG</span> (e.g., <span className="font-mono">moisturizar#NA1</span>)</p>
          </div>
          {error && (
            <div className="text-red-700 text-sm bg-red-100 border border-red-300 p-3 rounded-lg flex items-center gap-2 animate-shake">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#F87171"/><path d="M12 8v4m0 4h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="text-green-700 text-sm bg-green-100 border border-green-300 p-3 rounded-lg flex items-center gap-2 animate-pulse">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#34D399"/><path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
              <span>{success}</span>
            </div>
          )}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 bg-white hover:bg-gray-50 py-2.5 px-4 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !riotId.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease; }
        @keyframes shake { 10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(2px); } 30%, 50%, 70% { transform: translateX(-4px); } 40%, 60% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.4s; }
      `}</style>
    </div>
  )
} 