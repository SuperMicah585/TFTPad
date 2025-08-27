import { useState } from 'react'
import { SquareX } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { trackLogin } from '../GoogleAnalytics'

interface RiotLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (user: any) => void
}

export function RiotLoginModal({ isOpen, onClose, onSuccess }: RiotLoginModalProps) {
  const [riotId, setRiotId] = useState('')
  const [region, setRegion] = useState('americas')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signInWithRiot } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

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

      const result = await signInWithRiot(gameName, tagLine, region)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Track successful login
      trackLogin('riot_games')
      
      // Call onSuccess callback
      if (onSuccess) {
        onSuccess({ id: 0, riot_id: '', summoner_name: gameName + '#' + tagLine, region, created_at: '' })
      }
      
      // Close modal
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login with Riot account')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-4xl w-full overflow-hidden max-h-[90vh]">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left side - Image */}
          <div className="hidden lg:block bg-gray-100">
            <img 
              src="/surfing_chonc.png" 
              alt="TFTPad" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right side - Login form */}
          <div className="p-4 sm:p-8 relative">
            {/* Close button - absolute positioned */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-0 bg-transparent border-none w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center group hover:bg-transparent"
              style={{ lineHeight: 0 }}
            >
              <SquareX className="w-6 h-6 sm:w-10 sm:h-10 text-black group-hover:opacity-80 transition-opacity" />
            </button>



            <div className="space-y-4">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Welcome to TFTPad</h3>
                <p className="text-gray-600 text-sm">
                  Connect your Riot Games account to access all features and join study groups
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <p className="text-xs text-gray-400 mt-1">
                    Format: <span className="font-mono">Username#TAG</span> (e.g., <span className="font-mono">moisturizar#NA1</span>)
                  </p>
                </div>

                {error && (
                  <div className="text-red-700 text-sm bg-red-100 border border-red-300 p-3 rounded-lg flex items-center gap-2">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="#F87171"/>
                      <path d="M12 8v4m0 4h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-3 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#00c9ac' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00b89a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00c9ac'}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="48" height="48" rx="12" fill="#E84057"/>
                        <path d="M14 34L34 14M14 14h20v20H14V14z" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Connect with Riot Account</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 