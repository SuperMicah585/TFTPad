import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testOAuthFlow = async (provider: 'discord' | 'google') => {
    setLoading(true)
    addDebugInfo(`Starting ${provider} OAuth test...`)
    
    try {
      addDebugInfo(`Current origin: ${window.location.origin}`)
      addDebugInfo(`Redirect URL: ${window.location.origin}/auth/callback`)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      addDebugInfo(`OAuth response: ${JSON.stringify(data, null, 2)}`)
      
      if (error) {
        addDebugInfo(`OAuth error: ${error.message}`)
      } else {
        addDebugInfo(`OAuth successful - should redirect to ${provider}`)
      }
      
    } catch (err) {
      addDebugInfo(`Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const clearDebug = () => {
    setDebugInfo([])
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Auth Debug Panel</h2>
      
      <div className="mb-4 space-x-2">
        <button
          onClick={() => testOAuthFlow('discord')}
          disabled={loading}
          className="bg-[#5865F2] text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Discord OAuth
        </button>
        <button
          onClick={() => testOAuthFlow('google')}
          disabled={loading}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded disabled:opacity-50"
        >
          Test Google OAuth
        </button>
        <button
          onClick={clearDebug}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Clear Debug
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Information:</h3>
        <div className="bg-white p-3 rounded border max-h-96 overflow-y-auto">
          {debugInfo.length === 0 ? (
            <p className="text-gray-500">No debug information yet. Click a test button above.</p>
          ) : (
            debugInfo.map((info, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {info}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-yellow-100 rounded-lg">
        <h3 className="font-semibold mb-2">Troubleshooting Steps:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Check browser console for additional errors</li>
          <li>Verify Supabase project configuration</li>
          <li>Ensure OAuth providers are enabled in Supabase dashboard</li>
          <li>Check redirect URLs are correctly configured</li>
          <li>Verify environment variables are set correctly</li>
        </ol>
      </div>
    </div>
  )
}
