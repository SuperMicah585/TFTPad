import { Header } from './header'

export function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const subject = formData.get('subject') as string
    const message = formData.get('message') as string
    const email = formData.get('email') as string
    
    const mailtoLink = `mailto:micahphlps@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`From: ${email}\n\n${message}`)}`
    window.location.href = mailtoLink
  }

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
      
      <div className="flex-1 container mx-auto px-4 py-6 relative z-10 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Contact TFTPad</h1>
          
          <p className="text-base md:text-lg text-gray-600 mb-8">
            Have feedback, suggestions, or requests? We'd love to hear from you! Send us a message and we'll get back to you as soon as possible.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Your Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                placeholder="Feedback, suggestion, or request"
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-vertical"
                placeholder="Tell us what's on your mind..."
              />
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                * Required fields
              </p>
              <button
                type="submit"
                className="bg-orange-300 hover:bg-orange-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Message
              </button>
            </div>
          </form>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">What can you contact us about?</h3>
            <ul className="text-gray-600 space-y-1">
              <li>• Bug reports or technical issues</li>
              <li>• Feature requests and suggestions</li>
              <li>• Content feedback or corrections</li>
              <li>• General questions about TFTPad</li>
              <li>• Partnership or collaboration inquiries</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-6 bg-gray-50 border-t border-gray-200 relative z-10">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm max-w-6xl">
          <p>2025-2025 TFTPad. TFTPad isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.</p>
        </div>
      </footer>
    </div>
  )
} 