import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { CompHolder } from './components/comp_holder'
import { UnitsHolder } from './components/units_holder'
import { CompsHolder } from './components/comps_holder'
import { Header } from './components/header'
import { BlogPage } from './components/BlogPage'
import { ContactPage } from './components/ContactPage'
import { TFTProvider } from './contexts/TFTContext'
import { HelpCircle } from 'lucide-react'
import { GoogleAnalytics, trackEvent, trackPageView } from './components/GoogleAnalytics'
import './App.css'
import { Link } from 'react-router-dom'
import { Link as LinkIcon } from 'lucide-react'
import { GameIdModal } from './components/GameIdModal'

function MainApp() {
  const [activeTab, setActiveTab] = useState<'game' | 'units' | 'comps'>('game')
  const [showGameIdModal, setShowGameIdModal] = useState(false)

  const handleTabChange = (tab: 'game' | 'units' | 'comps') => {
    setActiveTab(tab);
    // Track tab changes as events
    trackEvent('tab_click', 'navigation', tab);
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 relative">
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
      
      <Header />
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
      </div>
      
      {/* Footer */}
      <footer className="mt-8 py-6 border-t border-gray-200 relative z-10" style={{ backgroundColor: '#F0F3F0' }}>
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm" style={{ width: '1152px' }}>
          <p>2025-2025 TFTPad. TFTPad isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.</p>
        </div>
      </footer>

      {/* Game ID Modal */}
      <GameIdModal 
        isOpen={showGameIdModal} 
        onClose={() => setShowGameIdModal(false)} 
      />
    </div>
  )
}

// Placeholder component for individual blog posts
function BlogPost({ title, content }: { title: string; content: React.ReactNode }) {
  return (
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
      
      <Header />
      
      <div className="flex-1 container mx-auto px-4 py-6 relative z-10 max-w-6xl">
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
      </div>
      
      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 relative z-10" style={{ backgroundColor: '#F0F3F0' }}>
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm max-w-6xl">
          <p>2025-2025 TFTPad. TFTPad isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.</p>
        </div>
      </footer>
    </div>
  )
}

function SectionHeader({ id, children }: { id: string, children: React.ReactNode }) {
  return (
    <h2 id={id} className="group scroll-mt-24 text-xl md:text-2xl font-bold mt-8 md:mt-12 mb-4 flex items-center text-left">
      <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 transition-opacity mr-2 text-blue-500" aria-label="Link to section">
        <LinkIcon size={18} />
      </a>
      {children}
    </h2>
  )
}

function SubHeader({ id, children }: { id: string, children: React.ReactNode }) {
  return (
    <h3 id={id} className="group scroll-mt-24 text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 flex items-center text-left">
      <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 transition-opacity mr-2 text-blue-500" aria-label="Link to section">
        <LinkIcon size={16} />
      </a>
      {children}
    </h3>
  )
}

// Component to track page views
function PageViewTracker() {
  const location = useLocation();
  
  useEffect(() => {
    // Track page view when location changes
    const pageTitle = getPageTitle(location.pathname);
    
    // Update document title to match our custom page title
    document.title = pageTitle;
    
    // Track page view with custom title
    trackPageView(pageTitle, window.location.href);
  }, [location]);

  return null;
}

// Helper function to get page title based on pathname
function getPageTitle(pathname: string): string {
  switch (pathname) {
    case '/':
      return 'TFTPad - Home';
    case '/blog':
      return 'TFTPad - Blog';
    case '/contact':
      return 'TFTPad - Contact';
    case '/blog/defensive-stats':
      return 'TFTPad - Defensive Stats';
    case '/blog/champion-pool':
      return 'TFTPad - Champion Pool';
    case '/blog/econ':
      return 'TFTPad - Econ';
    case '/blog/positioning-units':
      return 'TFTPad - Positioning Units';
    case '/blog/base-stats-comparison':
      return 'TFTPad - Base Stats Comparison';
    case '/blog/item-pool':
      return 'TFTPad - Item Pool';
    case '/blog/understanding-dmg':
      return 'TFTPad - Understanding DMG';
    case '/blog/mana':
      return 'TFTPad - Mana';
    default:
      return 'TFTPad';
  }
}

