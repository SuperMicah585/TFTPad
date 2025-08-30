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
    // Check if token is expired
    if (riotAuthService.isTokenExpired()) {
      riotAuthService.removeToken()
      // Redirect to login
      window.location.href = '/login'
      throw new Error('Token expired. Please log in again.')
    }
    
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
    console.log(`🔐 API call failed - Status: ${response.status}, URL: ${url}`);
    console.log(`🔐 API call failed - Response headers:`, Object.fromEntries(response.headers.entries()));
    
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    console.log(`🔐 API call failed - Error data:`, errorData);
    
    // If it's a 401 error and the error message indicates token expiration, try to refresh
    if (response.status === 401 && (errorData.error?.includes('expired') || errorData.error?.includes('Token has expired'))) {
      console.log('🔐 Token expired, attempting to refresh...');
      // Clear the expired token
      riotAuthService.removeToken();
      // Redirect to login or show login modal
      window.location.href = '/login';
      throw new Error('Token expired. Please log in again.');
    }
    
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

// Global authentication error handler
export async function handleAuthError(error: any): Promise<boolean> {
  // Check if this is an authentication error
  if (error instanceof Error && 
      (error.message.includes('401') || 
       error.message.includes('403') || 
       error.message.includes('Authentication failed') ||
       error.message.includes('UNAUTHORIZED'))) {
    
    try {
      console.log('🔄 Authentication error detected, attempting to refresh session...');
      
      // Import the auth service
      const { supabaseAuthService } = await import('./supabaseAuthService');
      
      // Try to refresh the session
      const newSession = await supabaseAuthService.refreshSession();
      
      if (newSession?.access_token) {
        console.log('✅ Session refreshed successfully');
        return true; // Indicate that the session was refreshed
      } else {
        console.log('❌ Session refresh failed');
        return false; // Indicate that the session refresh failed
      }
    } catch (refreshError) {
      console.error('Failed to refresh session:', refreshError);
      return false;
    }
  }
  
  return false; // Not an auth error
}

// Enhanced fetch wrapper with automatic auth retry
export async function fetchWithAuthRetry(
  url: string, 
  options: RequestInit = {}, 
  maxRetries: number = 2
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Get custom JWT token for each attempt
      const { jwtAuthService } = await import('./jwtAuthService');
      const token = jwtAuthService.getToken();
      
      if (!token) {
        throw new Error('No JWT authentication token available');
      }
      
      // Add the auth header
      const authOptions = {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      };
      
      const response = await fetch(url, authOptions);
      
      // If the response is successful, return it
      if (response.ok) {
        return response;
      }
      
      // If it's an auth error and we haven't exceeded retries, try to refresh
      if ((response.status === 401 || response.status === 403) && attempt < maxRetries) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      // If it's not an auth error or we've exceeded retries, throw the error
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      lastError = error as Error;
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw lastError || new Error('Request failed after all retries');
} 