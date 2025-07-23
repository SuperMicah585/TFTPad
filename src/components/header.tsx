import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { OAuthLoginModal } from './auth/OAuthLoginModal'
import { UserMenu } from './auth/UserMenu'

export function Header() {
   const location = useLocation();
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
   const [showLoginModal, setShowLoginModal] = useState(false);
   const { user, signOut } = useAuth();
   
   return(
       <div className="border-b border-gray-800 px-6 py-2 relative" style={{ backgroundColor: '#964B00' }}>
           <div className="mx-auto flex items-center justify-between relative">
               <div className="flex items-center relative">
                   <img 
                       src="/favicon.png" 
                       alt="TFTPad Logo" 
                       className="w-12 h-12"
                   />
                   <h1 className="text-xl font-bold text-white absolute left-14">TFTPad</h1>
               </div>
               
               {/* Desktop Navigation - Centered */}
               <nav className="hidden md:flex items-center space-x-6 absolute left-1/2 transform -translate-x-1/2">
                   <Link 
                       to="/study-groups/groups" 
                       className={`px-4 py-1 rounded-lg font-medium transition-all duration-200 ${
                           location.pathname.startsWith('/study-groups') || location.pathname === '/'
                               ? 'bg-orange-300 text-gray-800 shadow-md hover:text-gray-800'
                               : 'text-orange-200 hover:text-white hover:bg-orange-300/20'
                       }`}
                   >
                       Study Groups
                   </Link>
                   <Link 
                       to="/tracker" 
                       className={`px-4 py-1 rounded-lg font-medium transition-all duration-200 ${
                           location.pathname.startsWith('/tracker')
                               ? 'bg-orange-300 text-gray-800 shadow-md hover:text-gray-800'
                               : 'text-orange-200 hover:text-white hover:bg-orange-300/20'
                       }`}
                   >
                       Tracker
                   </Link>
                   <Link 
                       to="/blog" 
                       className={`px-4 py-1 rounded-lg font-medium transition-all duration-200 ${
                           location.pathname === '/blog'
                               ? 'bg-orange-300 text-gray-800 shadow-md hover:text-gray-800'
                               : 'text-orange-200 hover:text-white hover:bg-orange-300/20'
                       }`}
                   >
                       Blog
                   </Link>
                   <Link 
                       to="/contact" 
                       className={`px-4 py-1 rounded-lg font-medium transition-all duration-200 ${
                           location.pathname === '/contact'
                               ? 'bg-orange-300 text-gray-800 shadow-md hover:text-gray-800'
                               : 'text-orange-200 hover:text-white hover:bg-orange-300/20'
                       }`}
                   >
                       Contact
                   </Link>
               </nav>
               
               {/* Desktop Authentication */}
               <div className="hidden md:flex items-center">
                   {user ? (
                       <UserMenu />
                   ) : (
                       <button
                           onClick={() => setShowLoginModal(true)}
                           className="bg-orange-300 text-white hover:bg-orange-400 rounded-full p-2 focus:outline-none focus:ring-0 border-0 text-xs"
                       >
                           Login
                       </button>
                   )}
               </div>
               
               {/* Mobile Menu Button */}
               <button
                   onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                   className="md:hidden border-2 border-orange-300 hover:bg-orange-300 hover:text-gray-800 text-orange-200 px-3 py-2 rounded-lg font-medium transition-colors"
                   style={{ backgroundColor: '#964B00' }}
                   onMouseEnter={(e) => {
                       e.currentTarget.style.backgroundColor = '#fbbf24'; // orange-300
                       e.currentTarget.style.color = '#1f2937'; // gray-800
                   }}
                   onMouseLeave={(e) => {
                       e.currentTarget.style.backgroundColor = '#964B00';
                       e.currentTarget.style.color = '#fed7aa'; // orange-200
                   }}
                   aria-label="Toggle mobile menu"
               >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       {isMobileMenuOpen ? (
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                       ) : (
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                       )}
                   </svg>
               </button>
           </div>
           
           {/* Mobile Menu */}
           {isMobileMenuOpen && (
               <div className="md:hidden mt-4 pb-4 border-t border-gray-700">
                   <nav className="flex flex-col space-y-2 pt-4">
                       <Link 
                           to="/study-groups/groups" 
                           onClick={() => setIsMobileMenuOpen(false)}
                           className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                               location.pathname.startsWith('/study-groups') || location.pathname === '/'
                                   ? 'bg-orange-300 text-gray-800 shadow-md hover:text-gray-800'
                                   : 'text-orange-200 hover:text-white hover:bg-orange-300/20'
                           }`}
                       >
                           Study Groups
                       </Link>
                       <Link 
                           to="/tracker" 
                           onClick={() => setIsMobileMenuOpen(false)}
                           className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                               location.pathname.startsWith('/tracker')
                                   ? 'bg-orange-300 text-gray-800 shadow-md hover:text-gray-800'
                                   : 'text-orange-200 hover:text-white hover:bg-orange-300/20'
                           }`}
                       >
                           Tracker
                       </Link>
                       <Link 
                           to="/blog" 
                           onClick={() => setIsMobileMenuOpen(false)}
                           className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                               location.pathname === '/blog'
                                   ? 'bg-orange-300 text-gray-800 shadow-md hover:text-gray-800'
                                   : 'text-orange-200 hover:text-white hover:bg-orange-300/20'
                           }`}
                       >
                           Blog
                       </Link>
                       <Link 
                           to="/contact" 
                           onClick={() => setIsMobileMenuOpen(false)}
                           className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                               location.pathname === '/contact'
                                   ? 'bg-orange-300 text-gray-800 shadow-md hover:text-gray-800'
                                   : 'text-orange-200 hover:text-white hover:bg-orange-300/20'
                           }`}
                       >
                           Contact
                       </Link>
                       {user && (
                           <Link
                               to="/profile"
                               onClick={() => setIsMobileMenuOpen(false)}
                               className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                   location.pathname === '/profile'
                                       ? 'bg-orange-300 text-gray-800 shadow-md hover:text-gray-800'
                                       : 'text-orange-200 hover:text-white hover:bg-orange-300/20'
                               }`}
                           >
                               Profile
                           </Link>
                       )}
                       {user ? (
                           <button
                               onClick={async () => {
                                   await signOut()
                                   setIsMobileMenuOpen(false)
                               }}
                               className="bg-[#ff8889] hover:bg-[#ff7778] text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                           >
                               Sign Out
                           </button>
                       ) : (
                           <button
                               onClick={() => {
                                   setShowLoginModal(true)
                                   setIsMobileMenuOpen(false)
                               }}
                               className="text-orange-300 hover:text-white hover:bg-orange-400/20 px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-transparent"
                           >
                               Login
                           </button>
                       )}
                   </nav>
               </div>
           )}
           
           {/* Auth Modals */}
           <OAuthLoginModal
               isOpen={showLoginModal}
               onClose={() => setShowLoginModal(false)}
           />
       </div>
   )
}