function App() {
  return (
    <>
      <GoogleAnalytics />
      <PageViewTracker />
      <TFTProvider>
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/contact" element={<ContactPage />} />
        <Route path="/blog/defensive-stats" element={<BlogPost 
          title="Defensive Stats" 
          content={<>
            {/* Table of Contents - static, left-aligned at top */}
            <nav className="mb-8 p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
              <h2 className="text-base md:text-lg font-semibold mb-2 text-gray-800">On this page</h2>
              <ul className="space-y-1 list-disc list-inside text-blue-700 text-sm md:text-base">
                <li><a href="#how-much-reduction" className="hover:underline">How much do Resistances Reduce Incoming Damage?</a></li>
                <li><a href="#diminishing-returns" className="hover:underline">Do Armor and Magic Resistance Have Diminishing Returns?</a></li>
                <li><a href="#effective-health" className="hover:underline">Interpreting Resistances in Terms of Effective Health</a></li>
                <li><a href="#sunder-shred" className="hover:underline">Effects of Sunder and Shred on Resistances</a></li>
                <li><a href="#damage-reduction" className="hover:underline">Damage Reduction</a></li>
              </ul>
            </nav>

            <SectionHeader id="how-much-reduction">How much do Resistances Reduce Incoming Damage?</SectionHeader>
            <p className="mb-4 pl-4 text-left">The table below shows how damage is reduced as armor on a unit increases. From this, we can derive the formula <code>100/(100 + Armor)</code> to calculate the damage taken percentage. This formula applies to both magic resistance and armor.</p>
            <img src="/armor-damage-reduction.png" alt="Armor vs Damage Taken and Reduction" className="my-4 border rounded" />

            <SectionHeader id="diminishing-returns">Do Armor and Magic Resistance Have Diminishing Returns?</SectionHeader>
            <p className="mb-4 pl-4 text-left">Due to the shape of the Damage Taken curve, we might think that there are diminishing returns to stacking armor and magic resistance. We need to shift our mindset from looking at percent damage reduction growth to what this means for a unit's survivability. The example in the table below takes an instance of 1000 damage for a unit with 1000 health. It then compares, at each row, how many times this instance of 1000 damage needs to occur to kill the unit. As you can see, even though the percent damage reduction has diminishing growth, the instances to kill remain at a constant rate. Therefore, we can conclude that stacking armor and magic resist does not have diminishing returns on a unit's survivability.</p>
            <img src="/armor-instances-to-kill.png" alt="Armor vs Damage Taken and Instances to Kill" className="my-4 border rounded" />

            <SectionHeader id="effective-health">Interpreting Resistances in Terms of Effective Health</SectionHeader>
            <p className="mb-4 pl-4 text-left">Continuing the example above, let's assume that our unit has 1000 health. We can now use the damage reduction percent from stacking armor to see the effective health that the unit has. I will note that this would be the effective health if the incoming damage is only physical, which is a major weakness compared to stacking health. Below, we can see that each 100 points of armor increases the effective health of the unit by 1000, resulting in a linear increase in the unit's survivability.</p>
            <img src="/armor-effective-health.png" alt="Armor vs Damage Taken and Effective Health" className="my-4 border rounded" />

            <SectionHeader id="sunder-shred">Effects of Sunder and Shred on Resistances</SectionHeader>
            <p className="mb-4 pl-4 text-left">In general, TFT items reduce armor and magic resistance by 30%. There are some champions (i.e., Jhin in set 14) who can reduce resistances by 20%. But what does this really mean? Is this 10% a big difference?</p>
            <p className="mb-4 pl-4 text-left">In the table below, we can see the impacts on armor reduction by both 20% and 30%. For a tank with 400 armor, decreasing its effective health by almost 25% is the equivalent of a gold augment (think Glass Cannon 2).</p>
            <img src="/armor-ehp-reduction.png" alt="Armor vs EHP with Reductions" className="my-4 border rounded" />

            <SectionHeader id="damage-reduction">Damage Reduction</SectionHeader>
            <p className="mb-4 pl-4 text-left">Pure damage reduction can be seen in set 14 traits like Vanguard, or items like Steadfast Heart.</p>
            <p className="mb-4 pl-4 text-left">The curve of damage reduction follows a similar pattern to resistances when you stack it. Just like resistances, the effective health will grow linearly. The main difference is that damage reduction will reduce both physical and magic damage.</p>

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
        <Route path="/blog/champion-pool" element={
          <BlogPost title="Champion Pool" content={
            <>
              {/* Table of Contents - static, left-aligned at top */}
              <nav className="mb-8 p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
                <h2 className="text-base md:text-lg font-semibold mb-2 text-gray-800">On this page</h2>
                <ul className="space-y-1 list-disc list-inside text-blue-700 text-sm md:text-base">
                  <li><a href="#units-per-tier" className="hover:underline">How Many Units are Within Each Tier?</a></li>
                  <li><a href="#pool-sizes" className="hover:underline">What are the Pool Sizes for each Tier?</a></li>
                  <li><a href="#shop-odds" className="hover:underline">Shop Odds and How to Think About Them When Rolling</a></li>
                </ul>
              </nav>

              <SectionHeader id="units-per-tier">How Many Units are Within Each Tier?</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                Below we can see the quantity of units at each tier:
              </p>
              <img src="/champion-pool-tier-quantity-table.png" alt="Table: Tier vs Unit Quantity" className="my-4 border rounded" style={{ display: 'block', marginLeft: 0, maxWidth: '480px' }} />

              <p className="mb-4 pl-4 text-left">
                The importance of the data above is in thinking about the possibility of getting the units you need for your comps.
              </p>
              <p className="mb-4 pl-4 text-left">
                For 4- and 5-costs, if you are trying to make a 3★ your win condition, make sure that you are not contested, as there are exactly 9 copies for 5-costs and 10 (1 extra) for 4-costs.
              </p>

              <SectionHeader id="pool-sizes">What are the Pool Sizes for each Tier?</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                In the table below, we can see the total amount of units that can be found for each Tier.
              </p>
              <img src="/champion-pool-sizes-table.png" alt="Table: Tier, Unit Quantity, Unique Units, Pool Size" className="my-4 border rounded mx-auto" />

              <p className="mb-4 pl-4 text-left">
                The reason why we might want to consider pool size when deciding what comp to play is that this is shared across all Tacticians in a TFT lobby. Let's say when scouting, I see multiple people going for 3-cost rerolls. I see that one person has a 3★ Jinx/Rengar and another person has a 3★ Galio. Based on this, I am thinking that I should try to hit an Elise 3★. If no one else was going for three-costs, then my odds of hitting an Elise at level 7 would be (18/234) * 5 * 0.4 = 15.36%, where 234 is the number of units, 5 is the number of units that show in the shop, and 0.4 is the odds of seeing a 3-cost in the shop at level 7. In the example above, 9 Jinx units are taken, 9 Rengar units are taken, and 9 Galio units are taken. Therefore, we can subtract 27 from the total pool size. The new percentage for seeing an Elise would be (18/207) * 5 * 0.4 = 17.3%. Obviously, this is a very limited example, but it illustrates why it's a good idea to scout and play uncontested comps when other people are taking units out of the tier you want.
              </p>

              <SectionHeader id="shop-odds">Shop Odds and How to Think About Them When Rolling</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                Below are two visuals that illustrate the odds for each tier as you increase your level. Let's focus on tier 1, 2, and 3, as they are the most common units to reroll. In general, there is a fairly low growth rate for odds, and then there is a large jump when the odds peak.
              </p>
              <p className="mb-4 pl-4 text-left">
                For example:
                <ul className="list-disc pl-6">
                  <li>tier 2 units growth rate is 5% → 3% → 7% (level 6) → -10%.</li>
                  <li>tier 3 units growth rate is 5% → 5% → 15% (level 7) → -8%.</li>
                </ul>
              </p>
              <p className="mb-4 pl-4 text-left">
                The interesting thing to note above is that tier 3 units get a massive spike of 15% odds when going from level 6 to 7. Therefore, it is important to be level 7 if you are missing the three-costs that you need.
              </p>
              <p className="mb-4 pl-4 text-left">
                While this is focusing on specifics, I hope it highlights the importance of understanding what units your comp needs and what level you should be to maximize your chance of hitting them.
              </p>

              <div className="flex flex-col md:flex-row gap-4 my-4 justify-center">
                <img src="/champion-pool-unit-odds-graph.png" alt="Graph: Unit Odds by Level and Tier" className="border rounded w-full md:w-auto" style={{ maxWidth: '480px', height: 'auto' }} />
                <img src="/champion-pool-unit-odds-table.png" alt="Table: Shop Odds by Level and Tier" className="border rounded w-full md:w-auto" style={{ maxWidth: '480px', height: 'auto' }} />
              </div>
            </>
          } />
        } />
        <Route path="/blog/econ" element={
          <BlogPost title="Econ" content={
            <>
              {/* Table of Contents - static, left-aligned at top */}
              <nav className="mb-8 p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
                <h2 className="text-base md:text-lg font-semibold mb-2 text-gray-800">On this page</h2>
                <ul className="space-y-1 list-disc list-inside text-blue-700 text-sm md:text-base">
                  <li><a href="#gold-per-round" className="hover:underline">How Much Gold Do You Get Per Round?</a></li>
                  <li><a href="#interest" className="hover:underline">What is Interest in TFT?</a></li>
                  <li><a href="#streaking" className="hover:underline">What is Streaking in TFT?</a></li>
                  <li><a href="#maximizing-gold" className="hover:underline">Why is it Important to Maximize your gold through streaking and interest?</a></li>
                </ul>
              </nav>

              <SectionHeader id="gold-per-round">How Much Gold Do You Get Per Round?</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                You get a minimum of 5 gold per round, but this can be increased through interest (0-5), streaking (0-4), and winning the round (+1). In total, you can get up to 10 extra gold per round if you're able to maximize all your resources.
              </p>

              <SectionHeader id="interest">What is Interest in TFT?</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                Interest in TFT is extra gold you get each round for every 10 gold you have, up to 50 gold. So, at 10 gold you get 1 extra gold from interest, and at 50 gold you get the max of 5 extra gold. In general, it's important to get to 50 gold as soon as possible to maximize your interest every round. Here are some important breakpoints to help you hit those intervals:
              </p>
              <p className="mb-4 pl-4 text-left">
                <strong>13-14g:</strong> This gets you to 19/20g, which starts you on the path to hitting the higher breakpoints.
              </p>
              <p className="mb-4 pl-4 text-left">
                <strong>19-20g:</strong> Obviously, you want to be at 20g if possible (extra gold!), but 19g always gets you to 33g in two turns, 41g in three, and 50g in four.
              </p>
              <p className="mb-4 pl-4 text-left">
                <strong>25-26g:</strong> Here, you're targeting 33g the next round. Win or lose, you're guaranteed to hit 41g in two rounds and 50g in three.
              </p>
              <p className="mb-4 pl-4 text-left">
                <strong>32-33g:</strong> 33g is straightforward - win or lose, you'll reach at least 41g next round. At 32g, if you win, you hit 33g (which we know gets you to 41g). If you lose, you hit 40g with 1 loss banked. This is a common interval to roll down to when you need to dig a little harder for units, since you'll only lose 3 gold worth of interest to get back to 50.
              </p>
              <p className="mb-4 pl-4 text-left">
                <strong>41g:</strong> At 41g, you're guaranteed to hit 50g next turn (41g + 4g from interest + 5g from passive gold).
              </p>
              <p className="mb-4 pl-4 text-left">
                Streaking can change these breakpoints since it gives you more gold. Also, don't forget that winning gives you an extra gold, so the breakpoints above can be reduced by one if that happens. Below is a table showing the breakpoints and the amount of interest you'll get at each:
              </p>

              <img src="/econ-interest-breakpoints-table.png" alt="Table: Current Gold, Interest, Base Gold, Ending Gold" className="my-4 border rounded mx-auto" />
              
              <p className="mb-4 pl-4 text-left text-sm text-gray-600">
                Source: <a href="https://www.reddit.com/r/CompetitiveTFT/comments/trzxoc/quick_guide_to_the_hidden_econ_intervals_or_how/" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900">Quick guide to the hidden econ intervals (Reddit)</a>
              </p>

              <SectionHeader id="streaking">What is Streaking in TFT?</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                In TFT, streaking means either winning several games in a row or losing several in a row. The breakpoints for each are shown in the table below:
              </p>
              <img src="/econ-streak-breakpoints-table.png" alt="Table: Gold Streak Breakpoints" className="my-4 border rounded mx-auto" />
              <p className="mb-4 pl-4 text-left">
                If you're win streaking, you get 3 gold plus one extra gold per win, for a total of 4 extra gold per round - which is the same as having 40 gold in interest. Lose streaking maxes out at 3 extra gold per round, since you don't get any bonus gold for a loss.
              </p>

              <SectionHeader id="maximizing-gold">Why is it Important to Maximize your gold through streaking and interest?</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                First, it's important to note that there are 5 player combats per stage that impact streaks. At the end of each stage, there's one non-player combat round that doesn't affect streaks, but you still get gold from your current streak.
              </p>
              <p className="mb-4 pl-4 text-left">
                Let's compare three players: one who win streaks from 2-1 to 4-1, one who alternates wins and losses until 4-1, and one who lose streaks until 4-1.
              </p>
              <p className="mb-4 pl-4 text-left">
                The tables below show the gold each player gets at each stage and their total gold.
              </p>
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mt-6 md:mt-8 mb-2">Win Streak Gold Breakdown</h3>
              <img src="/econ-win-streak-table.png" alt="Table: Win Streak Gold Breakdown" className="my-4 border rounded mx-auto" />
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mt-6 md:mt-8 mb-2">Lose Streak Gold Breakdown</h3>
              <img src="/econ-lose-streak-table.png" alt="Table: Lose Streak Gold Breakdown" className="my-4 border rounded mx-auto" />
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mt-6 md:mt-8 mb-2">Win/Loss Alternating Gold Breakdown</h3>
              <img src="/econ-win-loss-table.png" alt="Table: Win/Loss Alternating Gold Breakdown" className="my-4 border rounded mx-auto" />
              <p className="mb-4 pl-4 text-left">
                Note: These tables don't account for the health you'd lose while lose streaking, or the gold you'd need to spend to play the strongest board and maintain a win streak. That said, the win streak player can expect about 30 more gold than the win/loss player by 4-1, and the lose streaker can expect about 20 more. This is important to keep in mind when deciding which comp to play.
              </p>
            </>
          } />
        } />
        <Route path="/blog/positioning-units" element={
          <BlogPost title="Positioning Units" content={
            <>
              {/* Table of Contents - static, left-aligned at top */}
              <nav className="mb-8 p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
                <h2 className="text-base md:text-lg font-semibold mb-2 text-gray-800">On this page</h2>
                <ul className="space-y-1 list-disc list-inside text-blue-700 text-sm md:text-base">
                  <li><a href="#basics" className="hover:underline">The Basics</a></li>
                  <li><a href="#backline-carries" className="hover:underline">Positioning Your Backline Carries</a></li>
                  <li><a href="#focusing-units" className="hover:underline">Focusing the Correct Units</a></li>
                  <li><a href="#frontline-carries" className="hover:underline">How to Position Frontline Carries</a></li>
                </ul>
              </nav>

              <SectionHeader id="basics">The Basics</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                There are exceptions, but in general there are units that get placed in the backline and there are units that get placed in the frontline. In the image below you can see that there are four rows. The first row (frontline) is usually where you place melee units and the back row is where you will be placing range units (backline).
              </p>
              <img src="/positioning-basics.png" alt="TFT Board Layout Showing Frontline and Backline Rows" className="my-4 border rounded" />

              <SectionHeader id="backline-carries">Positioning Your Backline Carries</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                The image below shows an example TFT round. Let's assume that on the far board Vayne is the carry and on the close board Kog'Maw is the carry. The objective for both players is to keep their backline carry alive as long as possible. If we take a look at the Kog'Maw player, we can see that the positioning is perfect. The Vayne (and other units) have to kill the frontline, and then will target the Kindred since it is closer than the Kog'Maw. This means that in this match, the Kog'Maw survives as long as possible, which is the objective for this comp.
              </p>
              <p className="mb-4 pl-4 text-left">
                On the other hand, the Vayne board is not positioned correctly. Ideally, the Vayne would be positioned on the other side with its frontline protecting it. This would be better because it would allow Vayne to target the Kog'Maw first, then the Kindred.
              </p>
              <img src="/positioning-backline-example.png" alt="Example of Good vs Bad Backline Positioning" className="my-4 border rounded" />

              <SectionHeader id="focusing-units">Focusing the Correct Units</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                Another thing to take into consideration is having your units target and kill units in the correct sequence. Units gain mana from taking damage and auto-attacking (see our <a href="/blog/mana" className="text-blue-700 underline hover:text-blue-900">blog on mana</a>). Therefore, especially in early-mid game when there is less damage, make sure your backline units don't get stuck attacking the enemy's itemized tank(s) and instead kill the squishier units as soon as possible. This ensures that 1) you kill as many units as possible and 2) you don't allow enemy units to get extra ability casts.
              </p>
              <p className="mb-4 pl-4 text-left">
                To see an example of why both of these are important, let's take a look at this clip from the streamer Dishsoap.
              </p>
              <div className="my-4 flex justify-center">
                <iframe 
                  src="https://clips.twitch.tv/embed?clip=AmericanVastChimpanzeeCclamChamp-GNYupVf-wTAjHBC9&parent=tftpad.com" 
                  frameBorder="0" 
                  allowFullScreen={true} 
                  scrolling="no" 
                  height="378" 
                  width="620"
                  className="border rounded"
                  title="Dishsoap positioning example clip"
                />
              </div>
              <p className="mb-4 pl-4 text-left">
                The first thing you can see is that his Jhin is positioned on the same side as the enemy Vayne. This means that after his frontline dies, the Vayne will target his Jhin first. Ideally, the Jhin is positioned on the opposite side so that Vayne will target the Kog'Maw first, Twisted Fate second, Kindred, and then finally Jhin after his frontline dies.
              </p>
              <p className="mb-4 pl-4 text-left">
                Second, you can see that the Vayne is targeting his Cho'Gath first. While normally it is not a bad idea for your tank with items to be targeted first, Cho'Gath scales with his ability the more he casts. Therefore, it would be a good idea to have him not get targeted first by Vayne.
              </p>
              <p className="mb-4 pl-4 text-left">
                Third, the itemless Illaoi is able to cast three times, which is the equivalent of 1050 health-absurd considering she has less than 1000 health. If he had his backline switched, the Illaoi would have been targeted first and possibly died before casting once.
              </p>
              <p className="mb-4 pl-4 text-left">
                At the end of the clip, you can see that Dishsoap acknowledges his positioning mistake. Who knows-if he had positioned correctly, he might have been able to continue his win streak.
              </p>

              <SectionHeader id="frontline-carries">How to Position Frontline Carries</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                Wrapping is based on the fact that your units will target the closest enemy unit, and this target can change while the unit is moving toward it, as long as it hasn't started attacking. Once your unit kills an enemy unit, a new target is chosen based on proximity.
              </p>
              <p className="mb-4 pl-4 text-left">
                Early game, there are fewer units so you might only have to deal with a few frontline tanks. Therefore, try to position the carry you want to wrap in a line with your other units on the opposite side of the enemy tank(s). This will allow your melee carry to get blocked by your own units and wrap around to the enemy's backline. See an example in the clip below:
              </p>
              <div className="my-4 flex justify-center">
                <iframe 
                  src="https://clips.twitch.tv/embed?clip=ElatedSmilingSowPunchTrees-EtBdL2utTwU1A8fB&parent=tftpad.com" 
                  frameBorder="0" 
                  allowFullScreen={true} 
                  scrolling="no" 
                  height="378" 
                  width="620"
                  className="border rounded"
                />
              </div>
              <p className="mb-4 pl-4 text-left">
                Late game positioning is a little harder because boards will have more units and therefore usually more frontline tanks. You are going to want to position melee carries on the opposite side of your opponent's main tank. The hope here is that once your carry gets through one of the squishier frontline units, it will then choose to move toward the backline and start attacking the backline units. The clip below helps to show this idea:
              </p>
              <div className="my-4 flex justify-center">
                <iframe 
                  src="https://clips.twitch.tv/embed?clip=RelievedManlyKaleOSfrog-m0cDDLk7lieSD5f8&parent=tftpad.com" 
                  frameBorder="0" 
                  allowFullScreen={true} 
                  scrolling="no" 
                  height="378" 
                  width="620"
                  className="border rounded"
                />
              </div>

              {/* References Section */}
              <SectionHeader id="references">References</SectionHeader>
              <ul className="pl-4 text-left list-disc">
                <li>
                  <a href="https://www.reddit.com/r/CompetitiveTFT/comments/1cgmnd7/melee_positioning_101_why_your_carries_are_not/" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900">
                    Melee Positioning 101: Why Your Carries Are Not Wrapping (Reddit)
                  </a>
                </li>
              </ul>
            </>
          } />
        } />
        <Route path="/blog/item-pool" element={
          <BlogPost title="Item Pool" content={
            <>
              {/* Table of Contents - static, left-aligned at top */}
              <nav className="mb-8 p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
                <h2 className="text-base md:text-lg font-semibold mb-2 text-gray-800">On this page</h2>
                <ul className="space-y-1 list-disc list-inside text-blue-700 text-sm md:text-base">
                  <li><a href="#item-bags" className="hover:underline">How Item Bags From Neutrals Work</a></li>
                  <li><a href="#item-slamming" className="hover:underline">Item Slamming and How It Impacts Your Game</a></li>
                  <li><a href="#minimum-components" className="hover:underline">Minimum Number of Components in a TFT Game</a></li>
                </ul>
              </nav>

              <SectionHeader id="item-bags">How Item Bags From Neutrals Work</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                Going into the first neutral round you have two copies of each item component in your 'bag' that can be dropped. When components drop they are taken out of the bag. After each carousel round another of each component is added to the bag. See the video below for how this works:
              </p>
              <p className="mb-4 pl-4 text-left">
                <a href="https://youtube.com/clip/Ugkx1-gfDkiJWiuiNTZEuXWwwQvmdIQydwx7?si=dv8DNikvchXx_ceK" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900">
                  https://youtube.com/clip/Ugkx1-gfDkiJWiuiNTZEuXWwwQvmdIQydwx7?si=dv8DNikvchXx_ceK
                </a>
              </p>
              <div className="my-4 flex justify-center">
                <iframe 
                  width="560" 
                  height="315" 
                  src="https://www.youtube.com/embed/r4X6HAMNbY8?si=dv8DNikvchXx_ceK&amp;clip=Ugkx1-gfDkiJWiuiNTZEuXWwwQvmdIQydwx7&amp;clipt=EMn8ARjUwgQ" 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  referrerPolicy="strict-origin-when-cross-origin" 
                  allowFullScreen
                  className="border rounded"
                />
              </div>
              <p className="mb-4 pl-4 text-left">
                This is important because it can help guide your decisions when choosing items from augments and/or carousel rounds. For example, let's say going into the first carousel two bows have already dropped from neutrals and you are deciding between grabbing another bow or tear.
              </p>
              <p className="mb-4 pl-4 text-left">
                We know that there are 8 basic items(<a href="https://mobalytics.gg/tft/items" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900">https://mobalytics.gg/tft/items</a>) that can be dropped from neutrals, that two bows were dropped before the first carousel, and that after this carousel one more will be added. This means that out of 22 items in our bag, one of them will be a bow, giving a 4.5%(1/22) drop chance on the next neutral round. Since no tears have dropped so far, we have three in our bag, giving us a 13.6%(3/22) chance to get a tear on the next neutral round.
              </p>
              <p className="mb-4 pl-4 text-left">
                Therefore, if we weigh tears and bows equally for our itemization, then it is best to prioritize getting a bow on the first carousel.
              </p>

              <div className="mb-6 mt-8 pl-4">
                <h4 className="font-semibold text-gray-800 mb-3">Item Bag System Breakdown</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Item Bag Mechanics</h5>
                      <div className="space-y-2 text-sm">
                        <div className="p-2 bg-green-50 border border-green-200 rounded">
                          <span className="font-medium">Starting Bag:</span> 2 copies of each component
                        </div>
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                          <span className="font-medium">When Items Drop:</span> Removed from bag
                        </div>
                        <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                          <span className="font-medium">After Carousel:</span> +1 of each component
                        </div>
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <span className="font-medium">Total Components:</span> 8 basic items
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Example: Bow vs Tear Decision</h5>
                      <div className="space-y-2 text-sm">
                        <div className="p-2 bg-red-50 border border-red-200 rounded">
                          <span className="font-medium">Bows dropped:</span> 2 (before carousel)
                        </div>
                        <div className="p-2 bg-green-50 border border-green-200 rounded">
                          <span className="font-medium">Tears dropped:</span> 0
                        </div>
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                          <span className="font-medium">Bows in bag:</span> 1 (4.5% chance)
                        </div>
                        <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                          <span className="font-medium">Tears in bag:</span> 3 (13.6% chance)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6 mt-8 pl-4">
                <h4 className="font-semibold text-gray-800 mb-3">Item Drop Probability Calculation</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 text-left border">Component</th>
                          <th className="p-2 text-left border">Starting Count</th>
                          <th className="p-2 text-left border">Dropped</th>
                          <th className="p-2 text-left border">Remaining</th>
                          <th className="p-2 text-left border">Drop Chance</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2 border">B.F. Sword</td>
                          <td className="p-2 border">2</td>
                          <td className="p-2 border">0</td>
                          <td className="p-2 border">2</td>
                          <td className="p-2 border">9.1%</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 border">Recurve Bow</td>
                          <td className="p-2 border">2</td>
                          <td className="p-2 border">2</td>
                          <td className="p-2 border">0</td>
                          <td className="p-2 border">0%</td>
                        </tr>
                        <tr className="border-b bg-blue-50">
                          <td className="p-2 border">Tear of the Goddess</td>
                          <td className="p-2 border">2</td>
                          <td className="p-2 border">0</td>
                          <td className="p-2 border">2</td>
                          <td className="p-2 border">9.1%</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 border">Chain Vest</td>
                          <td className="p-2 border">2</td>
                          <td className="p-2 border">0</td>
                          <td className="p-2 border">2</td>
                          <td className="p-2 border">9.1%</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 border">Negatron Cloak</td>
                          <td className="p-2 border">2</td>
                          <td className="p-2 border">0</td>
                          <td className="p-2 border">2</td>
                          <td className="p-2 border">9.1%</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 border">Giant's Belt</td>
                          <td className="p-2 border">2</td>
                          <td className="p-2 border">0</td>
                          <td className="p-2 border">2</td>
                          <td className="p-2 border">9.1%</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 border">Sparring Glove</td>
                          <td className="p-2 border">2</td>
                          <td className="p-2 border">0</td>
                          <td className="p-2 border">2</td>
                          <td className="p-2 border">9.1%</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 border">Needlessly Large Rod</td>
                          <td className="p-2 border">2</td>
                          <td className="p-2 border">0</td>
                          <td className="p-2 border">2</td>
                          <td className="p-2 border">9.1%</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="p-2 border font-medium">Total</td>
                          <td className="p-2 border font-medium">16</td>
                          <td className="p-2 border font-medium">2</td>
                          <td className="p-2 border font-medium">14</td>
                          <td className="p-2 border font-medium">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                    <p className="text-sm font-medium text-orange-800">After Carousel Addition:</p>
                    <p className="text-sm text-orange-700">• +1 of each component added to bag</p>
                    <p className="text-sm text-orange-700">• Bow count: 0 → 1 (4.5% chance)</p>
                    <p className="text-sm text-orange-700">• Tear count: 2 → 3 (13.6% chance)</p>
                  </div>
                </div>
              </div>

              <SectionHeader id="item-slamming">Item Slamming and How It Impacts Your Game</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                Item slamming is the process of making items from components when you might otherwise save the individual components to make a best in slot(BIS) item. The main benefit of this is that it can help you save health early game, or continue a win streak so that you can get more gold relative to the lobby. On the other hand, slamming items has the potential to make your end game board weaker due to your items not being BIS.
              </p>
              <p className="mb-4 pl-4 text-left">
                Everyone is going to have different 'rules' when it comes to slamming items - for example, never having more than two components on a bench, or only saving components when lose streaking.
              </p>
              <p className="mb-4 pl-4 text-left">
                When it comes down to it, I think a more flexible approach where you consider the opportunity cost of slamming a pair of components is better once you have a better grasp on items.
              </p>
              <p className="mb-4 pl-4 text-left">
                To provide an example of this, let's say I get a chain vest and a tear on second neutrals. My first thought would be: what can I make with these components if I don't slam them into a protector's vow? Do I already have shred (void staff)? Is the composition I'm building toward going to need a mana generation item (blue buff/shojin/adaptive)? Do I already have heal cut (sunfire cape)? By slamming vow, you are losing a component that might be needed to make one of these core items for your composition.
              </p>
              <p className="mb-4 pl-4 text-left">
                Another thing to consider is your position in the game relative to other people. If you are win streaking you might want to slam an item in order to keep your streak. If you are lose streaking, it won't really matter if you slam the item, and you will want to save it so that you can get BIS items. If you aren't lose streaking, but are lower health, maybe you need to slam an item to preserve health - plus you are more likely to get needed components on future carousels due to your earlier pick order.
              </p>
              <p className="mb-4 pl-4 text-left">
                If you take this more flexible approach, I believe it will allow you to make sure you utilize the components most effectively while at the same time allowing you to slam when you need to.
              </p>

              <SectionHeader id="minimum-components">Minimum Number of Components in a TFT Game</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                As of patch 14.4(Set 14) the minimum number of components that can drop from PVE rounds is 9. This plus carousel components means that the minimum components by the end of stage 4 would be 12. This is the equivalent of 6 total items - three for your frontline tank and three for your backline carry.
              </p>
              <p className="mb-4 pl-4 text-left">
                If you find yourself in a situation where you are expecting to have the minimum amount of items, it is actually more important to slam items than to save for BIS. Always think about your current position in the game. If you are already approaching 3 tank items, start thinking about slamming 'tank' components on offensive items, as you do not want to be stuck putting a tank item on a unit that doesn't utilize it effectively.
              </p>
              <p className="mb-4 pl-4 text-left">
                Here is a good example from <a href="https://www.reddit.com/r/CompetitiveTFT/comments/1kol9eg/patch_144_loot_changes_less_items_how_to_adjust/" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900">https://www.reddit.com/r/CompetitiveTFT/comments/1kol9eg/patch_144_loot_changes_less_items_how_to_adjust/</a>:
              </p>
              <blockquote className="mb-4 pl-4 text-left border-l-4 border-gray-300 pl-4 italic">
                'A quick example is being more willing to slam flexible items that build out of cloak, tear and belt. Let's say you already have full tank items but you get dropped a tear cloak in stage 3 as your 7th and 8th component. Don't hold the tear to make shojin if it's BIS in your comp, the cloak will now be a lot harder to use since you already have a full set of tank items. Now, you might not have an extra two components at the end of stage 4 to complete your carry items so it's a lot better to just slam the adaptive helm as one of your AP carry items. This is actually a concept that challenger players already implement and they will tell you BIS is often fake. This is even more true now with less items.'
              </blockquote>

              {/* References Section */}
              <SectionHeader id="references">References</SectionHeader>
              <ul className="pl-4 text-left list-disc">
                <li>
                  <a href="https://www.reddit.com/r/CompetitiveTFT/comments/fwh6au/item_pool_explination_information_from_mort/" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900">
                    Item Pool Explanation Information from Mort (Reddit)
                  </a>
                </li>
                <li>
                  <a href="https://www.reddit.com/r/CompetitiveTFT/comments/1kol9eg/patch_144_loot_changes_less_items_how_to_adjust/" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900">
                    Patch 14.4 Loot Changes - Less Items, How to Adjust (Reddit)
                  </a>
                </li>
              </ul>
            </>
          } />
        } />
        <Route path="/blog/understanding-dmg" element={
  <BlogPost title="Understanding DMG" content={
    <>
      {/* Table of Contents - static, left-aligned at top */}
      <nav className="mb-8 p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
        <h2 className="text-base md:text-lg font-semibold mb-2 text-gray-800">On this page</h2>
        <ul className="space-y-1 list-disc list-inside text-blue-700 text-sm md:text-base">
          <li><a href="#types-of-damage" className="hover:underline">Types of Damage</a></li>
          <li><a href="#ways-to-increase-damage" className="hover:underline">Ways to Increase the Damage of Your Units</a>
            <ul className="ml-8 mt-1 space-y-1">
              <li><a href="#attack-damage" className="hover:underline">• Attack Damage</a></li>
              <li><a href="#ability-power" className="hover:underline">• Ability Power</a></li>
              <li><a href="#crit" className="hover:underline">• Crit</a></li>
              <li><a href="#damage-amp" className="hover:underline">• Damage Amp</a></li>
            </ul>
          </li>
                            <li><a href="#how-damage-amp-works-together" className="hover:underline">How Does Damage Amplification Work Together?</a></li>
                      <li><a href="#damage-amp-and-reduction" className="hover:underline">How Damage Amp and Damage Reduction Work Together</a></li>
        </ul>
      </nav>

      <SectionHeader id="types-of-damage">Types of Damage</SectionHeader>
      <p className="text-left">
        As of TFT set 14, there are three forms of damage.
      </p>
      <ul className="list-disc pl-6 space-y-2 text-left">
        <li><strong>Magic Damage</strong> - reduced by magic resistance and damage reduction</li>
        <li><strong>Attack Damage</strong> - reduced by armor and damage reduction</li>
        <li><strong>True Damage</strong> - does not get mitigated</li>
      </ul>
      <p className="mt-4 text-left">
        For more information on how much damage is reduced by these defenses, check out the blog on <a href="/blog/defensive-stats" className="text-blue-700 underline hover:text-blue-900">Defensive Stats</a>.
      </p>

      <SectionHeader id="ways-to-increase-damage">Ways to Increase the Damage of Your Units</SectionHeader>
      
      <SubHeader id="attack-damage">Attack Damage</SubHeader>
      <p className="text-left">
        Items give attack damage (AD) in the form of a percentage. This percentage increases the champion's base AD by that percentage, which then impacts the damage of auto attacks and AD-scaling abilities.
      </p>
      <p className="text-left">
        For example, in TFT set 14, Deathblade gives a 55% increase in AD. If we placed this item on a 2-star Senna who has 127.5 base AD, then we could calculate her new AD with the following formula:
      </p>
      <p className="font-mono bg-gray-100 p-3 rounded my-4 text-left">
        Base ad + (base ad * ad%) = Total AD
      </p>
      <p className="text-left">
        In this case, her new AD would be 127.5 + (127.5 × 0.55) = 197.625.
      </p>

      <div className="mb-6 mt-8">
        <h4 className="font-semibold text-gray-800 mb-3">AD Calculation Breakdown</h4>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-700 mb-3">Formula Components</h5>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <span className="font-medium">Base AD:</span> Starting attack damage
                </div>
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <span className="font-medium">AD%:</span> Percentage increase from items
                </div>
                <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                  <span className="font-medium">Total AD:</span> Final attack damage
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-3">Senna Example</h5>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <span className="font-medium">Base AD:</span> 127.5
                </div>
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <span className="font-medium">Deathblade bonus:</span> 55%
                </div>
                <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                  <span className="font-medium">Calculation:</span><br/>
                  127.5 + (127.5 × 0.55) = <span className="text-purple-600 font-semibold">197.625 AD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SubHeader id="ability-power">Ability Power</SubHeader>
      <p className="text-left">
        Items give ability power in the form of a real number, but similar to attack damage, this actually equates to a percentage increase. Every unit starts off with 100 ability power, and ability power adds to this (i.e., +10 ability power → 110 ability power).
      </p>
      <p className="text-left">
        Let's take Veigar from set 14. His ability has the following description: 'Deal 320 / 420 / 560% AP as magic damage'. With 110 ability power, he would be doing 320 × 1.1 damage as a 1-star unit. You can think of ability power as either a percentage increase to the ability's damage, or as the ability being a percentage of your total ability power.
      </p>

      <div className="mb-6 mt-8">
        <h4 className="font-semibold text-gray-800 mb-3">Ability Power System</h4>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-700 mb-3">AP System Overview</h5>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <span className="font-medium">Base AP:</span> 100 (all units start here)
                </div>
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <span className="font-medium">Item AP:</span> Adds directly (e.g., +10 AP)
                </div>
                <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                  <span className="font-medium">Total AP:</span> 100 + Item bonuses
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-3">Veigar Example</h5>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <span className="font-medium">Base AP:</span> 100
                </div>
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <span className="font-medium">Item bonus:</span> +10 AP
                </div>
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <span className="font-medium">Total AP:</span> 110 (110% of base)
                </div>
                <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                  <span className="font-medium">1★ Ability damage:</span><br/>
                  320% × 1.1 = <span className="text-purple-600 font-semibold">352% AP damage</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SubHeader id="crit">Crit</SubHeader>
      <p className="text-left">
        Items that give crit increase the chance that your auto attacks deal 130% damage. If a unit is itemized with Jeweled Gauntlet or Infinity Edge, their abilities can also crit.
      </p>
      <p className="text-left">
        The formula below can be used to calculate the expected damage increase from a given crit chance.
      </p>
      <p className="font-mono bg-gray-100 p-3 rounded my-4 text-left">
        Expected Damage = (Crit Chance × Crit Damage) + (Non-Crit Chance × Non-Crit Damage)
      </p>
      <p className="text-left">
        Therefore, with an expected crit chance of 80%, we can calculate the equivalent damage amp from crit as follows:
      </p>
      <p className="font-mono bg-gray-100 p-3 rounded my-4 text-left">
        1.24 = (0.8 × 1.3) + (0.2 × 1)
      </p>
      <p className="text-left">
        Excess crit chance is converted into bonus damage at a 2:1 ratio, meaning for every 2% of crit chance above 100%, the unit gains 1% bonus crit damage. Therefore, if we had a 120% crit chance, the Crit Damage multiplier in the formula above would go from 1.3 to 1.4.
      </p>

      <div className="mb-6 mt-8">
        <h4 className="font-semibold text-gray-800 mb-3">Critical Strike System</h4>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-700 mb-3">Crit Mechanics</h5>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <span className="font-medium">Normal Damage:</span> 100% (base damage)
                </div>
                <div className="p-2 bg-red-50 border border-red-200 rounded">
                  <span className="font-medium">Crit Damage:</span> 130% (30% bonus)
                </div>
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <span className="font-medium">Excess Crit:</span> 2:1 ratio above 100%
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-3">80% Crit Example</h5>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <span className="font-medium">Crit hits:</span> 80% × 130% = 104%
                </div>
                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <span className="font-medium">Normal hits:</span> 20% × 100% = 20%
                </div>
                <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                  <span className="font-medium">Total:</span> 104% + 20% = <span className="text-purple-600 font-semibold">124% damage</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SubHeader id="damage-amp">Damage Amp</SubHeader>
      <p className="text-left">
        Damage Amp is pretty simple - it multiplies with other damage sources to increase the total damage output of all damage that a unit deals.
      </p>

      <div className="mb-6 mt-8">
        <h4 className="font-semibold text-gray-800 mb-3">Damage Amplification Overview</h4>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-700 mb-3">How Damage Amp Works</h5>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <span className="font-medium">Base Damage:</span> 100% (starting point)
                </div>
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <span className="font-medium">Damage Amp:</span> Multiplies total damage
                </div>
                <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                  <span className="font-medium">Final Damage:</span> Base × Amp multiplier
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-3">Example: 20% Damage Amp</h5>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <span className="font-medium">Base damage:</span> 100
                </div>
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <span className="font-medium">Amp multiplier:</span> 1.20 (20% increase)
                </div>
                <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                  <span className="font-medium">Final damage:</span> 100 × 1.20 = <span className="text-purple-600 font-semibold">120</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

              <SectionHeader id="how-damage-amp-works-together">How Does Damage Amplification Work Together?</SectionHeader>
      <p className="text-left">
        There are three 'buckets' (AD/AP, crit, and damage amp). Damage within the same bucket is additive. This means that if you have multiple sources of damage amp, those are added and not multiplied. Damage between buckets is multiplied. See the video below for Mortdog's explanation:
      </p>
      
      <div className="my-6">
        <iframe 
          width="560" 
          height="315" 
          src="https://www.youtube.com/embed/lg2aWkSDibk?si=RAfZfi5hRfEd2KNb" 
          title="YouTube video player" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          referrerPolicy="strict-origin-when-cross-origin" 
          allowFullScreen
          className="w-full max-w-2xl mx-auto"
        ></iframe>
      </div>

      <p className="text-left">
        To show an example of how this works for a specific unit, let's say we want to find out the damage (before resistance mitigation) of an auto attack that our unit is dealing. We have the following forms of amp:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-left">
        <li>120% AD</li>
        <li>20% amp</li>
        <li>80% crit</li>
      </ul>
      <p className="text-left">
        Based on this, we can calculate the total damage amp of this auto attack by multiplying these stats together. See below:
      </p>
      <p className="font-mono bg-gray-100 p-3 rounded my-4 text-left">
        1.20 × 1.20 × ((0.8×1.3)+(0.2×1))<br/>
        1.20 × 1.20 × 1.24 = 1.79
      </p>
      <p className="text-left">
        The result would be a multiplier of 1.79 for the unit's base AD that would directly impact the unit's damage per auto.
      </p>
      <p className="text-left">
        I should note that the equation for crit calculates the average damage amp and may not be consistent between rounds that have a smaller sample size of auto attacks, which leads to more variance.
      </p>

      <div className="mb-6 mt-8">
        <h4 className="font-semibold text-gray-800 mb-3">Complete Damage Calculation Example</h4>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-700 mb-3">Input Stats</h5>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <span className="font-medium">AD Bucket:</span> 120% AD
                </div>
                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <span className="font-medium">Crit Bucket:</span> 80% crit chance
                </div>
                <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                  <span className="font-medium">Amp Bucket:</span> 20% damage amp
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-3">Step-by-Step Calculation</h5>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <span className="font-medium">1. Crit calculation:</span><br/>
                  (0.8 × 1.3) + (0.2 × 1) = 1.24
                </div>
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <span className="font-medium">2. Multiply buckets:</span><br/>
                  1.20 × 1.20 × 1.24
                </div>
                <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                  <span className="font-medium">3. Final result:</span><br/>
                  <span className="text-purple-600 font-semibold">1.79x damage multiplier</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

              <SectionHeader id="damage-amp-and-reduction">How Damage Amp and Damage Reduction Work Together</SectionHeader>
      <p className="text-left">
        Now let's make the example above more realistic by factoring in damage reduction. To better understand how this works, let's watch the video below:
      </p>
      
      <div className="my-6">
        <iframe 
          width="560" 
          height="315" 
          src="https://www.youtube.com/embed/Pm5eqIQ_7tc?si=e2vtjStm2GzY-MHo" 
          title="YouTube video player" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          referrerPolicy="strict-origin-when-cross-origin" 
          allowFullScreen
          className="w-full max-w-2xl mx-auto"
        ></iframe>
      </div>

      <p className="text-left">
        In this video, Mortdog mentions that all of the damage amp in the 'buckets' are calculated, and once this damage amp is applied to the base damage, then the damage reduction is applied.
      </p>
      <p className="text-left">
        Therefore, to continue our example, let's say our 2-star Senna has the multiplier 1.79 that we calculated above applied to her AD. She attacks the enemy Leona who has damage reduction equal to 40% for AD attacks (for more detail on reduction calculations, check out <a href="/blog/defensive-stats" className="text-blue-700 underline hover:text-blue-900">Defensive Stats</a>). The calculation from this point would be quite simple: we would just take the multiplier (1.79) × 2-star Senna's base AD (127.5) × (1 - damage reduction) (0.6) = 137 damage per auto.
      </p>

      <div className="mb-6 mt-8">
        <h4 className="font-semibold text-gray-800 mb-3">Final Damage Calculation with Reduction</h4>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-700 mb-3">Complete Formula</h5>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-mono text-blue-800">
                  Final Damage = (Base AD × Damage Multiplier) × (1 - Damage Reduction)
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-2">Damage amp is calculated first, then reduction is applied.</p>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-3">Example: 2★ Senna vs Leona</h5>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <span className="font-medium">Base AD:</span> 127.5
                </div>
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <span className="font-medium">Damage multiplier:</span> 1.79 (from previous calc)
                </div>
                <div className="p-2 bg-red-50 border border-red-200 rounded">
                  <span className="font-medium">Leona's reduction:</span> 40% (60% damage taken)
                </div>
                <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                  <span className="font-medium">Final calculation:</span><br/>
                  127.5 × 1.79 × 0.6 = <span className="text-purple-600 font-semibold">137 damage</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  } />
} />
        <Route path="/blog/mana" element={
          <BlogPost title="Mana" content={
            <>
              {/* Table of Contents - static, left-aligned at top */}
              <nav className="mb-8 p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
                <h2 className="text-base md:text-lg font-semibold mb-2 text-gray-800">On this page</h2>
                <ul className="space-y-1 list-disc list-inside text-blue-700 text-sm md:text-base">
                  <li><a href="#how-mana-generated" className="hover:underline">How is Mana Generated?</a></li>
                  <li><a href="#attack-speed-comparison" className="hover:underline">What Level of Bonus Attack Speed is Comparable to Mana Generation Items?</a></li>
                  <li><a href="#health-vs-damage-reduction" className="hover:underline">Health vs Damage Reduction for Generating Mana on Tanks</a></li>
                  <li><a href="#shojin-vs-adaptive-vs-blue-buff" className="hover:underline">Shojin vs Adaptive vs Blue Buff</a></li>
                  <li><a href="#adaptive-vs-protectors" className="hover:underline">Adaptive Helm vs Protector's Vow</a></li>
                </ul>
              </nav>

              <SectionHeader id="how-mana-generated">How is Mana Generated?</SectionHeader>
              <p className="mb-4 pl-4 text-left">Mana is generated from basic attacking and taking damage. All Units generate 10 mana from basic attacks. Mana from Taking damage is a little less straightforward with 1% of pre-mitigation damage and 3% of post-mitigation damage being converted into mana up to 42.5 depending on pre-mitigated damage.</p>
              <p className="mb-4 pl-4 text-left">Mana that is overflowed will be carried into the starting mana for the unit after they cast(i.e 90/80 → 10/80).</p>
              <p className="mb-4 pl-4 text-left">Source: <a href="https://wiki.leagueoflegends.com/en-us/TFT:Mana" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900">https://wiki.leagueoflegends.com/en-us/TFT:Mana</a></p>

              <SectionHeader id="attack-speed-comparison">What Level of Bonus Attack Speed is Comparable to Mana Generation Items?</SectionHeader>
              <p className="mb-4 pl-4 text-left">In our comparison we are going to be comparing the attack speed items Guinsoos, Nashors, and Red Buff to the mana generating item Spear of Shojin. Below are the descriptions for each item</p>
              
              <div className="mb-6 pl-4">
                <h4 className="font-semibold text-gray-800 mb-4">Item Descriptions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <h5 className="font-medium text-gray-700 mb-3">Spear of Shojin</h5>
                    <img src="/spear.png" alt="Spear of Shojin" className="mx-auto border rounded" />
                  </div>
                  <div className="text-center">
                    <h5 className="font-medium text-gray-700 mb-3">Nashor's Tooth</h5>
                    <img src="/nashor.png" alt="Nashor's Tooth" className="mx-auto border rounded" />
                  </div>
                  <div className="text-center">
                    <h5 className="font-medium text-gray-700 mb-3">Guinsoo's Rageblade</h5>
                    <img src="/guinsoo.png" alt="Guinsoo's Rageblade" className="mx-auto border rounded" />
                  </div>
                  <div className="text-center">
                    <h5 className="font-medium text-gray-700 mb-3">Red Buff</h5>
                    <img src="/refbuff.png" alt="Red Buff" className="mx-auto border rounded" />
                  </div>
                </div>
              </div>

              <p className="mb-4 pl-4 text-left">The starting mana for Spear of Shojin is +15, which equates to 3 procs of the +5 bonus Mana per attack that it provides. 5 mana is worth half of the mana generation from an auto attack - therefore, a 50% attack speed increase is equivalent to the passive of Shojin.</p>
              
              <div className="mb-6 pl-4">
                <h4 className="font-semibold text-gray-800 mb-3">Red Buff vs Shojin Comparison</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Red Buff</h5>
                      <ul className="text-sm space-y-1">
                        <li>• +35% attack speed</li>
                        <li>• Mana generation: 135% (100% + 35%)</li>
                        <li>• No starting mana bonus</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Spear of Shojin</h5>
                      <ul className="text-sm space-y-1">
                        <li>• +5 mana per attack</li>
                        <li>• Mana generation: 150% (equivalent to 50% attack speed)</li>
                        <li>• +15 starting mana</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm font-medium text-blue-800">Calculation:</p>
                    <p className="text-sm text-blue-700">Shojin advantage = (150% - 135%) ÷ 135% = 11.1% better mana generation</p>
                  </div>
                </div>
              </div>
              <p className="mb-4 pl-4 text-left">The other two items are a little different and harder to compare. Nashor's Tooth doesn't provide its Attack Speed passive until after the champion's first cast. Therefore, it will be worse on units that require more mana to get their first cast.</p>
              
              <div className="mb-6 pl-4">
                <h4 className="font-semibold text-gray-800 mb-3">Nashor's Tooth vs Shojin (After First Cast)</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Nashor's Tooth (Active)</h5>
                      <ul className="text-sm space-y-1">
                        <li>• +60% attack speed (after first cast)</li>
                        <li>• +10% base attack speed</li>
                        <li>• Total: 170% mana generation</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Spear of Shojin</h5>
                      <ul className="text-sm space-y-1">
                        <li>• +5 mana per attack</li>
                        <li>• Mana generation: 150%</li>
                        <li>• +15 starting mana</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm font-medium text-green-800">Calculation:</p>
                    <p className="text-sm text-green-700">Nashor's advantage = (170% - 150%) ÷ 150% = 13.3% better mana generation</p>
                  </div>
                </div>
              </div>
              <p className="mb-4 pl-4 text-left">This is why we often see Blue Buff + Nashor's Tooth as best-in-slot (BIS) for units with lower mana thresholds to cast.</p>
              <p className="mb-4 pl-4 text-left">Guinsoo's Rageblade is also an interesting attack speed item that gives 7% stacking attack speed per second.</p>
              
              <div className="mb-6 pl-4">
                <h4 className="font-semibold text-gray-800 mb-3">Guinsoo's Rageblade Scaling</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2 px-3">Time (seconds)</th>
                          <th className="text-left py-2 px-3">Attack Speed Bonus</th>
                          <th className="text-left py-2 px-3">Total Attack Speed</th>
                          <th className="text-left py-2 px-3">vs Shojin (150%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 px-3">0s</td>
                          <td className="py-2 px-3">10%</td>
                          <td className="py-2 px-3">110%</td>
                          <td className="py-2 px-3 text-red-600">-26.7%</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 px-3">3s</td>
                          <td className="py-2 px-3">21%</td>
                          <td className="py-2 px-3">131%</td>
                          <td className="py-2 px-3 text-red-600">-12.7%</td>
                        </tr>
                        <tr className="border-b border-gray-200 bg-yellow-50">
                          <td className="py-2 px-3 font-medium">6s</td>
                          <td className="py-2 px-3 font-medium">42%</td>
                          <td className="py-2 px-3 font-medium">152%</td>
                          <td className="py-2 px-3 font-medium text-green-600">+1.3%</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 px-3">9s</td>
                          <td className="py-2 px-3">63%</td>
                          <td className="py-2 px-3">173%</td>
                          <td className="py-2 px-3 text-green-600">+15.3%</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3">12s</td>
                          <td className="py-2 px-3">84%</td>
                          <td className="py-2 px-3">194%</td>
                          <td className="py-2 px-3 text-green-600">+29.3%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                    <p className="text-sm font-medium text-orange-800">Key Insight:</p>
                    <p className="text-sm text-orange-700">Guinsoo's becomes better than Shojin after ~6 seconds, making it ideal for long fights and stall comps.</p>
                  </div>
                </div>
              </div>
              <p className="mb-4 pl-4 text-left">Note: The above comparisons do not take into consideration Shojin's +15 starting mana. This is equivalent to 1.5 auto attacks worth of mana, which is more significant on units with slower base attack speed.</p>

              <SectionHeader id="health-vs-damage-reduction">Health vs Damage Reduction for Generating Mana on Tanks</SectionHeader>
              <p className="mb-4 pl-4 text-left">When taking damage, units generate mana based on: 1% of pre-mitigation damage and 3% of post-mitigation damage, up to a maximum of 42.5 mana per damage instance.</p>
              <p className="mb-4 pl-4 text-left">To understand this comparison, we need to clarify what pre-mitigation and post-mitigation damage mean.</p>
              <p className="mb-4 pl-4 text-left">Let's say we have a tank with 4000 health and 30% damage reduction to physical attacks (see <a href="https://tftpad.com/blog/defensive-stats" className="text-blue-700 underline hover:text-blue-900">our defensive stats guide</a> for damage reduction calculations). Another unit attacks this tank with 1000 physical damage.</p>
              
              <div className="mb-6 pl-4">
                <h4 className="font-semibold text-gray-800 mb-3">Mana Generation Calculation (30% Damage Reduction)</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Input Values</h5>
                      <ul className="text-sm space-y-2">
                        <li><span className="font-medium">Incoming Damage:</span> 1000</li>
                        <li><span className="font-medium">Damage Reduction:</span> 30%</li>
                        <li><span className="font-medium">Pre-mitigation:</span> 1000 damage</li>
                        <li><span className="font-medium">Post-mitigation:</span> 1000 × (1 - 0.3) = 700 damage</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Mana Generation</h5>
                      <div className="space-y-2 text-sm">
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                          <span className="font-medium">Pre-mitigation mana:</span><br/>
                          1000 × 1% = <span className="text-blue-600 font-semibold">10 mana</span>
                        </div>
                        <div className="p-2 bg-green-50 border border-green-200 rounded">
                          <span className="font-medium">Post-mitigation mana:</span><br/>
                          700 × 3% = <span className="text-green-600 font-semibold">21 mana</span>
                        </div>
                        <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                          <span className="font-medium">Total mana generated:</span><br/>
                          10 + 21 = <span className="text-purple-600 font-semibold">31 mana</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mb-4 pl-4 text-left">Therefore, the unit takes 700 damage and generates 31 mana. As you can see, the equation favors post-mitigation damage, so units with lower damage reduction actually generate more mana from taking damage.</p>
              <p className="mb-4 pl-4 text-left">Units with heavy damage reduction mechanics will generate significantly less mana than units with health stacking/healing mechanics (think of Mundo vs Leona in Set 14).</p>
              <p className="mb-4 pl-4 text-left">Now let's increase the damage reduction to 70% for the same tank.</p>
              
              <div className="mb-6 pl-4">
                <h4 className="font-semibold text-gray-800 mb-3">Mana Generation Calculation (70% Damage Reduction)</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Input Values</h5>
                      <ul className="text-sm space-y-2">
                        <li><span className="font-medium">Incoming Damage:</span> 1000</li>
                        <li><span className="font-medium">Damage Reduction:</span> 70%</li>
                        <li><span className="font-medium">Pre-mitigation:</span> 1000 damage</li>
                        <li><span className="font-medium">Post-mitigation:</span> 1000 × (1 - 0.7) = 300 damage</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Mana Generation</h5>
                      <div className="space-y-2 text-sm">
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                          <span className="font-medium">Pre-mitigation mana:</span><br/>
                          1000 × 1% = <span className="text-blue-600 font-semibold">10 mana</span>
                        </div>
                        <div className="p-2 bg-green-50 border border-green-200 rounded">
                          <span className="font-medium">Post-mitigation mana:</span><br/>
                          300 × 3% = <span className="text-green-600 font-semibold">9 mana</span>
                        </div>
                        <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                          <span className="font-medium">Total mana generated:</span><br/>
                          10 + 9 = <span className="text-purple-600 font-semibold">19 mana</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm font-medium text-red-800">Comparison:</p>
                    <p className="text-sm text-red-700">70% reduction: 19 mana vs 30% reduction: 31 mana = 38.7% less mana generation</p>
                  </div>
                </div>
              </div>

              <SectionHeader id="shojin-vs-adaptive-vs-blue-buff">Shojin vs Adaptive vs Blue Buff</SectionHeader>
              <p className="mb-4 pl-4 text-left">This <a href="https://docs.google.com/spreadsheets/d/1pWt8T70A0UMYVERvFeenXxgKOxetLiL8/edit?gid=1772114592#gid=1772114592" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900">spreadsheet</a> from <a href="https://www.reddit.com/r/CompetitiveTFT/comments/1igxmwo/an_indepth_look_at_blue_buff_vs_spear_of_shojin/" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900">this Reddit post</a> shows that Blue Buff is only better on units with less than 40 mana. According to the data, Shojin is always better on units with 40 or more mana. This can change when there are other sources of mana (like Dynamo) that allow units to cast faster, making Blue Buff better because it gives 10 starting mana on cast.</p>
              <p className="mb-4 pl-4 text-left">Adaptive Helm is more similar to Shojin than Blue Buff in terms of use cases. It gives 10 mana every 3 seconds and the same base mana as Shojin.</p>
              
              <div className="mb-6 pl-4">
                <h4 className="font-semibold text-gray-800 mb-3">Adaptive Helm vs Shojin Comparison</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Adaptive Helm</h5>
                      <ul className="text-sm space-y-1">
                        <li>• +10 mana every 3 seconds</li>
                        <li>• +15 starting mana</li>
                        <li>• Consistent mana generation</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Spear of Shojin</h5>
                      <ul className="text-sm space-y-1">
                        <li>• +5 mana per attack</li>
                        <li>• +15 starting mana</li>
                        <li>• Attack speed dependent</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm font-medium text-yellow-800">Example Calculation (Brand/Annie with 0.75 attack speed):</p>
                    <p className="text-sm text-yellow-700">Shojin: 0.75 attacks/sec × 3 sec × 5 mana = 11.25 mana</p>
                    <p className="text-sm text-yellow-700">Adaptive: 10 mana (fixed)</p>
                    <p className="text-sm font-medium text-yellow-800">Result: Shojin is 12.5% better for this unit</p>
                  </div>
                </div>
              </div>
              <p className="mb-4 pl-4 text-left">Another consideration is that Shojin uses a sword component, which is great for AP comps that don't have many other uses for swords outside of Gunblade.</p>

              <SectionHeader id="adaptive-vs-protectors">Adaptive Helm vs Protector's Vow</SectionHeader>
              <p className="mb-4 pl-4 text-left">When used in the front two rows, Adaptive Helm gives 1 mana when struck by an attack, plus 15 starting mana.</p>
              <p className="mb-4 pl-4 text-left">If we compare this to Protector's Vow, it gives +30 starting mana, but no extra mana generation.</p>
              
              <div className="mb-6 pl-4">
                <h4 className="font-semibold text-gray-800 mb-3">Adaptive Helm vs Protector's Vow Comparison</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Adaptive Helm</h5>
                      <ul className="text-sm space-y-1">
                        <li>• +15 starting mana</li>
                        <li>• +1 mana per attack taken</li>
                        <li>• Scales with incoming damage</li>
                        <li>• Better for sustained fights</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Protector's Vow</h5>
                      <ul className="text-sm space-y-1">
                        <li>• +30 starting mana</li>
                        <li>• No additional mana generation</li>
                        <li>• Immediate mana advantage</li>
                        <li>• Better for first cast</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded">
                    <p className="text-sm font-medium text-purple-800">Break-even Analysis:</p>
                    <p className="text-sm text-purple-700">Protector's Vow advantage: 30 - 15 = 15 extra starting mana</p>
                    <p className="text-sm text-purple-700">Adaptive Helm catches up: 15 attacks × 1 mana = 15 mana</p>
                    <p className="text-sm font-medium text-purple-800">Break-even point: After 15 attacks taken</p>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm font-medium text-blue-800">Recommendation:</p>
                    <p className="text-sm text-blue-700">• Protector's Vow: Better for CC-focused tanks needing first cast</p>
                    <p className="text-sm text-blue-700">• Adaptive Helm: Better for sustain tanks in long fights</p>
                  </div>
                </div>
              </div>
            </>
          } />
        } />
        <Route path="/blog/base-stats-comparison" element={
          <BlogPost title="Comparing Units Base Stats" content={
            <>
              {/* Table of Contents - static, left-aligned at top */}
              <nav className="mb-8 p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
                <h2 className="text-base md:text-lg font-semibold mb-2 text-gray-800">On this page</h2>
                <ul className="space-y-1 list-disc list-inside text-blue-700 text-sm md:text-base">
                  <li><a href="#base-stats-difference" className="hover:underline">What Is the Difference Between Base Stats of Units Between Tiers?</a></li>
                                      <li><a href="#ad-growth" className="hover:underline">Comparing AD Growth of Units</a></li>
                  <li><a href="#health-growth" className="hover:underline">Comparing Health Growth of Units</a></li>
                                      <li><a href="#prioritizing-units" className="hover:underline">Thinking About Base Stats When Prioritizing Units</a></li>
                                      <li><a href="#survivability" className="hover:underline">How Much Does Starring a Unit Up Increase Its Survivability</a></li>
                  <li><a href="#tier-comparison" className="hover:underline">Are 2* units at lower tiers tankier than 1* units at higher tiers?</a></li>
                </ul>
              </nav>

              <SectionHeader id="base-stats-difference">What Is the Difference Between Base Stats of Units Between Tiers?</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                The stats that change as units star-up are ability base dmg, attack damage, and health. In general these stats multiply by about 1.8x per star level. 3★ 4 and 5 costs grow at an even higher rate.
              </p>
              <p className="mb-4 pl-4 text-left">
                This means that starring up your frontline carries (i.e., Zed, Graves, etc.) is extra important because they benefit from all three stats (AD, health, and ability damage), unlike frontline tanks who mainly care about health or backline carries who mainly care about AD and ability damage.
              </p>
              <p className="mb-4 pl-4 text-left">
                I will note that ability damage also goes up per star level, but this varies on every unit so I am not going to go over it in this article.
              </p>

              <SectionHeader id="ad-growth">Comparing AD Growth of Units</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                Below we will compare two champions (Senna and Annie) so that we can compare this growth rate with base AD.
              </p>
              <p className="mb-4 pl-4 text-left">
                Senna in set 14 has a base AD of 85/153/306 at each star level which I believe is the highest in the set. Going from 2★ to 3★ Senna is the equivalent of almost three Deathblades worth of AD! This is why Senna benefits so much from attack speed and crit. Her autos hurt!
              </p>
              <p className="mb-4 pl-4 text-left">
                Let's switch gears and now take a look at a unit who focuses more on ability damage. Set 14 Annie has AD of 30/54/108 at each star level. From this, we can see that her AD still pretty much doubles at each star level, but a 3★ Annie pretty much has the same AD as a 1★ Senna.
              </p>
              <p className="mb-4 pl-4 text-left">
                In general, the stat websites figure out itemization for you, but it is good to note for some interactions (i.e., eating Senna as Renekton) and in my opinion interesting to know how much base stats translate into actual items worth of AD.
              </p>

              <div className="mb-6 pl-4">
                <h4 className="font-semibold text-gray-800 mb-3">AD Growth Comparison</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Senna (AD Carry)</h5>
                      <div className="space-y-2 text-sm">
                        <div className="p-2 bg-green-50 border border-green-200 rounded">
                          <span className="font-medium">1★ AD:</span> 85
                        </div>
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                          <span className="font-medium">2★ AD:</span> 153 (+68)
                        </div>
                        <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                          <span className="font-medium">3★ AD:</span> 306 (+153)
                        </div>
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <span className="font-medium">Growth Rate:</span> 1.8x per star
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Annie (Mage)</h5>
                      <div className="space-y-2 text-sm">
                        <div className="p-2 bg-green-50 border border-green-200 rounded">
                          <span className="font-medium">1★ AD:</span> 30
                        </div>
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                          <span className="font-medium">2★ AD:</span> 54 (+24)
                        </div>
                        <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                          <span className="font-medium">3★ AD:</span> 108 (+54)
                        </div>
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <span className="font-medium">Growth Rate:</span> 1.8x per star
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm font-medium text-red-800">Item Equivalent Analysis:</p>
                    <p className="text-sm text-red-700">• Deathblade gives 55% AD increase</p>
                    <p className="text-sm text-red-700">• Senna 2★ → 3★: +153 AD ≈ 2.8 Deathblades worth</p>
                    <p className="text-sm text-red-700">• Annie 3★ AD (108) ≈ Senna 1★ AD (85)</p>
                  </div>
                </div>
              </div>

              <SectionHeader id="health-growth">Comparing Health Growth of Units</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                Below we are going to compare two units from different classes: Sejuani (tank) and Zeri (AD carry).
              </p>
              <p className="mb-4 pl-4 text-left">
                Sejuani has the base health of 1000/1800/3240 per star level. Warmogs gives 600 (+12% HP) health so we can think of going from a 1★ Sejuani → 2★ Sejuani as almost a Warmogs worth of health.
              </p>
              <p className="mb-4 pl-4 text-left">
                Now let's compare this to Zeri who has a base health of 800/1440/2592 per star level.
              </p>
              <p className="mb-4 pl-4 text-left">
                Based on this, we can assume that Zeri has a base health that is 80% of Sejuani simply due to the difference in their class (range AD carry vs tank).
              </p>

              <div className="mb-6 pl-4">
                <h4 className="font-semibold text-gray-800 mb-3">Health Growth Comparison</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Sejuani (Tank Class)</h5>
                      <div className="space-y-2 text-sm">
                        <div className="p-2 bg-green-50 border border-green-200 rounded">
                          <span className="font-medium">1★ Health:</span> 1000
                        </div>
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                          <span className="font-medium">2★ Health:</span> 1800 (+800)
                        </div>
                        <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                          <span className="font-medium">3★ Health:</span> 3240 (+1440)
                        </div>
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <span className="font-medium">Growth Rate:</span> 1.8x per star
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Zeri (AD Carry Class)</h5>
                      <div className="space-y-2 text-sm">
                        <div className="p-2 bg-green-50 border border-green-200 rounded">
                          <span className="font-medium">1★ Health:</span> 800
                        </div>
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                          <span className="font-medium">2★ Health:</span> 1440 (+640)
                        </div>
                        <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                          <span className="font-medium">3★ Health:</span> 2592 (+1152)
                        </div>
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <span className="font-medium">Growth Rate:</span> 1.8x per star
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                    <p className="text-sm font-medium text-orange-800">Key Comparison:</p>
                    <p className="text-sm text-orange-700">• Sejuani 1★ → 2★: +800 health (≈ 1.33 Warmogs)</p>
                    <p className="text-sm text-orange-700">• Zeri 1★ → 2★: +640 health (≈ 1.07 Warmogs)</p>
                    <p className="text-sm text-orange-700">• Zeri has 80% of Sejuani's health at each star level</p>
                  </div>
                </div>
              </div>

              <SectionHeader id="prioritizing-units">Thinking About Base Stats When Prioritizing Units</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                An interesting thing to note is that Zed (1050/1890/3780), who is an assassin, has base health that is actually greater than Sejuani. This shows how important it is for his survivability to star up as he gets more than a Warmogs worth of health. This is especially true because you do not usually itemize him with tank stats so this almost doubles his survivability. Zed also benefits from the AD scaling (50/90/180) and ability damage from making him star up. I believe this is why AD frontline-bruiser units feel so binary - they're either weak at 1★ or strong at 2★ - and why it feels like such a big power level spike when they are starred-up.
              </p>
              <p className="mb-4 pl-4 text-left">
                If we compare this to the tank class (i.e., Sejuani, Leona, etc.) they don't really care about the AD or ability damage from going 2★. Sure the Warmogs worth of health is missed, but we are already stacking tank items on them. One unit that I might argue does really appreciate the 2★ is Cho'Gath (1100/1980/3960). He pretty much scales directly with health and the more casts he can get off, the more useful he becomes.
              </p>
              <p className="mb-4 pl-4 text-left">
                If we take a look at the backline class, the mages (i.e., Annie) only really miss the ability damage growth and health. The AD growth doesn't really apply to them.
              </p>
              <p className="mb-4 pl-4 text-left">
                AD backliners benefit from all of the stats when increasing their star level. The only stat they might care less about is health, but even that is appreciated on units that don't have defensive stats from their traits (Aphelios/Urgot).
              </p>

              <div className="mb-6 pl-4">
                <h4 className="font-semibold text-gray-800 mb-3">Unit Class Priority Analysis</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Frontline Units</h5>
                      <div className="space-y-2 text-sm">
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                          <span className="font-medium">Assassins (Zed):</span><br/>
                          • Health: 1050 → 1890 (+80%)<br/>
                          • AD: 50 → 90 (+80%)
                        </div>
                        <div className="p-2 bg-green-50 border border-green-200 rounded">
                          <span className="font-medium">Tanks (Sejuani):</span><br/>
                          • Health: 1000 → 1800 (+80%)<br/>
                          • AD: Less important
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Backline Units</h5>
                      <div className="space-y-2 text-sm">
                        <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                          <span className="font-medium">Mages (Annie):</span><br/>
                          • Health: 800 → 1440 (+80%)<br/>
                          • AD: 30 → 54 (+80%)
                        </div>
                        <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                          <span className="font-medium">AD Carries:</span><br/>
                          • All stats benefit<br/>
                          • Health provides survivability
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <SectionHeader id="survivability">How Much Does Starring a Unit Up Increase Its Survivability</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                If you haven't, take a look at <a href="https://tftpad.com/blog/defensive-stats" className="text-blue-700 underline hover:text-blue-900">https://tftpad.com/blog/defensive-stats</a> for the discussion on effective health.
              </p>
              <p className="mb-4 pl-4 text-left">
                I am going to use Leona here as an example of how much more tanky 2★ are when compared to 1★.
              </p>
              <p className="mb-4 pl-4 text-left">
                To start this comparison Leona has the following base stats:
              </p>
              <ul className="list-disc pl-8 mb-4 text-left">
                <li>1100/1980 health</li>
                <li>60 armor</li>
                <li>60 magic resist</li>
              </ul>
              <p className="mb-4 pl-4 text-left">
                We can use this formula (Damage Reduction % = Armor / (100 + Armor)) to calculate the damage reduction percentage from the armor/magic resist. From this we can get that Leona reduces incoming damage from both of these sources by 37.5%. Since this doesn't grow when the unit gets starred up, this reduction will not change.
              </p>
              <p className="mb-4 pl-4 text-left">
                Therefore, the only thing that changes in terms of survivability is going to be the health growth which is positively influenced by the base resistances. See table below:
              </p>
              <img src="/base-stats-ad-comparison-table.png" alt="Table: Leona Star Level vs Health, Reduction, and Effective Health" className="my-4 border rounded mx-auto" />
              <p className="mb-4 pl-4 text-left">
                Based on this, we can assume that starring a unit increases their 'tankiness' by a factor of 1.8 because resistances remain constant.
              </p>

              <SectionHeader id="tier-comparison">Are 2★ units at lower tiers tankier than 1★ units at higher tiers?</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                First, I am not going to consider abilities in this, just the base stats. In this example, I want to compare two TFT units where this decision has to be made often: Set 14 Ekko and Set 14 Neeko.
              </p>
              <p className="mb-4 pl-4 text-left">
                Neeko 1★ has the following stats:
              </p>
              <ul className="list-disc pl-8 mb-4 text-left">
                <li>Base Health: 1000</li>
                <li>Armor: 60</li>
                <li>Magic Resist: 60</li>
              </ul>
              <p className="mb-4 pl-4 text-left">
                Ekko 2★ has the following stats:
              </p>
              <ul className="list-disc pl-8 mb-4 text-left">
                <li>Base Health: 1440</li>
                <li>Armor: 45</li>
                <li>Magic Resist: 45</li>
              </ul>
              <p className="mb-4 pl-4 text-left">
                From this information we can make the following comparison in the table below:
              </p>
              <img src="/base-stats-health-comparison-table.png" alt="Table: Neeko vs Ekko Star Level, Health, Reduction, and Effective Health Comparison" className="my-4 border rounded mx-auto" />
              <p className="mb-4 pl-4 text-left">
                We can see that Ekko from a base stat perspective is tankier.
              </p>
              <p className="mb-4 pl-4 text-left">
                Now let's do the same for a tier 1 unit (Vi) and a tier 3 unit (Jarvan IV):
              </p>
              <p className="mb-4 pl-4 text-left">
                Jarvan IV 1★ has the following stats:
              </p>
              <ul className="list-disc pl-8 mb-4 text-left">
                <li>Base Health: 850</li>
                <li>Armor: 50</li>
                <li>Magic Resist: 50</li>
              </ul>
              <p className="mb-4 pl-4 text-left">
                Vi 2★ has the following stats:
              </p>
              <ul className="list-disc pl-8 mb-4 text-left">
                <li>Base Health: 1170</li>
                <li>Armor: 40</li>
                <li>Magic Resist: 40</li>
              </ul>
              <p className="mb-4 pl-4 text-left">
                From this information we can make the following comparison in the table below:
              </p>
              <img src="/base-stats-leona-survivability-table.png" alt="Table: Jarvan IV vs Vi Star Level, Health, Reduction, and Effective Health Comparison" className="my-4 border rounded mx-auto" />
              <p className="mb-4 pl-4 text-left">
                We can see that Vi from a base stat perspective is tankier.
              </p>
              <p className="mb-4 pl-4 text-left">
                Obviously there are more factors going on in terms of a unit's value, but these are just some interesting things to take a look at when deciding which unit to play.
              </p>
            </>
          } />
        } />
        </Routes>
      </TFTProvider>
    </>
  )
}

export default App