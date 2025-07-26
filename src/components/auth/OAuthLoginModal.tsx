import { useAuth } from '../../contexts/AuthContext'
import { SquareX } from 'lucide-react'

interface OAuthLoginModalProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'login' | 'signup'
}

export function OAuthLoginModal({ isOpen, onClose, mode = 'login' }: OAuthLoginModalProps) {
  const { signInWithGoogle, signInWithDiscord } = useAuth()

  const handleGoogleSignIn = async () => {
    await signInWithGoogle()
  }

  const handleDiscordSignIn = async () => {
    await signInWithDiscord()
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
              {mode === 'signup' ? 'Sign Up' : 'Login'}
            </h2>
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
                  {mode === 'signup' 
                    ? 'Create a new account to access all features and join study groups'
                    : 'Log in to your account or create a new one to access all features'
                  }
                </p>
              </div>

              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-md transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                onClick={handleDiscordSignIn}
                className="w-full flex items-center justify-center space-x-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-3 px-4 rounded-md transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                </svg>
                <span>Continue with Discord</span>
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                By {mode === 'signup' ? 'signing up' : 'logging in'}, you agree to our terms of service and privacy policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 