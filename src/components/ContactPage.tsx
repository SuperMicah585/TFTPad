import { Footer } from './Footer'
import { trackContactForm, trackFormSubmission } from './GoogleAnalytics'

export function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const subject = formData.get('subject') as string
    const message = formData.get('message') as string
    const email = formData.get('email') as string
    
    // Track form submission
    trackContactForm(subject)
    trackFormSubmission('contact_form')
    
    const mailtoLink = `mailto:micahphlps@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`From: ${email}\n\n${message}`)}`
    window.location.href = mailtoLink
  }

  return (
    <div className="container mx-auto px-4 py-6 relative z-10 max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Contact TFTPad</h1>
        
        <p className="text-base md:text-lg text-gray-600 mb-8">
          TFTPad is a hobby project, and any feedback you have is greatly appreciated to help make it better! Whether you've found a bug, have suggestions for new features, or just want to share your thoughts - we'd love to hear from you.
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
      <Footer />
    </div>
  )
} 