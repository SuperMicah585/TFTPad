import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { SupabaseLoginModal } from './auth/SupabaseLoginModal'
import { UserMenu } from './auth/UserMenu'
import { trackNavigation } from './GoogleAnalytics'

export function Header() {
   const location = useLocation();
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
   const [showLoginModal, setShowLoginModal] = useState(false);
   const { user, signOut, isProfileIncomplete } = useAuth();
   const navigate = useNavigate();
   
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
                       to="/groups" 
                       onClick={() => trackNavigation('/groups')}
                       className={`px-4 py-1 rounded-lg font-medium transition-all duration-200 ${
                           location.pathname.startsWith('/groups')
                               ? 'bg-orange-300 text-gray-800 shadow-md hover:text-gray-800'
                               : 'text-orange-200 hover:text-white hover:bg-orange-300/20'
                       }`}
                   >
                       Groups
                   </Link>
                   <Link 
                       to="/players" 
                       onClick={() => trackNavigation('/players')}
                       className={`px-4 py-1 rounded-lg font-medium transition-all duration-200 ${
                           location.pathname.startsWith('/players')
                               ? 'bg-orange-300 text-gray-800 shadow-md hover:text-gray-800'
                               : 'text-orange-200 hover:text-white hover:bg-orange-300/20'
                       }`}
                   >
                       Players
                   </Link>
                   <Link 
                       to="/my-groups" 
                       onClick={() => trackNavigation('/my-groups')}
                       className={`px-4 py-1 rounded-lg font-medium transition-all duration-200 ${
                           location.pathname.startsWith('/my-groups')
                               ? 'bg-orange-300 text-gray-800 shadow-md hover:text-gray-800'
                               : 'text-orange-200 hover:text-white hover:bg-orange-300/20'
                       }`}
                   >
                       My Groups
                   </Link>


                   <Link 
                       to="/contact" 
                       onClick={() => trackNavigation('/contact')}
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
               <div className="hidden md:flex items-center gap-2">
                   {user ? (
                       <>
                           {isProfileIncomplete() && (
                               <button
                                   onClick={() => navigate('/profile')}
                                   className="text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                   style={{ backgroundColor: '#ff8889' }}
                                   onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff7778'}
                                   onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff8889'}
                                   title="Complete your profile"
                               >
                                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                       <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                   </svg>
                                   Complete Profile
                               </button>
                           )}
                           <UserMenu />
                       </>
                   ) : (
                       <>
                           <button
                               onClick={() => setShowLoginModal(true)}
                               className="bg-transparent text-orange-200 hover:text-white hover:bg-orange-300/20 rounded-lg p-2 focus:outline-none focus:ring-0 border-0 text-xs transition-colors"
                           >
                               Login
                           </button>
                           <button
                               onClick={() => setShowLoginModal(true)}
                               className="bg-[#00c9ac] text-white hover:bg-[#00b89a] rounded-lg p-2 focus:outline-none focus:ring-0 border-0 text-xs transition-colors"
                           >
                               Sign Up
                           </button>
                       </>
                   )}
               </div>

               {/* Mobile menu button */}
               <div className="md:hidden">
                   <button
                       onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                       className="w-10 h-10 bg-[#00c9ac] hover:bg-[#00b89a] rounded-lg focus:outline-none focus:ring-0 border-0 flex items-center justify-center hover:cursor-pointer transition-colors shadow-lg"
                   >
                       <div className="w-6 h-6 flex flex-col justify-center items-center">
                           <div className="w-5 h-0.5 bg-white mb-1"></div>
                           <div className="w-5 h-0.5 bg-white mb-1"></div>
                           <div className="w-5 h-0.5 bg-white"></div>
                       </div>
                   </button>
               </div>
           </div>

           {/* Mobile Navigation */}
           {isMobileMenuOpen && (
               <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
                   <div className="px-4 py-2 space-y-2">
                       <Link 
                           to="/groups" 
                           onClick={() => { trackNavigation('/groups'); setIsMobileMenuOpen(false); }}
                           className={`block px-3 py-2 rounded-lg font-medium transition-colors ${
                               location.pathname.startsWith('/groups')
                                   ? 'bg-orange-100 text-orange-800'
                                   : 'text-gray-700 hover:bg-gray-100'
                           }`}
                       >
                           Groups
                       </Link>
                       <Link 
                           to="/players" 
                           onClick={() => { trackNavigation('/players'); setIsMobileMenuOpen(false); }}
                           className={`block px-3 py-2 rounded-lg font-medium transition-colors ${
                               location.pathname.startsWith('/players')
                                   ? 'bg-orange-100 text-orange-800'
                                   : 'text-gray-700 hover:bg-gray-100'
                           }`}
                       >
                           Players
                       </Link>
                       <Link 
                           to="/my-groups" 
                           onClick={() => { trackNavigation('/my-groups'); setIsMobileMenuOpen(false); }}
                           className={`block px-3 py-2 rounded-lg font-medium transition-colors ${
                               location.pathname.startsWith('/my-groups')
                                   ? 'bg-orange-100 text-orange-800'
                                   : 'text-gray-700 hover:bg-gray-100'
                           }`}
                       >
                           My Groups
                       </Link>

                       <Link 
                           to="/contact" 
                           onClick={() => { trackNavigation('/contact'); setIsMobileMenuOpen(false); }}
                           className={`block px-3 py-2 rounded-lg font-medium transition-colors ${
                               location.pathname === '/contact'
                                   ? 'bg-orange-100 text-orange-800'
                                   : 'text-gray-700 hover:bg-gray-100'
                           }`}
                       >
                           Contact
                       </Link>
                       
                       {/* Mobile Authentication */}
                       <div className="pt-2 border-t border-gray-200">
                           {user ? (
                               <div className="space-y-2">
                                   {isProfileIncomplete() && (
                                       <button
                                           onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}
                                           className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-red-100 text-red-800 hover:bg-red-200"
                                       >
                                           Complete Profile
                                       </button>
                                   )}
                                   <button
                                       onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                                       className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100"
                                   >
                                       Sign Out
                                   </button>
                               </div>
                           ) : (
                               <div className="flex flex-col gap-2">
                                   <button
                                       onClick={() => { setShowLoginModal(true); setIsMobileMenuOpen(false); }}
                                       className="bg-transparent text-orange-200 hover:text-white hover:bg-orange-300/20 rounded-lg p-2 focus:outline-none focus:ring-0 border-0 text-xs transition-colors"
                                   >
                                       Login
                                   </button>
                                   <button
                                       onClick={() => { setShowLoginModal(true); setIsMobileMenuOpen(false); }}
                                       className="bg-[#00c9ac] text-white hover:bg-[#00b89a] rounded-lg p-2 focus:outline-none focus:ring-0 border-0 text-xs transition-colors"
                                   >
                                       Sign Up
                                   </button>
                               </div>
                           )}
                       </div>
                   </div>
               </div>
           )}

           {/* Login Modal */}
           <SupabaseLoginModal 
               isOpen={showLoginModal} 
               onClose={() => setShowLoginModal(false)} 
           />
       </div>
   )
}