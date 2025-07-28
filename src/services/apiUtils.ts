import { riotAuthService } from './riotAuthService'

const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001'

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
}

// Retry function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.maxRetries,
  baseDelay: number = RETRY_CONFIG.baseDelay,
  maxDelay: number = RETRY_CONFIG.maxDelay
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on client errors (4xx)
      if (error instanceof Error && error.message.includes('4')) {
        throw error
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      )
      
      console.log(`API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

// Helper function to get headers with JWT token
function getAuthHeaders(): Record<string, string> {
  const token = riotAuthService.getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

// Generic API call function with authentication
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = getAuthHeaders()
  
  // Merge headers
  const finalHeaders = {
    ...headers,
    ...options.headers,
  }
  
  const response = await retryWithBackoff(() => 
    fetch(url, {
      ...options,
      headers: finalHeaders,
    })
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// Helper functions for common HTTP methods
export const api = {
  get: <T>(endpoint: string): Promise<T> => 
    apiCall<T>(endpoint, { method: 'GET' }),
    
  post: <T>(endpoint: string, data?: any): Promise<T> => 
    apiCall<T>(endpoint, { 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  put: <T>(endpoint: string, data?: any): Promise<T> => 
    apiCall<T>(endpoint, { 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  delete: <T>(endpoint: string): Promise<T> => 
    apiCall<T>(endpoint, { method: 'DELETE' }),
}

// Export the base URL and retry function for services that need them
export { API_BASE_URL, retryWithBackoff } 