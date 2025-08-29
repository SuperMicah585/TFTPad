import { useState } from 'react'
import { SquareX } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { trackLogin } from '../GoogleAnalytics'

interface SupabaseLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (user: any) => void
}

export function SupabaseLoginModal({ isOpen, onClose }: SupabaseLoginModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signInWithDiscord, signInWithGoogle } = useAuth()

  const handleDiscordLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔐 Modal: Starting Discord login...')
      const result = await signInWithDiscord()
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      console.log('🔐 Modal: Discord login successful, redirecting...')
      
      // Track successful login
      trackLogin('discord')
      
      // Don't close modal immediately - let the OAuth redirect happen
      // The modal will be closed when the user returns from OAuth
      
    } catch (err) {
      console.error('🔐 Modal: Discord login error:', err)
      setError(err instanceof Error ? err.message : 'Failed to login with Discord')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔐 Modal: Starting Google login...')
      const result = await signInWithGoogle()
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      console.log('🔐 Modal: Google login successful, redirecting...')
      
      // Track successful login
      trackLogin('google')
      
      // Don't close modal immediately - let the OAuth redirect happen
      // The modal will be closed when the user returns from OAuth
      
    } catch (err) {
      console.error('🔐 Modal: Google login error:', err)
      setError(err instanceof Error ? err.message : 'Failed to login with Google')
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
              disabled={loading}
            >
              <SquareX className="w-6 h-6 sm:w-10 sm:h-10 text-black group-hover:opacity-80 transition-opacity" />
            </button>

            <div className="space-y-4">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Welcome to TFTPad</h3>
                <p className="text-gray-600 text-sm">
                  Sign in with your preferred account to access all features and join study groups
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

              {loading && (
                <div className="text-blue-700 text-sm bg-blue-100 border border-blue-300 p-3 rounded-lg flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                  <span>Redirecting to authentication provider...</span>
                </div>
              )}

              <div className="space-y-3">
                {/* Discord Login */}
                <button
                  onClick={handleDiscordLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-3 bg-[#5865F2] hover:bg-[#5865F2]/90 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span>{loading ? 'Redirecting...' : 'Continue with Discord'}</span>
                </button>

                {/* Google Login */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-lg font-medium border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>{loading ? 'Redirecting...' : 'Continue with Google'}</span>
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
