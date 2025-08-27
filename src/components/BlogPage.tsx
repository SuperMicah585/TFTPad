import { Link } from 'react-router-dom'
import { Footer } from './Footer'
import { trackBlogInteraction, trackLinkClick } from './GoogleAnalytics'

export function BlogPage() {
  const blogTopics = [
    {
      title: "Positioning Units",
      description: "Strategic unit placement and positioning fundamentals",
      path: "/blog/positioning-units",
      color: "from-purple-500 to-purple-600",
      comingSoon: false,
      backgroundImage: "/blog-tile-5.png"
    },
    {
      title: "Defensive Stats",
      description: "Understanding armor, magic resist, and defensive mechanics in TFT",
      path: "/blog/defensive-stats",
      color: "from-blue-500 to-blue-600",
      comingSoon: false,
      backgroundImage: "/blog-tile-1.png"
    },
    {
      title: "Champion Pool",
      description: "How champion pools work and affect your drafting strategy",
      path: "/blog/champion-pool",
      color: "from-green-500 to-green-600",
      comingSoon: false,
      backgroundImage: "/blog-tile-2.png"
    },
    {
      title: "Comparing Units Base Stats",
      description: "Analysis of how base stats scale across different unit tiers and costs",
      path: "/blog/base-stats-comparison",
      color: "from-teal-500 to-teal-600",
      comingSoon: false,
      backgroundImage: "/blog-tile-3.png"
    },
    {
      title: "Econ",
      description: "Economic management and gold optimization strategies",
      path: "/blog/econ",
      color: "from-yellow-500 to-yellow-600",
      comingSoon: false,
      backgroundImage: "/blog-tile-4.png"
    },
    {
      title: "Items",
      description: "Understanding item pools and optimal itemization",
      path: "/blog/item-pool",
      color: "from-red-500 to-red-600",
      comingSoon: false,
      backgroundImage: "/blog-tile-6.png"
    },
    {
      title: "Understanding DMG",
      description: "Comprehensive guide to damage mechanics in TFT",
      path: "/blog/understanding-dmg",
      color: "from-orange-500 to-orange-600",
      comingSoon: false,
      backgroundImage: "/blog-tile-7.png"
    },
    {
      title: "Mana",
      description: "Understanding mana generation for units in TFT",
      path: "/blog/mana",
      color: "from-indigo-500 to-indigo-600",
      comingSoon: false,
      backgroundImage: "/blog-tile-8.png"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6 relative z-10 max-w-6xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">TFTPad Blog</h1>
        
        <p className="text-base md:text-lg text-gray-600 mb-8">
          Hi, I'm Micah (<a href="https://www.metatft.com/player/na/moisturizar-NA1" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900">Moisturizar</a>), and below is a space to share my TFT learnings.
        </p>
        
        {/* Topic Tiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {blogTopics.map((topic, index) => (
            topic.comingSoon ? (
              <div key={index} className="group block">
                <div 
                  className="rounded-xl p-4 md:p-6 h-full transition-all duration-300 opacity-60 relative overflow-hidden"
                  style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.8)), url(${topic.backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* Blog indicator badge */}
                  <div className="absolute top-3 right-3 bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    BLOG
                  </div>
                  
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                        {topic.title}
                      </h3>
                      <p className="text-white/95 text-sm md:text-base leading-relaxed">
                        {topic.description}
                      </p>
                    </div>
                    
                    {/* Coming Soon indicator */}
                    <div className="mt-6 pt-4 border-t border-white/20">
                      <div className="bg-gray-500 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Coming Soon</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={index}
                to={topic.path}
                onClick={() => {
                  trackBlogInteraction('blog_post_click')
                  trackLinkClick(topic.title, topic.path)
                }}
                className="group block"
              >
                <div 
                  className="rounded-xl p-4 md:p-6 h-full transition-all duration-300 hover:shadow-lg hover:scale-105 relative overflow-hidden group"
                  style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.8)), url(${topic.backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* Blog indicator badge */}
                  <div className="absolute top-3 right-3 bg-orange-300 text-gray-800 px-2 py-1 rounded-full text-xs font-semibold">
                    BLOG
                  </div>
                  
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-orange-300 transition-colors">
                        {topic.title}
                      </h3>
                      <p className="text-white/95 text-sm md:text-base leading-relaxed">
                        {topic.description}
                      </p>
                    </div>
                    
                    {/* Prominent CTA button */}
                    <div className="mt-6 pt-4 border-t border-white/20">
                      <div className="bg-orange-300 hover:bg-orange-400 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-all duration-300 group-hover:scale-105 flex items-center justify-center">
                        <span className="mr-2">Read Article</span>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
} 