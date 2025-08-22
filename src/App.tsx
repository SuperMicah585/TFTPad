import { Routes, Route, Navigate } from 'react-router-dom'
import { Header } from './components/header'
import { BlogPage } from './components/BlogPage'
import { ContactPage } from './components/ContactPage'
import { ProfilePage } from './components/ProfilePage'

import { AuthProvider } from './contexts/AuthContext'
import { ProfileProvider } from './contexts/ProfileContext'

import { GoogleAnalytics } from './components/GoogleAnalytics'
import './App.css'
import { Link } from 'react-router-dom'

import { GroupsPage } from './components/GroupsPage'
import { FreeAgentsPage } from './components/FreeAgentsPage'
import { MyGroupsPage } from './components/MyGroupsPage'
import { GroupDetailPage } from './components/GroupDetailPage'
import { FreeAgentProfilePage } from './components/FreeAgentProfilePage'
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

function App() {
  return (
    <>
      <GoogleAnalytics />
      <PageViewTracker />
      <AuthProvider>
        <ProfileProvider>
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
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/study-groups" element={<Navigate to="/study-groups/groups" replace />} />
              <Route path="/study-groups/groups" element={<GroupsPage />} />
              <Route path="/study-groups/groups/:groupId" element={<GroupDetailPage />} />
              <Route path="/study-groups/my-groups" element={<MyGroupsPage />} />
              <Route path="/study-groups/free-agents" element={<FreeAgentsPage />} />
              <Route path="/study-groups/free-agents/:user_id" element={<FreeAgentProfilePage />} />
              <Route path="/study-groups/invitations" element={<GroupsPage />} />
              <Route path="/blog/defensive-stats" element={<BlogPost title="Defensive Stats" content={<DefensiveStats />} />} />
              <Route path="/blog/champion-pool" element={<BlogPost title="Champion Pool" content={<ChampionPool />} />} />
              <Route path="/blog/econ" element={<BlogPost title="Econ" content={<Econ />} />} />
              <Route path="/blog/positioning-units" element={<BlogPost title="Positioning Units" content={<PositioningUnits />} />} />
              <Route path="/blog/item-pool" element={<BlogPost title="Item Pool" content={<ItemPool />} />} />
              <Route path="/blog/understanding-dmg" element={<BlogPost title="Understanding DMG" content={<UnderstandingDMG />} />} />
              <Route path="/blog/mana" element={<BlogPost title="Mana" content={<Mana />} />} />
              <Route path="/blog/base-stats-comparison" element={<BlogPost title="Comparing Units Base Stats" content={<BaseStatsComparison />} />} />
              <Route path="/profile" element={<ProfilePage />} />

            </Routes>
          </div>
                  </div>
        </ProfileProvider>
      </AuthProvider>
    </>
  )
}

export default App