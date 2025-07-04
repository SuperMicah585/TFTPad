import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { CompHolder } from './components/comp_holder'
import { UnitsHolder } from './components/units_holder'
import { CompsHolder } from './components/comps_holder'
import { Header } from './components/header'
import { BlogPage } from './components/BlogPage'
import { TFTProvider } from './contexts/TFTContext'
import { HelpCircle } from 'lucide-react'
import { GoogleAnalytics, trackEvent } from './components/GoogleAnalytics'
import './App.css'
import { Link } from 'react-router-dom'
import { Link as LinkIcon } from 'lucide-react'

function MainApp() {
  const [activeTab, setActiveTab] = useState<'game' | 'units' | 'comps'>('game')

  const handleTabChange = (tab: 'game' | 'units' | 'comps') => {
    setActiveTab(tab);
    // Track tab changes as events
    trackEvent('tab_click', 'navigation', tab);
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 relative">
      {/* Google Analytics - Configure with VITE_GA_MEASUREMENT_ID in .env file */}
      <GoogleAnalytics />
      
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
              onClick={() => handleTabChange('game')}
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
              onClick={() => handleTabChange('comps')}
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
              onClick={() => handleTabChange('units')}
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
  )
}

// Placeholder component for individual blog posts
function BlogPost({ title, content }: { title: string; content: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-800 relative flex flex-col">
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
      
      <div className="flex-1 container mx-auto px-4 py-6 relative z-10" style={{ width: '1152px' }}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full p-8">
          <div className="mb-6">
            <Link to="/blog" className="text-orange-500 hover:text-orange-600 font-medium mb-4 inline-flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Blog
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-6">{title}</h1>
          
          <div className="prose max-w-none">
            {content}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-6 bg-gray-50 border-t border-gray-200 relative z-10">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm" style={{ width: '1152px' }}>
          <p>2025-2025 TFTPad. TFTPad isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.</p>
        </div>
      </footer>
    </div>
  )
}

function SectionHeader({ id, children }: { id: string, children: React.ReactNode }) {
  return (
    <h2 id={id} className="group scroll-mt-24 text-2xl font-bold mt-12 mb-4 flex items-center text-left">
      <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 transition-opacity mr-2 text-blue-500" aria-label="Link to section">
        <LinkIcon size={18} />
      </a>
      {children}
    </h2>
  )
}

