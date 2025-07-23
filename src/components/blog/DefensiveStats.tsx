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

export function DefensiveStats() {
  return (
    <>
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
    </>
  )
} 