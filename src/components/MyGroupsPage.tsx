import { Users } from 'lucide-react'
import { Footer } from './Footer'
import { MyGroupsTab } from './MyGroupsTab'
import { useAuth } from '../contexts/AuthContext'
import { SupabaseLoginModal } from './auth/SupabaseLoginModal'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// My Groups Page Component
export function MyGroupsPage() {
  const { userId, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [navigationTimestamp, setNavigationTimestamp] = useState(Date.now());

  // Update timestamp when location changes to force remount
  useEffect(() => {
    setNavigationTimestamp(Date.now());
  }, [location.pathname]);

  // Show login modal when user is not logged in and auth is not loading
  useEffect(() => {
    if (!loading && !userId) {
      setShowLoginModal(true);
    }
  }, [loading, userId]);

  return (
    <>
      <div className="min-h-screen bg-white text-gray-800 relative flex flex-col">
        {/* Notebook Lines Background - Full Viewport */}
        <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#F0F3F0' }}>
          <div className="absolute inset-0 opacity-15 dark:opacity-20">
            <svg width="100%" height="100%">
              <pattern id="notebook-lines-my-groups" x="0" y="0" width="100%" height="24" patternUnits="userSpaceOnUse">
                <line
                  x1="0"
                  y1="23"
                  x2="100%"
                  y2="23"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-blue-500 dark:text-blue-400"
                />
              </pattern>
              <rect width="100%" height="100%" fill="url(#notebook-lines-my-groups)" />
            </svg>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Main Content Container */}
          <div className="container mx-auto px-4 py-6 relative z-10 max-w-7xl">
            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full overflow-hidden">
              {loading ? (
                <MyGroupsTab key={`loading-${navigationTimestamp}`} authLoading={true} />
              ) : userId ? (
                <MyGroupsTab key={`user-${userId}-${navigationTimestamp}`} authLoading={false} />
              ) : (
                <div className="p-8 text-center">
                  <div className="text-gray-500 mb-4">
                    <Users className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Login Required</h3>
                    <p className="text-gray-600">You need to be logged in to view your groups.</p>
                  </div>
                </div>
              )}
            </div>
            
            <Footer />
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      <SupabaseLoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          // Redirect to groups page when modal is closed
          navigate('/groups');
        }}
      />
    </>
  )
}
