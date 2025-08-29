import { useState } from 'react'
import { Footer } from './Footer'
import { FreeAgentsTab } from './FreeAgentsTab'

// Players Page Component
export function PlayersPage() {
  // Players filter state
  const [minRankFilter, setMinRankFilter] = useState<string>("iron+");
  const [maxRankFilter, setMaxRankFilter] = useState<string>("challenger");
  const [regionFilter, setRegionFilter] = useState<string>("");

  return (
    <>
      <div className="min-h-screen bg-white text-gray-800 relative flex flex-col">
        {/* Notebook Lines Background - Full Viewport */}
        <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#F0F3F0' }}>
          <div className="absolute inset-0 opacity-15 dark:opacity-20">
            <svg width="100%" height="100%">
              <pattern id="notebook-lines-players" x="0" y="0" width="100%" height="24" patternUnits="userSpaceOnUse">
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
              <rect width="100%" height="100%" fill="url(#notebook-lines-players)" />
            </svg>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Main Content Container */}
          <div className="container mx-auto px-4 py-6 relative z-10 max-w-7xl">
            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full overflow-hidden">
              <FreeAgentsTab
                minRankFilter={minRankFilter}
                setMinRankFilter={setMinRankFilter}
                maxRankFilter={maxRankFilter}
                setMaxRankFilter={setMaxRankFilter}
                regionFilter={regionFilter}
                setRegionFilter={setRegionFilter}
              />
            </div>
            
            <Footer />
          </div>
        </div>
      </div>
    </>
  )
}
