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

export function Mana() {
  return (
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
  )
} 