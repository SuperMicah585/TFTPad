import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { CompHolder } from './components/comp_holder'
import { UnitsHolder } from './components/units_holder'
import { CompsHolder } from './components/comps_holder'
import { Header } from './components/header'
import { BlogPage } from './components/BlogPage'
import { ContactPage } from './components/ContactPage'
import { ProfilePage } from './components/ProfilePage'
import { AuthCallback } from './components/auth/AuthCallback'
import { TFTProvider } from './contexts/TFTContext'
import { AuthProvider } from './contexts/AuthContext'
import { ProfileProvider } from './contexts/ProfileContext'
import { HelpCircle } from 'lucide-react'
import { GoogleAnalytics, trackEvent } from './components/GoogleAnalytics'
import './App.css'
import { Link } from 'react-router-dom'

import { GameIdModal } from './components/GameIdModal'
import { StudyGroupsPage } from './components/StudyGroupsPage'
import { PageViewTracker } from './components/PageViewTracker'
import { Footer } from './components/Footer'
import { DefensiveStats } from './components/blog/DefensiveStats'
import { ChampionPool } from './components/blog/ChampionPool'
import { Econ } from './components/blog/Econ'
import { PositioningUnits } from './components/blog/PositioningUnits'
import { ItemPool } from './components/blog/ItemPool'
import { UnderstandingDMG } from './components/blog/UnderstandingDMG'
import { Mana } from './components/blog/Mana'
import { BaseStatsComparison } from './components/blog/BaseStatsComparison'

