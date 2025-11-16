import { useState, useRef, useEffect } from 'react'
import { Footer } from './Footer'

// TFT cost colors matching the game's standard colors
const COST_COLORS: Record<number, string> = {
  1: '#9CA3AF', // Gray
  2: '#10B981', // Green
  3: '#3B82F6', // Blue
  4: '#9333EA', // Purple
  5: '#F59E0B', // Gold
}

// Function to escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// Function to convert markdown bold (**text**) to HTML bold
function parseMarkdownBold(text: string): string {
  // Convert **text** to <strong>text</strong>
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

// Function to colorize champion names in text based on their cost
function colorizeChampions(text: string, championCostMap: Record<string, number>): string {
  // First parse markdown bold syntax
  let result = parseMarkdownBold(text)
  
  if (!championCostMap || Object.keys(championCostMap).length === 0) {
    // Still escape HTML after markdown parsing
    return escapeHtml(result).replace(/&lt;strong&gt;/g, '<strong>').replace(/&lt;\/strong&gt;/g, '</strong>')
  }

  // Escape HTML to prevent XSS, but preserve our markdown-converted tags
  // We'll do this more carefully to preserve <strong> tags
  const tempPlaceholder = '___STRONG_OPEN___'
  const tempPlaceholderClose = '___STRONG_CLOSE___'
  result = result.replace(/<strong>/g, tempPlaceholder)
  result = result.replace(/<\/strong>/g, tempPlaceholderClose)
  result = escapeHtml(result)
  result = result.replace(new RegExp(tempPlaceholder, 'g'), '<strong>')
  result = result.replace(new RegExp(tempPlaceholderClose, 'g'), '</strong>')

  // Sort champion names by length (longest first) to avoid partial matches
  const championNames = Object.keys(championCostMap).sort((a, b) => b.length - a.length)
  
  // Create a regex pattern that matches champion names as whole words
  // We'll process the text in a way that avoids matching inside HTML tags
  championNames.forEach(champName => {
    const cost = championCostMap[champName]
    const color = COST_COLORS[cost] || '#000000'
    
    // Create regex to match the champion name as a whole word (case-insensitive)
    // Escape special regex characters in the champion name
    const escapedName = champName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escapedName}\\b`, 'gi')
    
    // Split by HTML tags, process text nodes, then rejoin
    const parts = result.split(/(<[^>]+>)/g)
    result = parts.map((part) => {
      // Skip HTML tags
      if (part.startsWith('<') && part.endsWith('>')) {
        return part
      }
      // Process text nodes
      return part.replace(regex, (match) => {
        // Preserve original casing and wrap in colored span
        return `<span style="color: ${color}; font-weight: 600;">${match}</span>`
      })
    }).join('')
  })
  
  return result
}

export function QueryPage() {
  const [input, setInput] = useState('')
  const [responses, setResponses] = useState<Array<{ query: string; response: string; timestamp: Date; championCostMap?: Record<string, number> }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const responseEndRef = useRef<HTMLDivElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  // Scroll to bottom when new response is added
  useEffect(() => {
    responseEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [responses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userQuery = input.trim()
    setInput('')
    setIsLoading(true)

    // Add user query to responses immediately
    const newResponse = {
      query: userQuery,
      response: '',
      timestamp: new Date(),
      championCostMap: undefined as Record<string, number> | undefined
    }
    setResponses(prev => [...prev, newResponse])

    try {
      // Call the API endpoint
      const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001'
      const response = await fetch(`${API_BASE_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userQuery }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const assistantResponse = data.response || 'No response received'
      const championCostMap = data.championCostMap || {}

      setResponses(prev => {
        const updated = [...prev]
        updated[updated.length - 1].response = assistantResponse
        updated[updated.length - 1].championCostMap = championCostMap
        return updated
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response'
      setResponses(prev => {
        const updated = [...prev]
        updated[updated.length - 1].response = `Error: ${errorMessage}`
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 relative z-10 max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Query</h1>
        
        <p className="text-base md:text-lg text-gray-600 mb-8">
          Ask a question and get a response. Type your query below and press Enter to submit.
        </p>

        {/* Response Area */}
        <div className="mb-6 min-h-[400px] max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg p-4 md:p-6 bg-gray-50">
          {responses.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-sm">No queries yet. Start a conversation below.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {responses.map((item, index) => (
                <div key={index} className="space-y-4">
                  {/* User Query */}
                  <div className="flex justify-end">
                    <div className="bg-orange-300 text-gray-800 rounded-lg px-4 py-3 max-w-[80%] md:max-w-[70%]">
                      <p className="text-sm md:text-base whitespace-pre-wrap break-words">{item.query}</p>
                    </div>
                  </div>
                  
                  {/* Response */}
                  {item.response ? (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-300 text-gray-800 rounded-lg px-4 py-3 max-w-[80%] md:max-w-[70%]">
                        <div 
                          className="text-sm md:text-base whitespace-pre-wrap break-words"
                          dangerouslySetInnerHTML={{ 
                            __html: colorizeChampions(item.response, item.championCostMap || {})
                          }}
                        />
                      </div>
                    </div>
                  ) : isLoading && index === responses.length - 1 ? (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-300 text-gray-800 rounded-lg px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
              <div ref={responseEndRef} />
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your query here... (Press Enter to submit, Shift+Enter for new line)"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-none"
              disabled={isLoading}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {input.length > 0 && `${input.length} characters`}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {isLoading ? 'Processing your query...' : 'Press Enter to submit'}
            </p>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-orange-300 hover:bg-orange-400 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  )
}