function App() {
  return (
    <TFTProvider>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/defensive-stats" element={<BlogPost 
          title="Defensive Stats" 
          content={<>
            {/* Table of Contents - static, left-aligned at top */}
            <nav className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
              <h2 className="text-lg font-semibold mb-2 text-gray-800">On this page</h2>
              <ul className="space-y-1 list-disc list-inside text-blue-700">
                <li><a href="#how-much-reduction" className="hover:underline">How much do Resistances Reduce Incoming Damage?</a></li>
                <li><a href="#diminishing-returns" className="hover:underline">Do Armor and Magic Resistance Have Diminishing Returns?</a></li>
                <li><a href="#effective-health" className="hover:underline">Interpreting Resistances in Terms of Effective Health</a></li>
                <li><a href="#sunder-shred" className="hover:underline">Effects of Sunder and Shred on Resistances</a></li>
                <li><a href="#damage-reduction" className="hover:underline">Damage Reduction</a></li>
              </ul>
            </nav>

            <SectionHeader id="how-much-reduction">How much do Resistances Reduce Incoming Damage?</SectionHeader>
            <p className="mb-4 pl-4 text-left">The table below shows how damage is reduced as armor on a unit increases. From this we can derive the formula <code>100 / (100 + Armor)</code>. This formula applies to both magic resistance and armor.</p>
            <img src="/armor-damage-reduction.png" alt="Armor vs Damage Taken and Reduction" className="my-4 border rounded" />

            <SectionHeader id="diminishing-returns">Do Armor and Magic Resistance Have Diminishing Returns?</SectionHeader>
            <p className="mb-4 pl-4 text-left">Due to the shape of the Damage Taken curve, we might think that there are diminishing returns to stacking armor and magic resistance. We need to shift our mindset from looking at percent damage reduction growth to what this means for the survivability of a unit. The example in the table below takes an instance of 1000 damage for a unit with 1000 health. It then compares at each row how many times this instance of 1000 damage needs to occur to kill this unit. As you can see, even though the percent damage reduction has diminishing growth, the instances to kill remain at constant growth. Therefore, we can conclude that stacking armor and magic resist does not have diminishing returns on the survivability of a unit.</p>
            <img src="/armor-instances-to-kill.png" alt="Armor vs Damage Taken and Instances to Kill" className="my-4 border rounded" />

            <SectionHeader id="effective-health">Interpreting Resistances in Terms of Effective Health</SectionHeader>
            <p className="mb-4 pl-4 text-left">Continuing the example above, let's assume that our unit has 1000 health. We can now use the Damage reduction percent from stacking armor to see the effective health that the unit has. I will note that this would be the effective health if the incoming damage is only physical which is a major weakness when compared to stacking health. Below we can see that each 100 points of armor increases the effective health of the unit by 1000 resulting in a linear increase in the survival ability of the unit.</p>
            <img src="/armor-effective-health.png" alt="Armor vs Damage Taken and Effective Health" className="my-4 border rounded" />

            <SectionHeader id="sunder-shred">Effects of Sunder and Shred on Resistances</SectionHeader>
            <p className="mb-4 pl-4 text-left">In general, TFT items reduce armor and magic resistance by 30%. There are some champions (i.e. Jhin in set 14) who can reduce resistances by 20%. But what does this really mean? Is this 10% a big difference?</p>
            <p className="mb-4 pl-4 text-left">In the table below we can see the impacts on armor reduction by both 20% and 30%. For a tank with 400 armor, decreasing its effective health by almost 25% is the equivalent of a gold augment (think glass cannon 2).</p>
            <img src="/armor-ehp-reduction.png" alt="Armor vs EHP with Reductions" className="my-4 border rounded" />

            <SectionHeader id="damage-reduction">Damage Reduction</SectionHeader>
            <p className="mb-4 pl-4 text-left">Pure damage reduction can be seen in set 14 traits like vanguard, or items like Steadfast Heart.</p>
            <p className="mb-4 pl-4 text-left">The curve of damage reduction follows a similar pattern to resistances when you stack it. Just like resistances the effective health will grow linearly. The main difference is that damage reduction will reduce both physical and magic damage.</p>

            {/* References Section */}
            <SectionHeader id="references">References</SectionHeader>
            <ul className="pl-4 text-left list-disc">
              <li>
                <a href="https://www.reddit.com/r/CompetitiveTFT/comments/1ewsow5/indepth_analysis_of_how_armour_magic_resist/" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900">
                  In-depth analysis of how armour & magic resist work in TFT (Reddit)
                </a>
              </li>
            </ul>
          </>}
        />} />
        <Route path="/blog/champion-pool" element={<BlogPost title="Champion Pool" content="How champion pools work and affect your drafting strategy" />} />
        <Route path="/blog/econ" element={<BlogPost title="Econ" content="Economic management and gold optimization strategies" />} />
        <Route path="/blog/item-pool" element={<BlogPost title="Item Pool" content="Understanding item pools and optimal itemization" />} />
        <Route path="/blog/dmg-scaling" element={<BlogPost title="Dmg Scaling (Magic Damage/Attack Damage)" content="How damage scaling works and affects unit effectiveness" />} />
        <Route path="/blog/starring-units" element={<BlogPost title="Impact of Starring Units Up" content="Base stats, abilities, and power increase from starring units" />} />
        <Route path="/blog/patch-notes" element={<BlogPost title="Understanding Patch Notes" content="How Riot's balance levers impact the meta and gameplay" />} />
        <Route path="/blog/understanding-dmg" element={<BlogPost title="Understanding DMG" content="Comprehensive guide to damage mechanics in TFT" />} />
      </Routes>
    </TFTProvider>
  )
}

export default App