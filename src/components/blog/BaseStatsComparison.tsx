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

export function BaseStatsComparison() {
  return (
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
                  <span className="font-medium">AD Carries (Senna):</span><br/>
                  • AD: 85 → 153 (+80%)<br/>
                  • Health: Important for survival
                </div>
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <span className="font-medium">Mages (Annie):</span><br/>
                  • Ability damage: Primary scaling<br/>
                  • AD: Less important
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SectionHeader id="survivability">How Much Does Starring a Unit Up Increase Its Survivability</SectionHeader>
      <p className="mb-4 pl-4 text-left">
        This is a question that I think is important to think about when deciding which units to prioritize starring up. Let's take a look at some examples.
      </p>
      <p className="mb-4 pl-4 text-left">
        Let's say we have a 1★ Sejuani with 1000 health and 30% damage reduction. This means she has an effective health of 1000 / (1 - 0.3) = 1429. If we star her up to 2★, she now has 1800 health and the same damage reduction, giving her an effective health of 1800 / (1 - 0.3) = 2571. This is an increase of 80% in effective health.
      </p>
      <p className="mb-4 pl-4 text-left">
        Now let's compare this to a unit with no damage reduction. Let's say we have a 1★ Annie with 800 health and no damage reduction. Her effective health is 800. If we star her up to 2★, she now has 1440 health, giving her an effective health of 1440. This is also an increase of 80% in effective health.
      </p>
      <p className="mb-4 pl-4 text-left">
        The key insight here is that starring up a unit increases their survivability by the same percentage regardless of their damage reduction. This means that units with high damage reduction (like tanks) benefit just as much from starring up as units with low damage reduction (like carries).
      </p>

      <SectionHeader id="tier-comparison">Are 2* units at lower tiers tankier than 1* units at higher tiers?</SectionHeader>
      <p className="mb-4 pl-4 text-left">
        This is a common question that comes up when deciding whether to play a 2★ 1-cost tank or a 1★ 2-cost tank. Let's compare some examples.
      </p>
      <p className="mb-4 pl-4 text-left">
        Let's compare 2★ Annie (1-cost) vs 1★ Sejuani (2-cost). Annie has 1440 health and Sejuani has 1000 health. So Annie is actually tankier in terms of raw health.
      </p>
      <p className="mb-4 pl-4 text-left">
        However, this comparison is a bit unfair because Annie is a mage and Sejuani is a tank. Let's compare 2★ Yasuo (1-cost) vs 1★ Sejuani (2-cost). Yasuo has 1440 health and Sejuani has 1000 health. So Yasuo is still tankier.
      </p>
      <p className="mb-4 pl-4 text-left">
        The general rule is that 2★ units are tankier than 1★ units of the next tier up. This is why it's often better to play a 2★ 1-cost tank than a 1★ 2-cost tank in the early game.
      </p>
      <p className="mb-4 pl-4 text-left">
        However, this doesn't mean that 2★ 1-costs are always better than 1★ 2-costs. The 2-cost units often have better abilities and synergies that make them more valuable even if they're less tanky.
      </p>
    </>
  )
} 