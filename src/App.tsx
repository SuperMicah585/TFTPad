import { useState } from 'react'
import { CompHolder } from './components/comp_holder'
import { UnitsHolder } from './components/units_holder'
import { CompsHolder } from './components/comps_holder'
import { Header } from './components/header'
import { TFTProvider } from './contexts/TFTContext'
import { HelpCircle } from 'lucide-react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<'game' | 'units' | 'comps'>('game')

  return (
    <TFTProvider>
      <div className="min-h-screen bg-white text-gray-800 relative">
        {/* Notebook Lines Background - Full Viewport */}
        <div className="absolute inset-0 bg-white dark:bg-gray-950 overflow-hidden">
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
        
        <Header />
        <div className="container mx-auto px-4 py-6 relative z-10" style={{ width: '1152px' }}>
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <div className="flex-1 relative group">
              <button
                onClick={() => setActiveTab('game')}
                className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                  activeTab === 'game'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
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
                onClick={() => setActiveTab('comps')}
                className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                  activeTab === 'comps'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
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
                onClick={() => setActiveTab('units')}
                className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                  activeTab === 'units'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
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
            {activeTab === 'game' ? <CompHolder /> : activeTab === 'units' ? <UnitsHolder /> : <CompsHolder />}
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-8 py-6 bg-gray-50 border-t border-gray-200 relative z-10">
          <div className="container mx-auto px-4 text-center text-gray-600 text-sm" style={{ width: '1152px' }}>
            <p>2025-2025 TFTPad. TFTPad isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.</p>
          </div>
        </footer>
      </div>
    </TFTProvider>
  )
}

export default App