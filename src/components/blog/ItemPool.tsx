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

export function ItemPool() {
  return (
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
  )
} 