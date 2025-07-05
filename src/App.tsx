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
              <nav className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
                <h2 className="text-lg font-semibold mb-2 text-gray-800">On this page</h2>
                <ul className="space-y-1 list-disc list-inside text-blue-700">
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

              <div className="flex gap-4 my-4 justify-center">
                <img src="/champion-pool-unit-odds-graph.png" alt="Graph: Unit Odds by Level and Tier" className="border rounded" style={{ maxWidth: '480px', width: '100%', height: 'auto' }} />
                <img src="/champion-pool-unit-odds-table.png" alt="Table: Shop Odds by Level and Tier" className="border rounded" style={{ maxWidth: '480px', width: '100%', height: 'auto' }} />
              </div>
            </>
          } />
        } />
        <Route path="/blog/econ" element={<BlogPost title="Econ" content="Economic management and gold optimization strategies" />} />
        <Route path="/blog/item-pool" element={<BlogPost title="Item Pool" content="Understanding item pools and optimal itemization" />} />
        <Route path="/blog/dmg-scaling" element={<BlogPost title="Dmg Scaling (Magic Damage/Attack Damage)" content="How damage scaling works and affects unit effectiveness" />} />
        <Route path="/blog/starring-units" element={<BlogPost title="Impact of Starring Units Up" content="Base stats, abilities, and power increase from starring units" />} />
        <Route path="/blog/patch-notes" element={<BlogPost title="Understanding Patch Notes" content="How Riot's balance levers impact the meta and gameplay" />} />
        <Route path="/blog/understanding-dmg" element={<BlogPost title="Understanding DMG" content="Comprehensive guide to damage mechanics in TFT" />} />
        <Route path="/blog/base-stats-comparison" element={
          <BlogPost title="Comparing Units Base Stats" content={
            <>
              {/* Table of Contents - static, left-aligned at top */}
              <nav className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
                <h2 className="text-lg font-semibold mb-2 text-gray-800">On this page</h2>
                <ul className="space-y-1 list-disc list-inside text-blue-700">
                  <li><a href="#base-stats-difference" className="hover:underline">What is the difference between base stats of units between tiers?</a></li>
                  <li><a href="#ad-growth" className="hover:underline">Comparing AD growth of Units</a></li>
                  <li><a href="#health-growth" className="hover:underline">Comparing Health Growth of Units</a></li>
                  <li><a href="#prioritizing-units" className="hover:underline">Thinking about base stats when prioritizing units</a></li>
                  <li><a href="#survivability" className="hover:underline">How much does starring a unit up increase its survivability</a></li>
                  <li><a href="#tier-comparison" className="hover:underline">Are 2* units at lower tiers tankier than 1* units at higher tiers?</a></li>
                </ul>
              </nav>

              <SectionHeader id="base-stats-difference">What is the difference between base stats of units between tiers?</SectionHeader>
              <p className="mb-4 pl-4 text-left">
                The stats that change as units star-up are ability base dmg, attack damage, and health. In general these stats multiply by about 1.8x per star level. 3★ 4 and 5 costs grow at an even higher rate.
              </p>
              <p className="mb-4 pl-4 text-left">
                This means that starring up your frontline carries (i.e., Zed, Graves, etc.) is extra important because they benefit from all three stats (AD, health, and ability damage), unlike frontline tanks who mainly care about health or backline carries who mainly care about AD and ability damage.
              </p>
              <p className="mb-4 pl-4 text-left">
                I will note that ability damage also goes up per star level, but this varies on every unit so I am not going to go over it in this article.
              </p>

              <SectionHeader id="ad-growth">Comparing AD growth of Units</SectionHeader>
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

              <SectionHeader id="prioritizing-units">Thinking about base stats when prioritizing units</SectionHeader>
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

              <SectionHeader id="survivability">How much does starring a unit up increase its survivability</SectionHeader>
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
  )
}

export default App