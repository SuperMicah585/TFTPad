import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { RiotLoginModal } from './auth/RiotLoginModal'
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
                       to="/study-groups" 
                       onClick={() => trackNavigation('/study-groups')}
                       className={`px-4 py-1 rounded-lg font-medium transition-all duration-200 ${
                           location.pathname.startsWith('/study-groups')
                               ? 'bg-orange-300 text-gray-800 shadow-md hover:text-gray-800'
                               : 'text-orange-200 hover:text-white hover:bg-orange-300/20'
                       }`}
                   >
                       Study Groups
                   </Link>
                   <Link 
                       to="/free-agents" 
                       onClick={() => trackNavigation('/free-agents')}
                       className={`px-4 py-1 rounded-lg font-medium transition-all duration-200 ${
                           location.pathname.startsWith('/free-agents')
                               ? 'bg-orange-300 text-gray-800 shadow-md hover:text-gray-800'
                               : 'text-orange-200 hover:text-white hover:bg-orange-300/20'
                       }`}
                   >
                       Free Agents
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
                       My Study Groups
                   </Link>

                   <Link 
                       to="/blog" 
                       onClick={() => trackNavigation('/blog')}
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
                                    onClick={() => {
                                        setShowLoginModal(true);
                                    }}
                                    className="bg-transparent text-orange-200 hover:text-white hover:bg-orange-300/20 rounded-lg p-2 focus:outline-none focus:ring-0 border-0 text-xs transition-colors"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => {
                                        setShowLoginModal(true);
                                    }}
                                    className="bg-[#00c9ac] text-white hover:bg-[#00b89a] rounded-lg p-2 focus:outline-none focus:ring-0 border-0 text-xs transition-colors"
                                >
                                    Sign Up
                                </button>
                            </>
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
                           to="/study-groups" 
                           onClick={() => setIsMobileMenuOpen(false)}
                           className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                               location.pathname.startsWith('/study-groups')
                                   ? 'bg-orange-300 text-gray-800 shadow-md hover:text-gray-800'
                                   : 'text-orange-200 hover:text-white hover:bg-orange-300/20'
                           }`}
                       >
                           Study Groups
                       </Link>
                       <Link 
                           to="/free-agents" 
                           onClick={() => setIsMobileMenuOpen(false)}
                           className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                               location.pathname.startsWith('/free-agents')
                                   ? 'bg-orange-300 text-gray-800 shadow-md hover:text-gray-800'
                                   : 'text-orange-200 hover:text-white hover:bg-orange-300/20'
                           }`}
                       >
                           Free Agents
                       </Link>
                       <Link 
                           to="/my-groups" 
                           onClick={() => setIsMobileMenuOpen(false)}
                           className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                               location.pathname.startsWith('/my-groups')
                                   ? 'bg-orange-300 text-gray-800 shadow-md hover:text-gray-800'
                                   : 'text-orange-200 hover:text-white hover:bg-orange-300/20'
                           }`}
                       >
                           My Study Groups
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
                           <>
                               {isProfileIncomplete() && (
                                   <button
                                       onClick={() => {
                                           navigate('/profile')
                                           setIsMobileMenuOpen(false)
                                       }}
                                       className="text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
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
                           </>
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
                           <div className="flex flex-col gap-2">
                               <button
                                   onClick={() => {
                                       setShowLoginModal(true);
                                       setIsMobileMenuOpen(false);
                                   }}
                                   className="bg-transparent text-orange-200 hover:text-white hover:bg-orange-300/20 rounded-lg p-2 focus:outline-none focus:ring-0 border-0 text-xs transition-colors"
                               >
                                   Login
                               </button>
                               <button
                                   onClick={() => {
                                       setShowLoginModal(true);
                                       setIsMobileMenuOpen(false);
                                   }}
                                   className="bg-[#00c9ac] text-white hover:bg-[#00b89a] rounded-lg p-2 focus:outline-none focus:ring-0 border-0 text-xs transition-colors"
                               >
                                   Sign Up
                               </button>
                           </div>
                       )}
                   </nav>
               </div>
           )}
           
           {/* Auth Modals */}
           <RiotLoginModal
               isOpen={showLoginModal}
               onClose={() => setShowLoginModal(false)}
           />
       </div>
   )
}