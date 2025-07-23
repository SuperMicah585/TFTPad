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

export function UnderstandingDMG() {
  return (
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
  )
} 