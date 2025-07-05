import { Header } from './header'
import { Link } from 'react-router-dom'

export function BlogPage() {
  const blogTopics = [
    {
      title: "Defensive Stats",
      description: "Understanding armor, magic resist, and defensive mechanics in TFT",
      path: "/blog/defensive-stats",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Champion Pool",
      description: "How champion pools work and affect your drafting strategy",
      path: "/blog/champion-pool",
      color: "from-green-500 to-green-600"
    },
    {
      title: "Econ",
      description: "Economic management and gold optimization strategies",
      path: "/blog/econ",
      color: "from-yellow-500 to-yellow-600"
    },
    {
      title: "Item Pool",
      description: "Understanding item pools and optimal itemization",
      path: "/blog/item-pool",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Dmg Scaling (Magic Damage/Attack Damage)",
      description: "How damage scaling works and affects unit effectiveness",
      path: "/blog/dmg-scaling",
      color: "from-red-500 to-red-600"
    },
    {
      title: "Impact of Starring Units Up",
      description: "Base stats, abilities, and power increase from starring units",
      path: "/blog/starring-units",
      color: "from-indigo-500 to-indigo-600"
    },
    {
      title: "Understanding Patch Notes",
      description: "How Riot's balance levers impact the meta and gameplay",
      path: "/blog/patch-notes",
      color: "from-pink-500 to-pink-600"
    },
    {
      title: "Understanding DMG",
      description: "Comprehensive guide to damage mechanics in TFT",
      path: "/blog/understanding-dmg",
      color: "from-orange-500 to-orange-600"
    },
    {
      title: "Comparing Base Stats of Units in Different Tiers",
      description: "Analysis of how base stats scale across different unit tiers and costs",
      path: "/blog/base-stats-comparison",
      color: "from-teal-500 to-teal-600"
    }
  ];

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
          <h1 className="text-3xl font-bold text-gray-800 mb-6">TFTPad Blog</h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Welcome to the TFTPad blog! Here you'll find insights, strategies, and deep dives into Teamfight Tactics mechanics.
          </p>
          
          {/* Topic Tiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogTopics.map((topic, index) => (
              <Link
                key={index}
                to={topic.path}
                className="group block"
              >
                <div className="bg-gradient-to-br bg-white border-2 border-gray-200 rounded-xl p-6 h-full transition-all duration-300 hover:shadow-lg hover:border-gray-300 hover:scale-105">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 group-hover:text-gray-600 transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {topic.description}
                  </p>
                  <div className="mt-4 flex items-center text-orange-500 font-medium text-sm group-hover:text-orange-600 transition-colors">
                    Read More
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
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