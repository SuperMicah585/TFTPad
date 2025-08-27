import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../contexts/ProfileContext'
import { LogOut, User } from 'lucide-react'
import { LoadingSpinner } from './LoadingSpinner'
import { trackLogout } from '../GoogleAnalytics'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const { profileIconUrl, loading } = useProfile()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    trackLogout()
    await signOut()
    setIsOpen(false)
  }

  if (!user) return null

  return (
    <div className="relative" ref={menuRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full focus:outline-none focus:ring-0 border-0 overflow-hidden"
      >
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : profileIconUrl ? (
          <img 
            src={profileIconUrl} 
            alt="Profile Icon" 
            className="w-10 h-10 rounded-full object-cover hover:opacity-80 hover:cursor-pointer border border-black"
            onError={() => {}} // Error handling is now managed by the context
          />
        ) : (
          <User className = 'hover:cursor-pointer'size={24} />
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm text-gray-600">Signed in as</p>
            <p className="text-sm font-medium text-gray-800 truncate">{user.summoner_name}</p>
          </div>
          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <User size={16} />
            <span>View Profile</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  )
} 