function MainApp() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active tab from URL path
  const pathSegments = location.pathname.split('/');
  const currentTab = pathSegments[pathSegments.length - 1] as 'game' | 'units' | 'comps';
  const [activeTab, setActiveTab] = useState<'game' | 'units' | 'comps'>(currentTab || 'game')
  const [showGameIdModal, setShowGameIdModal] = useState(false)
  const [showMobileBlockModal, setShowMobileBlockModal] = useState(false)
  
  // Check if user is on mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768; // md breakpoint
      if (isMobile) {
        setShowMobileBlockModal(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync active tab with URL changes
  useEffect(() => {
    const pathSegments = location.pathname.split('/');
    const currentTab = pathSegments[pathSegments.length - 1] as 'game' | 'units' | 'comps';
    if (currentTab && ['game', 'units', 'comps'].includes(currentTab)) {
      setActiveTab(currentTab);
    } else {
      // Default to game if no valid tab in URL (e.g., /tracker)
      setActiveTab('game');
    }
  }, [location.pathname]);

  const handleTabChange = (tab: 'game' | 'units' | 'comps') => {
    setActiveTab(tab);
    // Navigate to the sub-route
    navigate(`/tracker/${tab}`);
    // Track tab changes as events
    trackEvent('tab_click', 'navigation', tab);
  };

  return (
    <div className="container mx-auto px-4 py-6 relative z-10" style={{ width: '1152px' }}>
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <div className="flex-1 relative group">
          <button
            onClick={() => handleTabChange('game')}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors focus:outline-none border-2 border-transparent ${
              activeTab === 'game'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '2px solid rgb(253, 186, 116)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '2px solid transparent';
            }}
          >
            Game
          </button>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <HelpCircle size={16} className="text-gray-400" />
          </div>
          {/* Game Tab Tooltip */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
            <div className="text-center">Input what you think other players in your lobby will play</div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
          </div>
        </div>
        
        <div className="flex-1 relative group">
          <button
            onClick={() => handleTabChange('comps')}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors focus:outline-none border-2 border-transparent ${
              activeTab === 'comps'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '2px solid rgb(253, 186, 116)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '2px solid transparent';
            }}
          >
            Comps
          </button>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <HelpCircle size={16} className="text-gray-400" />
          </div>
          {/* Comps Tab Tooltip */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
            <div className="text-center">Get recommended comps based on your lobby analysis</div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
          </div>
        </div>
        
        <div className="flex-1 relative group">
          <button
            onClick={() => handleTabChange('units')}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors focus:outline-none border-2 border-transparent ${
              activeTab === 'units'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '2px solid rgb(253, 186, 116)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '2px solid transparent';
            }}
          >
            Units
          </button>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <HelpCircle size={16} className="text-gray-400" />
          </div>
          {/* Units Tab Tooltip */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
            <div className="text-center">See which units are contested based on your lobby predictions</div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full">
        {activeTab === 'game' ? <CompHolder onShowGameIdModal={() => setShowGameIdModal(true)} /> : activeTab === 'units' ? <UnitsHolder /> : <CompsHolder />}
      </div>
      
      <Footer />

      {/* Game ID Modal */}
      <GameIdModal 
        isOpen={showGameIdModal} 
        onClose={() => setShowGameIdModal(false)} 
      />
      
      {/* Mobile Block Modal */}
      {showMobileBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Desktop Only</h3>
              <p className="text-gray-600 leading-relaxed">
                The Tracker features are designed for desktop use and are not optimized for mobile devices. 
                Please visit TFTPad on a desktop or tablet for the best experience.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.href = '/study-groups'}
                className="bg-orange-300 hover:bg-orange-400 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors border-2 border-orange-300 hover:border-orange-400"
              >
                Go to Study Groups
              </button>
              <button
                onClick={() => window.location.href = '/blog'}
                className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 bg-white hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Read Blog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Placeholder component for individual blog posts
function BlogPost({ title, content }: { title: string; content: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-6 relative z-10 max-w-6xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full p-4 md:p-8">
        <div className="mb-6">
          <Link to="/blog" className="text-orange-500 hover:text-orange-600 font-medium mb-4 inline-flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">{title}</h1>
        
        <div className="prose max-w-none">
          {content}
        </div>
      </div>
      <Footer />
    </div>
  )
}



// Study Groups Page Component
// (function StudyGroupsPage() { ... })
// ... (remove all lines from 'function StudyGroupsPage() {' to the closing '}' of that function)
// ... existing code ...

function App() {
  return (
    <>
      <GoogleAnalytics />
      <PageViewTracker />
      <AuthProvider>
        <ProfileProvider>
          <TFTProvider>
          <div className="min-h-screen bg-white text-gray-800 relative flex flex-col">
          {/* Notebook Lines Background - Full Viewport */}
          <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#F0F3F0' }}>
            <div className="absolute inset-0 opacity-15 dark:opacity-20">
              <svg width="100%" height="100%">
                <pattern id="notebook-lines" x="0" y="0" width="100%" height="24" patternUnits="userSpaceOnUse">
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
                <rect width="100%" height="100%" fill="url(#notebook-lines)" />
              </svg>
            </div>
          </div>
          
          {/* Persistent Header */}
          <Header />
          
          {/* Main Content Area */}
          <div className="flex-1 relative z-10">
            <Routes>
              <Route path="/" element={<Navigate to="/study-groups/groups" replace />} />
              <Route path="/tracker" element={<Navigate to="/tracker/game" replace />} />
              <Route path="/tracker/game" element={<MainApp />} />
              <Route path="/tracker/units" element={<MainApp />} />
              <Route path="/tracker/comps" element={<MainApp />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/study-groups" element={<Navigate to="/study-groups/groups" replace />} />
              <Route path="/study-groups/groups" element={<StudyGroupsPage />} />
              <Route path="/study-groups/my-groups" element={<StudyGroupsPage />} />
              <Route path="/study-groups/free-agents" element={<StudyGroupsPage />} />
              <Route path="/study-groups/invitations" element={<StudyGroupsPage />} />
              <Route path="/blog/defensive-stats" element={<BlogPost title="Defensive Stats" content={<DefensiveStats />} />} />
              <Route path="/blog/champion-pool" element={<BlogPost title="Champion Pool" content={<ChampionPool />} />} />
              <Route path="/blog/econ" element={<BlogPost title="Econ" content={<Econ />} />} />
              <Route path="/blog/positioning-units" element={<BlogPost title="Positioning Units" content={<PositioningUnits />} />} />
              <Route path="/blog/item-pool" element={<BlogPost title="Item Pool" content={<ItemPool />} />} />
              <Route path="/blog/understanding-dmg" element={<BlogPost title="Understanding DMG" content={<UnderstandingDMG />} />} />
              <Route path="/blog/mana" element={<BlogPost title="Mana" content={<Mana />} />} />
              <Route path="/blog/base-stats-comparison" element={<BlogPost title="Comparing Units Base Stats" content={<BaseStatsComparison />} />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
            </Routes>
          </div>
                  </div>
          </TFTProvider>
        </ProfileProvider>
      </AuthProvider>
    </>
  )
}

export default App