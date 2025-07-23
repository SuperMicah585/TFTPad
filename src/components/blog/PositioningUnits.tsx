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

export function PositioningUnits() {
  return (
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
  )
} 