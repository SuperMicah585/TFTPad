import { Link as LinkIcon } from 'lucide-react'

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

export function ChampionPool() {
  return (
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
  )
} 