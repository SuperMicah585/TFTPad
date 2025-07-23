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

export function Econ() {
  return (
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
  )
} 