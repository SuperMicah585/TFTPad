
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Footer } from './Footer'
import { LoadingSpinner } from './auth/LoadingSpinner'
import { userService } from '../services/userService'
import { trackProfileAction } from './GoogleAnalytics'

function ProfileContent() {
  const { user, userId, signOut } = useAuth()
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [accountCreationDate, setAccountCreationDate] = useState<string | null>(null)

  // Handle delete account button click - show modal
  const handleDeleteButtonClick = () => {
    trackProfileAction('delete_account_modal_open')
    setShowDeleteModal(true)
    setDeleteConfirmation('')
  }

  // Handle actual account deletion from modal
  const handleConfirmDelete = async () => {
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type "DELETE" exactly to confirm.')
      return
    }
    
    if (!userId) return
    
    setDeletingAccount(true)
    try {
      trackProfileAction('account_deleted')
      await userService.deleteUserAccount(parseInt(userId))
      alert('Your account has been deleted successfully. You will be signed out.')
      // Sign out the user
      await signOut()
    } catch (err) {
      console.error('Error deleting account:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete account. Please try again.'
      alert(errorMessage)
    } finally {
      setDeletingAccount(false)
      setShowDeleteModal(false)
    }
  }

  // Get account creation date from auth context
  useEffect(() => {
    if (user?.created_at) {
      setAccountCreationDate(new Date(user.created_at).toLocaleDateString())
    }
  }, [user?.created_at])

  return (
    <>
      <div className="min-h-screen bg-white text-gray-800 relative flex flex-col">
        {/* Notebook Lines Background - Full Viewport */}
        <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#F0F3F0' }}>
          <div className="absolute inset-0 opacity-15 dark:opacity-20">
            <svg width="100%" height="100%">
              <pattern id="notebook-lines-profile" x="0" y="0" width="100%" height="24" patternUnits="userSpaceOnUse">
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
              <rect width="100%" height="100%" fill="url(#notebook-lines-profile)" />
            </svg>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="container mx-auto px-4 py-8 relative z-10 max-w-4xl">
            {/* Header Section */}
            <div className="mb-6 sm:mb-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-black mb-2">Account Settings</h1>
                    <p className="text-black text-sm sm:text-base lg:text-lg">Manage your account information</p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end sm:text-right min-w-0">
                    <p className="text-xs sm:text-sm text-black mb-1">Signed in as</p>
                    <p className="font-semibold text-black mb-3 sm:mb-4 break-all text-sm sm:text-base">{user?.email || 'User'}</p>
                    <button
                      onClick={handleDeleteButtonClick}
                      disabled={!userId || deletingAccount}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed text-xs sm:text-sm whitespace-nowrap"
                    >
                      {deletingAccount ? (
                        <div className="flex items-center justify-center gap-2">
                          <LoadingSpinner size="sm" />
                          Deleting...
                        </div>
                      ) : (
                        'Delete Account'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-black mb-6">Account Information</h2>
              
              <div className="space-y-6">
                {/* User Email */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Email Address</p>
                  <p className="font-semibold text-black text-lg">{user?.email || 'Not available'}</p>
                </div>

                {/* Account Creation Date */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Account Created</p>
                  <p className="font-semibold text-black text-lg">
                    {accountCreationDate || 'Date not available'}
                  </p>
                </div>
              </div>

              {/* Warning about account deletion */}
              <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-amber-800 font-semibold mb-2">Account Deletion</h3>
                    <p className="text-amber-700 text-sm">
                      Deleting your account will permanently remove all your data including profile information, 
                      study group memberships, and any associated records. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-red-900">Delete Account</h3>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-800 text-sm mb-3">
                  <strong>Warning:</strong> This action will permanently delete your account and all associated data.
                </p>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• Delete all your profile data</li>
                                      <li>• Remove you from all groups</li>
                  <li>• Delete your Riot account connection</li>
                  <li>• Remove all your invitations</li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-amber-800 text-sm">
                                  <strong>Note:</strong> If you are a member of any groups, you should leave those groups before deleting your account.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type "DELETE" to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletingAccount}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteConfirmation !== 'DELETE' || deletingAccount}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed font-medium"
                >
                  {deletingAccount ? (
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      Deleting...
                    </div>
                  ) : (
                    'Delete Account'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </>
  )
}

export function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  )
} 